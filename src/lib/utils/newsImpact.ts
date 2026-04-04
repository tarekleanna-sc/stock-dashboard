/**
 * News Impact Classifier
 *
 * Analyzes news headlines and summaries to determine:
 * 1. Whether a news event is likely to affect the stock
 * 2. Whether the impact is on long-term fundamentals or short-term sentiment
 * 3. The severity of the impact (high / medium / low)
 *
 * This is a heuristic classifier — works client-side with zero API calls.
 */

export type ImpactType = 'fundamental' | 'sentiment' | 'noise';
export type ImpactSeverity = 'high' | 'medium' | 'low';
export type ImpactDirection = 'positive' | 'negative' | 'neutral';

export interface NewsImpactResult {
  type: ImpactType;
  severity: ImpactSeverity;
  direction: ImpactDirection;
  label: string;          // e.g. "Earnings Beat", "Analyst Upgrade"
  reasoning: string;      // short explanation
  longTermFundamental: boolean;
}

// ─── Keyword Dictionaries ───────────────────────────────────────────────────

interface Pattern {
  regex: RegExp;
  label: string;
  type: ImpactType;
  severity: ImpactSeverity;
  fundamental: boolean;
}

const POSITIVE_PATTERNS: Pattern[] = [
  { regex: /\b(earnings?\s*beat|beats?\s*estimates?|exceeds?\s*expectations?|blowout\s*quarter)\b/i, label: 'Earnings Beat', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(revenue\s*(?:growth|up|surge|jump|increase)|record\s*revenue|revenue\s*beat)\b/i, label: 'Revenue Growth', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(raises?\s*(?:guidance|outlook|forecast)|upward\s*revision|raises?\s*full[- ]year)\b/i, label: 'Raised Guidance', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(dividend\s*(?:increase|raise|hike|boost)|special\s*dividend)\b/i, label: 'Dividend Increase', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(buyback|share\s*repurchase|stock\s*repurchase)\b/i, label: 'Share Buyback', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(fda\s*approv|drug\s*approv|regulatory\s*approv)\b/i, label: 'FDA/Regulatory Approval', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(acquir|acquisition|merger|takeover|buyout)\b/i, label: 'M&A Activity', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(upgrade[sd]?|price\s*target\s*(?:raised?|increase|up))\b/i, label: 'Analyst Upgrade', type: 'sentiment', severity: 'medium', fundamental: false },
  { regex: /\b(new\s*(?:contract|deal|partnership)|major\s*(?:contract|deal|win))\b/i, label: 'New Contract/Deal', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(strong\s*(?:demand|growth|results|performance))\b/i, label: 'Strong Performance', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(ai\s*(?:revenue|growth|demand|boom)|artificial\s*intelligence\s*(?:revenue|growth))\b/i, label: 'AI Growth Driver', type: 'fundamental', severity: 'medium', fundamental: true },
];

const NEGATIVE_PATTERNS: Pattern[] = [
  { regex: /\b(earnings?\s*miss|misses?\s*estimates?|below\s*expectations?|disappointing\s*(?:results?|quarter))\b/i, label: 'Earnings Miss', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(revenue\s*(?:decline|drop|miss|fall|down)|weak\s*revenue)\b/i, label: 'Revenue Decline', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(lowers?\s*(?:guidance|outlook|forecast)|downward\s*revision|cuts?\s*(?:guidance|outlook))\b/i, label: 'Lowered Guidance', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(lawsuit|litigation|sued|legal\s*action|class\s*action|sec\s*investigation)\b/i, label: 'Legal/Regulatory Risk', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(layoff|workforce\s*reduction|job\s*cuts?|restructur)\b/i, label: 'Restructuring/Layoffs', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(downgrade[sd]?|price\s*target\s*(?:cut|lower|reduced?|down))\b/i, label: 'Analyst Downgrade', type: 'sentiment', severity: 'medium', fundamental: false },
  { regex: /\b(recall|safety\s*(?:concern|issue|warning)|data\s*breach|hack)\b/i, label: 'Safety/Security Issue', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(debt\s*(?:concern|warning|downgrade)|credit\s*(?:downgrade|warning))\b/i, label: 'Debt/Credit Risk', type: 'fundamental', severity: 'high', fundamental: true },
  { regex: /\b(tariff|trade\s*war|sanction|ban|antitrust)\b/i, label: 'Regulatory/Trade Risk', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(insider\s*sell|ceo\s*(?:depart|resign|step\s*down|fired)|executive\s*(?:exit|departure))\b/i, label: 'Leadership Change', type: 'fundamental', severity: 'medium', fundamental: true },
  { regex: /\b(dividend\s*(?:cut|suspend|eliminat))\b/i, label: 'Dividend Cut', type: 'fundamental', severity: 'high', fundamental: true },
];

