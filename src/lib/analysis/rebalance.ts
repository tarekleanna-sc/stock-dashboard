import { PositionWithMarketData } from '@/types/portfolio';
import { RebalanceSuggestion } from '@/types/analysis';

export function calculateRebalanceSuggestions(
  positions: PositionWithMarketData[],
  targetAllocations: Record<string, number>,
  totalValue: number,
  driftThreshold: number = 2
): RebalanceSuggestion[] {
  if (totalValue <= 0 || positions.length === 0) return [];

  const suggestions: RebalanceSuggestion[] = [];
  const positionTickers = new Set(positions.map((p) => p.ticker));

  // Analyze existing positions
  for (const position of positions) {
    const currentAllocation = (position.marketValue / totalValue) * 100;
    const targetAllocation = targetAllocations[position.ticker] ?? 0;
    const drift = currentAllocation - targetAllocation;

    let action: RebalanceSuggestion['action'] = 'hold';
    let sharesNeeded = 0;
    let dollarAmount = 0;
    let reason = '';

    if (Math.abs(drift) > driftThreshold) {
      if (drift > 0) {
        action = 'trim';
        dollarAmount = (drift / 100) * totalValue;
        sharesNeeded = position.currentPrice > 0
          ? -Math.floor(dollarAmount / position.currentPrice)
          : 0;
        reason = `Consider trimming ${position.ticker} — currently ${currentAllocation.toFixed(1)}% vs target ${targetAllocation.toFixed(1)}%. Reallocating ${dollarAmount.toFixed(0)} could improve balance.`;
      } else {
        action = 'buy';
        dollarAmount = (Math.abs(drift) / 100) * totalValue;
        sharesNeeded = position.currentPrice > 0
          ? Math.floor(dollarAmount / position.currentPrice)
          : 0;
        reason = `Great opportunity to add to ${position.ticker} — currently ${currentAllocation.toFixed(1)}% vs target ${targetAllocation.toFixed(1)}%. Adding ~$${dollarAmount.toFixed(0)} brings you closer to your goal.`;
      }
    } else {
      reason = `${position.ticker} is well-balanced at ${currentAllocation.toFixed(1)}% (target ${targetAllocation.toFixed(1)}%).`;
    }

    suggestions.push({
      ticker: position.ticker,
      companyName: position.companyName,
      currentAllocation,
      targetAllocation,
      drift,
      action,
      sharesNeeded,
      dollarAmount,
      reason,
    });
  }

  // Check for tickers in targets that are missing from positions
  for (const [ticker, target] of Object.entries(targetAllocations)) {
    if (!positionTickers.has(ticker) && target > 0) {
      const dollarAmount = (target / 100) * totalValue;
      suggestions.push({
        ticker,
        companyName: ticker,
        currentAllocation: 0,
        targetAllocation: target,
        drift: -target,
        action: 'buy',
        sharesNeeded: 0,
        dollarAmount,
        reason: `${ticker} is not in your portfolio yet — consider opening a position with ~$${dollarAmount.toFixed(0)} to reach your ${target.toFixed(1)}% target.`,
      });
    }
  }

  // Sort by absolute drift descending
  suggestions.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

  return suggestions;
}
