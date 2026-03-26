/**
 * Portfolio Export Utility
 * Generates a multi-section CSV that opens in Excel as a clean table.
 * No external dependencies required.
 */
import type { PositionWithMarketData, BrokerAccount, ClosedPosition } from '@/types/portfolio';

function esc(v: string | number | undefined | null): string {
  const s = String(v ?? '');
  // Wrap in quotes if contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: (string | number | undefined | null)[]): string {
  return cells.map(esc).join(',');
}

function formatNum(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function exportPortfolioToCSV(
  positions: PositionWithMarketData[],
  accounts: BrokerAccount[],
  closedPositions: ClosedPosition[],
  filename?: string
): void {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lines: string[] = [];

  // ─── Header ──────────────────────────────────────────────────────────────
  lines.push(row('PORTFOLIO EXPORT'));
  lines.push(row('Generated', date));
  lines.push(row(''));

  // ─── Summary ─────────────────────────────────────────────────────────────
  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCostBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  lines.push(row('PORTFOLIO SUMMARY'));
  lines.push(row('Total Market Value', formatCurrency(totalValue)));
  lines.push(row('Total Cost Basis', formatCurrency(totalCost)));
  lines.push(row('Total Gain/Loss', formatCurrency(totalGain)));
  lines.push(row('Total Return %', `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`));
  lines.push(row('Total Positions', positions.length.toString()));
  lines.push(row('Total Accounts', accounts.length.toString()));
  lines.push(row(''));

  // ─── Holdings by Account ─────────────────────────────────────────────────
  lines.push(row('OPEN POSITIONS'));
  lines.push(row(
    'Account', 'Broker', 'Account Type',
    'Ticker', 'Company',
    'Shares', 'Avg Cost/Share', 'Current Price',
    'Cost Basis', 'Market Value',
    'Gain/Loss ($)', 'Gain/Loss (%)',
    'Day Change (%)', 'Sector',
    '52-Week High', '52-Week Low', 'Beta'
  ));

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  for (const pos of positions) {
    const account = accountMap.get(pos.accountId);
    lines.push(row(
      account?.name ?? '',
      account?.broker ?? '',
      account?.accountType ?? '',
      pos.ticker,
      pos.companyName,
      formatNum(pos.shares, 4),
      formatNum(pos.costBasisPerShare),
      formatNum(pos.currentPrice),
      formatNum(pos.totalCostBasis),
      formatNum(pos.marketValue),
      formatNum(pos.gainLoss),
      `${pos.gainLossPercent >= 0 ? '+' : ''}${formatNum(pos.gainLossPercent)}%`,
      `${pos.dayChangePercent >= 0 ? '+' : ''}${formatNum(pos.dayChangePercent)}%`,
      pos.sector,
      formatNum(pos.yearHigh),
      formatNum(pos.yearLow),
      formatNum(pos.beta)
    ));
  }

  // ─── Account subtotals ────────────────────────────────────────────────────
  lines.push(row(''));
  lines.push(row('ACCOUNT TOTALS'));
  lines.push(row('Account', 'Broker', 'Type', 'Market Value', 'Cost Basis', 'Gain/Loss ($)', 'Gain/Loss (%)', 'Cash Balance'));

  for (const account of accounts) {
    const acctPos = positions.filter((p) => p.accountId === account.id);
    const mkt = acctPos.reduce((s, p) => s + p.marketValue, 0);
    const cost = acctPos.reduce((s, p) => s + p.totalCostBasis, 0);
    const gl = mkt - cost;
    const glPct = cost > 0 ? (gl / cost) * 100 : 0;
    lines.push(row(
      account.name,
      account.broker,
      account.accountType,
      formatNum(mkt),
      formatNum(cost),
      formatNum(gl),
      `${glPct >= 0 ? '+' : ''}${formatNum(glPct)}%`,
      formatNum(account.cashBalance ?? 0)
    ));
  }

  // ─── Sector allocation ────────────────────────────────────────────────────
  lines.push(row(''));
  lines.push(row('SECTOR ALLOCATION'));
  lines.push(row('Sector', 'Market Value', 'Allocation %'));

  const sectorMap = new Map<string, number>();
  for (const pos of positions) {
    sectorMap.set(pos.sector, (sectorMap.get(pos.sector) ?? 0) + pos.marketValue);
  }
  const sortedSectors = [...sectorMap.entries()].sort((a, b) => b[1] - a[1]);
  for (const [sector, val] of sortedSectors) {
    const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
    lines.push(row(sector, formatNum(val), `${pct.toFixed(1)}%`));
  }

  // ─── Closed positions ─────────────────────────────────────────────────────
  if (closedPositions.length > 0) {
    lines.push(row(''));
    lines.push(row('CLOSED POSITIONS (REALIZED GAINS/LOSSES)'));
    lines.push(row('Ticker', 'Shares', 'Avg Cost/Share', 'Sale Price/Share', 'Realized Gain/Loss ($)', 'Realized Gain/Loss (%)', 'Close Date', 'Notes'));

    for (const cp of closedPositions) {
      lines.push(row(
        cp.ticker,
        formatNum(cp.shares, 4),
        formatNum(cp.costBasisPerShare),
        formatNum(cp.salePrice),
        formatNum(cp.realizedGain),
        `${cp.realizedGainPct >= 0 ? '+' : ''}${formatNum(cp.realizedGainPct)}%`,
        cp.closedAt,
        cp.notes ?? ''
      ));
    }

    // Tax-year summary
    const yearMap = new Map<number, number>();
    for (const cp of closedPositions) {
      const year = new Date(cp.closedAt).getFullYear();
      yearMap.set(year, (yearMap.get(year) ?? 0) + cp.realizedGain);
    }
    lines.push(row(''));
    lines.push(row('REALIZED P&L BY TAX YEAR'));
    lines.push(row('Year', 'Realized Gain/Loss ($)'));
    for (const [year, gain] of [...yearMap.entries()].sort((a, b) => b[0] - a[0])) {
      lines.push(row(year.toString(), formatNum(gain)));
    }
  }

  // ─── Download ─────────────────────────────────────────────────────────────
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `portfolio-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