const NOISE_PATTERNS: Pattern[] = [
  { regex: /\b(top\s*\d+\s*stock|stocks?\s*to\s*(?:buy|watch)|best\s*stock)\b/i, label: 'Listicle', type: 'noise', severity: 'low', fundamental: false },
  { regex: /\b(technical\s*analysis|chart\s*pattern|support\s*level|resistance\s*level)\b/i, label: 'Technical Analysis', type: 'noise', severity: 'low', fundamental: false },
  { regex: /\b(short\s*squeeze|meme\s*stock|reddit|wallstreetbets)\b/i, label: 'Social Media Buzz', type: 'sentiment', severity: 'low', fundamental: false },
  { regex: /\b(analyst\s*(?:says?|thinks?|believes?)|according\s*to\s*analysts?)\b/i, label: 'Analyst Commentary', type: 'sentiment', severity: 'low', fundamental: false },
  { regex: /\b(market\s*(?:movers?|wrap|recap|update|close)|wall\s*street\s*(?:wrap|today))\b/i, label: 'Market Recap', type: 'noise', severity: 'low', fundamental: false },
];

// ─── Price spike detection ───────────────────────────────────────────────────

export interface PriceContext {
  changePercent: number;       // Today's price change %
  avgVolume: number;           // Average volume
  currentVolume: number;       // Today's volume
  previousClose: number;
  currentPrice: number;
}

export function detectPriceSpike(ctx: PriceContext): {
  isSpike: boolean;
  spikeDirection: 'up' | 'down' | 'flat';
  spikeIntensity: 'major' | 'moderate' | 'minor' | 'none';
  volumeRatio: number;
} {
  const absChange = Math.abs(ctx.changePercent);
  const volumeRatio = ctx.avgVolume > 0 ? ctx.currentVolume / ctx.avgVolume : 1;

  let spikeIntensity: 'major' | 'moderate' | 'minor' | 'none' = 'none';
  if (absChange >= 5 || (absChange >= 3 && volumeRatio >= 2)) {
    spikeIntensity = 'major';
  } else if (absChange >= 3 || (absChange >= 1.5 && volumeRatio >= 1.5)) {
    spikeIntensity = 'moderate';
  } else if (absChange >= 1.5) {
    spikeIntensity = 'minor';
  }

  return {
    isSpike: spikeIntensity !== 'none',
    spikeDirection: ctx.changePercent > 0.1 ? 'up' : ctx.changePercent < -0.1 ? 'down' : 'flat',
    spikeIntensity,
    volumeRatio,
  };
}

// ─── Main classifier ────────────────────────────────────────────────────────

