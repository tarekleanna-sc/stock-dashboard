'use client';

import { useEffect, useState } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import type { PositionWithMarketData, BrokerAccount } from '@/types/portfolio';

function fmt(n: number, d = 2) { return n.toFixed(d); }
function currency(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function pct(n: number) { return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`; }

function glColor(n: number) { return n >= 0 ? '#16a34a' : '#dc2626'; }

function SummaryBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 18px', minWidth: 150 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

interface ReportData {
  accounts: BrokerAccount[];
  positions: PositionWithMarketData[];
  date: string;
}

export default function ReportPage() {
  const { accounts, closedPositions } = usePortfolioStore();
  const { enrichedPositions } = usePortfolioValue();

  const [ready, setReady] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (enrichedPositions.length > 0 || accounts.length > 0) {
      setData({
        accounts,
        positions: enrichedPositions,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
      setReady(true);
    }
  }, [enrichedPositions, accounts]);

  if (!ready || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#6b7280' }}>Loading portfolio data...</p>
      </div>
    );
  }

  const { positions } = data;

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCostBasis, 0);
  const totalGL = totalValue - totalCost;
  const totalGLPct = totalCost > 0 ? (totalGL / totalCost) * 100 : 0;

  // Sector breakdown
  const sectorMap = new Map<string, number>();
  for (const p of positions) {
    sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + p.marketValue);
  }
  const sectors = [...sectorMap.entries()].sort((a, b) => b[1] - a[1]);

  // Portfolio beta
  const weightedBeta = totalValue > 0
    ? positions.reduce((s, p) => s + (p.beta ?? 1) * p.marketValue, 0) / totalValue
    : 1;

  return (
    <div style={{ background: '#fff', color: '#111827', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: 13, lineHeight: 1.5 }}>

      {/* Print Button — hidden when printing */}
      <div className="no-print" style={{ background: '#0d0d2b', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: 16 }}>StockDash</span>
        <span style={{ color: '#ffffff60', fontSize: 13 }}>Portfolio Report Preview</span>
        <button
          onClick={() => window.print()}
          style={{ marginLeft: 'auto', background: '#22d3ee', color: '#000', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          ⬇ Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: 'transparent', color: '#ffffff60', border: '1px solid #ffffff20', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      {/* Report Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, borderBottom: '2px solid #0d0d2b', paddingBottom: 20 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0d0d2b', marginBottom: 4 }}>Portfolio Report</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Generated on {data.date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0d0d2b' }}>{currency(totalValue)}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Portfolio Value</div>
          </div>
        </div>

        {/* Summary Row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
          <SummaryBox label="Total Value" value={currency(totalValue)} />
          <SummaryBox label="Total Cost Basis" value={currency(totalCost)} />
          <SummaryBox
            label="Total Gain / Loss"
            value={currency(totalGL)}
            sub={pct(totalGLPct)}
          />
          <SummaryBox label="Positions" value={String(positions.length)} sub={`${data.accounts.length} account${data.accounts.length !== 1 ? 's' : ''}`} />
          <SummaryBox label="Portfolio Beta" value={fmt(weightedBeta)} />
        </div>

        {/* Holdings Table */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0d0d2b', marginBottom: 10 }}>Open Positions</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                {['Ticker', 'Company', 'Account', 'Shares', 'Avg Cost', 'Price', 'Mkt Value', 'G/L ($)', 'G/L (%)', 'Day', 'Sector'].map((h) => (
                  <th key={h} style={{ padding: '7px 8px', textAlign: h === 'Ticker' || h === 'Company' || h === 'Account' || h === 'Sector' ? 'left' : 'right', fontWeight: 600, color: '#374151', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.sort((a, b) => b.marketValue - a.marketValue).map((p, i) => {
                const account = data.accounts.find((a) => a.id === p.accountId);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0d0d2b' }}>{p.ticker}</td>
                    <td style={{ padding: '6px 8px', color: '#374151', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.companyName}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{account?.name ?? '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{fmt(p.shares, 3)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>${fmt(p.costBasisPerShare)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>${fmt(p.currentPrice)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{currency(p.marketValue)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: glColor(p.gainLoss) }}>{currency(p.gainLoss)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: glColor(p.gainLossPercent) }}>{pct(p.gainLossPercent)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: glColor(p.dayChangePercent) }}>{pct(p.dayChangePercent)}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>{p.sector}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f3f4f6', borderTop: '2px solid #d1d5db' }}>
                <td colSpan={6} style={{ padding: '7px 8px', fontWeight: 700, color: '#0d0d2b' }}>TOTAL</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>{currency(totalValue)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: glColor(totalGL) }}>{currency(totalGL)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: glColor(totalGLPct) }}>{pct(totalGLPct)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Accounts Summary + Sector Breakdown side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 }}>

          {/* Account Totals */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0d0d2b', marginBottom: 10 }}>Account Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                  {['Account', 'Type', 'Value', 'G/L'].map((h) => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Account' || h === 'Type' ? 'left' : 'right', fontWeight: 600, color: '#374151', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((acc, i) => {
                  const acctPos = positions.filter((p) => p.accountId === acc.id);
                  const mkt = acctPos.reduce((s, p) => s + p.marketValue, 0);
                  const cost = acctPos.reduce((s, p) => s + p.totalCostBasis, 0);
                  const gl = mkt - cost;
                  return (
                    <tr key={acc.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{acc.name}</td>
                      <td style={{ padding: '6px 8px', color: '#6b7280' }}>{acc.accountType}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{currency(mkt)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: glColor(gl) }}>{currency(gl)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sector Allocation */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0d0d2b', marginBottom: 10 }}>Sector Allocation</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                  {['Sector', 'Value', 'Allocation'].map((h) => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Sector' ? 'left' : 'right', fontWeight: 600, color: '#374151', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectors.map(([sector, val], i) => {
                  const alloc = totalValue > 0 ? (val / totalValue) * 100 : 0;
                  return (
                    <tr key={sector} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '6px 8px' }}>{sector}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{currency(val)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <div style={{ width: 40, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${alloc}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                          </div>
                          <span>{alloc.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closed Positions */}
        {closedPositions.length > 0 && (
          <div className="page-break" style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0d0d2b', marginBottom: 10 }}>Realized Gains & Losses</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                  {['Ticker', 'Shares', 'Avg Cost', 'Sale Price', 'Realized G/L', 'Return', 'Close Date'].map((h) => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Ticker' ? 'left' : 'right', fontWeight: 600, color: '#374151', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closedPositions.sort((a, b) => b.closedAt.localeCompare(a.closedAt)).map((cp, i) => (
                  <tr key={cp.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>{cp.ticker}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{fmt(cp.shares, 3)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>${fmt(cp.costBasisPerShare)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>${fmt(cp.salePrice)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: glColor(cp.realizedGain) }}>{currency(cp.realizedGain)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: glColor(cp.realizedGainPct) }}>{pct(cp.realizedGainPct)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#6b7280' }}>{cp.closedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 16 }}>
          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>
            Generated by StockDash on {data.date}. This report is for informational purposes only and does not constitute investment advice.
            Past performance is not indicative of future results. Market data may be delayed.
          </p>
        </div>
      </div>
    </div>
  );
}