export function classifyNewsImpact(
  headline: string,
  summary: string,
  priceContext?: PriceContext,
): NewsImpactResult {
  const text = `${headline} ${summary}`;

  // Check positive patterns first
  for (const p of POSITIVE_PATTERNS) {
    if (p.regex.test(text)) {
      return {
        type: p.type,
        severity: p.severity,
        direction: 'positive',
        label: p.label,
        reasoning: buildReasoning(p, 'positive', priceContext),
        longTermFundamental: p.fundamental,
      };
    }
  }

  // Then negative
  for (const p of NEGATIVE_PATTERNS) {
    if (p.regex.test(text)) {
      return {
        type: p.type,
        severity: p.severity,
        direction: 'negative',
        label: p.label,
        reasoning: buildReasoning(p, 'negative', priceContext),
        longTermFundamental: p.fundamental,
      };
    }
  }

  // Check noise patterns
  for (const p of NOISE_PATTERNS) {
    if (p.regex.test(text)) {
      return {
        type: 'noise',
        severity: 'low',
        direction: 'neutral',
        label: p.label,
        reasoning: `This appears to be ${p.label.toLowerCase()} — unlikely to affect long-term fundamentals.`,
        longTermFundamental: false,
      };
    }
  }

  // If we have price context with a spike but no pattern match, flag it
  if (priceContext) {
    const spike = detectPriceSpike(priceContext);
    if (spike.isSpike) {
      return {
        type: 'sentiment',
        severity: spike.spikeIntensity === 'major' ? 'high' : 'medium',
        direction: spike.spikeDirection === 'up' ? 'positive' : spike.spikeDirection === 'down' ? 'negative' : 'neutral',
        label: 'Unusual Price Movement',
        reasoning: `Stock moved ${priceContext.changePercent > 0 ? '+' : ''}${priceContext.changePercent.toFixed(1)}% on ${spike.volumeRatio.toFixed(1)}x average volume. News content doesn't match a known fundamental pattern — monitor for follow-up.`,
        longTermFundamental: false,
      };
    }
  }

  // Default: unclassified noise
  return {
    type: 'noise',
    severity: 'low',
    direction: 'neutral',
    label: 'General News',
    reasoning: 'No significant fundamental or sentiment triggers detected in this article.',
    longTermFundamental: false,
  };
}

function buildReasoning(
  pattern: Pattern,
  direction: 'positive' | 'negative',
  priceContext?: PriceContext,
): string {
  const base = pattern.fundamental
    ? `${pattern.label} — this typically affects long-term fundamentals and valuation models.`
    : `${pattern.label} — this is primarily a sentiment driver and may not change underlying business fundamentals.`;

  if (priceContext) {
    const spike = detectPriceSpike(priceContext);
    if (spike.isSpike) {
      const priceStr = `Price ${direction === 'positive' ? 'up' : 'down'} ${Math.abs(priceContext.changePercent).toFixed(1)}% on ${spike.volumeRatio.toFixed(1)}x volume — confirms market is reacting to this news.`;
      return `${base} ${priceStr}`;
    }
  }

  return base;
}

// ─── Aggregate summary ──────────────────────────────────────────────────────

export interface NewsDigest {
  totalArticles: number;
  fundamentalCount: number;
  sentimentCount: number;
  noiseCount: number;
  highSeverityCount: number;
  netSentiment: 'bullish' | 'bearish' | 'mixed' | 'neutral';
}

export function summarizeNews(impacts: NewsImpactResult[]): NewsDigest {
  let positiveScore = 0;
  let negativeScore = 0;
  const severityWeight = { high: 3, medium: 2, low: 1 };

  const digest: NewsDigest = {
    totalArticles: impacts.length,
    fundamentalCount: 0,
    sentimentCount: 0,
    noiseCount: 0,
    highSeverityCount: 0,
    netSentiment: 'neutral',
  };

  for (const impact of impacts) {
    if (impact.type === 'fundamental') digest.fundamentalCount++;
    else if (impact.type === 'sentiment') digest.sentimentCount++;
    else digest.noiseCount++;

    if (impact.severity === 'high') digest.highSeverityCount++;

    const weight = severityWeight[impact.severity];
    if (impact.direction === 'positive') positiveScore += weight;
    if (impact.direction === 'negative') negativeScore += weight;
  }

  const diff = positiveScore - negativeScore;
  const total = positiveScore + negativeScore;
  if (total === 0) digest.netSentiment = 'neutral';
  else if (diff > 2) digest.netSentiment = 'bullish';
  else if (diff < -2) digest.netSentiment = 'bearish';
  else digest.netSentiment = 'mixed';

  return digest;
}
