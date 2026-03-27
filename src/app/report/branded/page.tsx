'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { loadBranding, type AdvisorBranding } from '@/app/(dashboard)/settings/branding/page';
import type { PositionWithMarketData, BrokerAccount } from '@/types/portfolio';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) { return n.toFixed(d); }
function currency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function pct(n: number) { return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`; }
function glColor(n: number) { return n >= 0 ? '#15803d' : '#dc2626'; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function BrandedHeader({ branding, clientName, date, totalValue }: {
  branding: AdvisorBranding;
  clientName: string;
  date: string;
  totalValue: number;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Firm header bar */}
      <div style={{
        background: branding.accentColor,
        color: '#fff',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '8px 8px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {branding.firmLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.firmLogo}
              alt={branding.firmName}
              style={{ height: 40, maxWidth: 140, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div>
            {branding.firmName && (
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{branding.firmName}</div>
            )}
            {branding.firmTagline && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{branding.firmTagline}</div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, opacity: 0.8 }}>
          {branding.contactEmail && <div>{branding.contactEmail}</div>}
          {branding.contactPhone && <div>{branding.contactPhone}</div>}
          {branding.contactWebsite && <div>{branding.contactWebsite}</div>}
        </div>
      </div>

      {/* Report title bar */}
      <div style={{
        background: '#f8fafc',
        border: `1px solid ${branding.accentColor}20`,
        borderTop: 'none',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '0 0 8px 8px',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Portfolio Report</div>
          {clientName && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Prepared for: <span style={{ fontWeight: 600, color: '#0f172a' }}>{clientName}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: branding.accentColor }}>{currency(totalValue)}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Total Value · {date}</div>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ border: `1px solid ${accent}20`, borderRadius: 8, padding: '12px 16px', minWidth: 130, flex: 1 }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Main report (inner) ──────────────────────────────────────────────────────

function BrandedReportInner() {
  const searchParams = useSearchParams();
  const clientName = searchParams.get('client') ?? '';

  const { accounts, closedPositions } = usePortfolioStore();
  const { enrichedPositions } = usePortfolioValue();

  const [branding, setBranding] = useState<AdvisorBranding | null>(null);
  const [ready, setReady] = useState(false);
  const [date] = useState(() =>
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  );

  useEffect(() => {
    setBranding(loadBranding());
  }, []);

  useEffect(() => {
    if (branding && (enrichedPositions.length > 0 || accounts.length > 0)) {
      setReady(true);
    }
  }, [branding, enrichedPositions, accounts]);

  if (!ready || !branding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#94a3b8' }}>Loading report…</p>
      </div>
    );
  }

  const positions = enrichedPositions;
  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.totalCostBasis, 0);
  const totalGL = totalValue - totalCost;
  const totalGLPct = totalCost > 0 ? (totalGL / totalCost) * 100 : 0;

  const sectorMap = new Map<string, number>();
  for (const p of positions) {
    sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + p.marketValue);
  }
  const sectors = [...sectorMap.entries()].sort((a, b) => b[1] - a[1]);

  const weightedBeta = totalValue > 0
    ? positions.reduce((s, p) => s + (p.beta ?? 1) * p.marketValue, 0) / totalValue
    : 1;

  const accent = branding.accentColor || '#0d0d2b';

  return (
    <div style={{
      background: '#fff',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
      fontSize: 12,
      lineHeight: 1.5,
      minHeight: '100vh',
    }}>

      {/* Print / Close bar — hidden when printing */}
      <div className="no-print" style={{
        background: accent,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
          {branding.firmName || 'Branded Report'} · Preview
        </span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          {clientName ? `Client: ${clientName}` : 'No client specified'}
        </span>
        <button
          onClick={() => window.print()}
          style={{ marginLeft: 'auto', background: '#fff', color: accent, border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          ⬇ Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>

        {/* Branded header */}
        <BrandedHeader
          branding={branding}
          clientName={clientName}
          date={date}
          totalValue={totalValue}
        />

        {/* Summary metrics */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          <SummaryBox label="Portfolio Value" value={currency(totalValue)} accent={accent} />
          <SummaryBox label="Total Cost Basis" value={currency(totalCost)} accent={accent} />
          <SummaryBox
            label="Total Gain / Loss"
            value={currency(totalGL)}
            sub={pct(totalGLPct)}
            accent={accent}
          />
          <SummaryBox
            label="Positions"
            value={String(positions.length)}
            sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            accent={accent}
          />
          <SummaryBox label="Portfolio Beta" value={fmt(weightedBeta)} accent={accent} />
        </div>

        {/* Holdings table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 8, borderBottom: `2px solid ${accent}`, paddingBottom: 6 }}>
            Holdings
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: `${accent}10`, borderBottom: `1px solid ${accent}30` }}>
                {['Symbol', 'Company', 'Account', 'Shares', 'Avg Cost', 'Price', 'Market Value', 'G/L ($)', 'G/L (%)', 'Day Chg', 'Sector'].map((h) => (
                  <th key={h} style={{
                    padding: '7px 7px',
                    textAlign: h === 'Symbol' || h === 'Company' || h === 'Account' || h === 'Sector' ? 'left' : 'right',
                    fontWeight: 700,
                    color: accent,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.sort((a, b) => b.marketValue - a.marketValue).map((p, i) => {
                const account = accounts.find((a) => a.id === p.accountId);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '6px 7px', fontWeight: 700, color: accent }}>{p.ticker}</td>
                    <td style={{ padding: '6px 7px', color: '#374151', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.companyName}</td>
                    <td style={{ padding: '6px 7px', color: '#64748b' }}>{account?.name ?? '—'}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right' }}>{fmt(p.shares, 3)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right' }}>${fmt(p.costBasisPerShare)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right' }}>${fmt(p.currentPrice)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right', fontWeight: 700 }}>{currency(p.marketValue)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right', color: glColor(p.gainLoss) }}>{currency(p.gainLoss)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right', color: glColor(p.gainLossPercent) }}>{pct(p.gainLossPercent)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right', color: glColor(p.dayChangePercent) }}>{pct(p.dayChangePercent)}</td>
                    <td style={{ padding: '6px 7px', color: '#64748b', whiteSpace: 'nowrap' }}>{p.sector}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: `${accent}08`, borderTop: `2px solid ${accent}30` }}>
                <td colSpan={6} style={{ padding: '7px 7px', fontWeight: 700, color: accent }}>TOTAL</td>
                <td style={{ padding: '7px 7px', textAlign: 'right', fontWeight: 700 }}>{currency(totalValue)}</td>
                <td style={{ padding: '7px 7px', textAlign: 'right', fontWeight: 700, color: glColor(totalGL) }}>{currency(totalGL)}</td>
                <td style={{ padding: '7px 7px', textAlign: 'right', fontWeight: 700, color: glColor(totalGLPct) }}>{pct(totalGLPct)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Account + Sector side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 8, borderBottom: `2px solid ${accent}`, paddingBottom: 6 }}>
              Account Summary
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: `${accent}10`, borderBottom: `1px solid ${accent}30` }}>
                  {['Account', 'Type', 'Value', 'G/L'].map((h) => (
                    <th key={h} style={{ padding: '6px 7px', textAlign: h === 'Account' || h === 'Type' ? 'left' : 'right', fontWeight: 700, color: accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc, i) => {
                  const acctPos = positions.filter((p) => p.accountId === acc.id);
                  const mkt = acctPos.reduce((s, p) => s + p.marketValue, 0);
                  const cost = acctPos.reduce((s, p) => s + p.totalCostBasis, 0);
                  const gl = mkt - cost;
                  return (
                    <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 7px', fontWeight: 600 }}>{acc.name}</td>
                      <td style={{ padding: '6px 7px', color: '#64748b' }}>{acc.accountType}</td>
                      <td style={{ padding: '6px 7px', textAlign: 'right' }}>{currency(mkt)}</td>
                      <td style={{ padding: '6px 7px', textAlign: 'right', color: glColor(gl) }}>{currency(gl)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 8, borderBottom: `2px solid ${accent}`, paddingBottom: 6 }}>
              Sector Allocation
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: `${accent}10`, borderBottom: `1px solid ${accent}30` }}>
                  {['Sector', 'Value', 'Allocation'].map((h) => (
                    <th key={h} style={{ padding: '6px 7px', textAlign: h === 'Sector' ? 'left' : 'right', fontWeight: 700, color: accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectors.map(([sector, val], i) => {
                  const alloc = totalValue > 0 ? (val / totalValue) * 100 : 0;
                  return (
                    <tr key={sector} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 7px' }}>{sector}</td>
                      <td style={{ padding: '6px 7px', textAlign: 'right' }}>{currency(val)}</td>
                      <td style={{ padding: '6px 7px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <div style={{ width: 40, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${alloc}%`, height: '100%', background: accent, borderRadius: 3 }} />
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
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 8, borderBottom: `2px solid ${accent}`, paddingBottom: 6 }}>
              Realized Gains & Losses
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: `${accent}10`, borderBottom: `1px solid ${accent}30` }}>
                  {['Symbol', 'Shares', 'Avg Cost', 'Sale Price', 'Realized G/L', 'Return', 'Close Date'].map((h) => (
                    <th key={h} style={{ padding: '6px 7px', textAlign: h === 'Symbol' ? 'left' : 'right', fontWeight: 700, color: accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closedPositions.sort((a, b) => b.closedAt.localeCompare(a.closedAt)).map((cp, i) => (
                  <tr key={cp.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '6px 7px', fontWeight: 700, color: accent }}>{cp.ticker}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right' }}>{fmt(cp.shares, 3)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right' }}>${fmt(cp.costBasisPerShare)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right' }}>${fmt(cp.salePrice)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right', color: glColor(cp.realizedGain) }}>{currency(cp.realizedGain)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right', color: glColor(cp.realizedGainPct) }}>{pct(cp.realizedGainPct)}</td>
                    <td style={{ padding: '6px 7px', textAlign: 'right', color: '#64748b' }}>{cp.closedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Branded footer */}
        <div style={{ borderTop: `2px solid ${accent}20`, paddingTop: 14, marginTop: 16 }}>
          {branding.firmName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{branding.firmName}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {[branding.contactEmail, branding.contactPhone, branding.contactWebsite].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
          <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            {branding.disclaimerText}
          </p>
          <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 6 }}>
            Report generated on {date} using StockDash.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BrandedReportPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading…</div>}>
      <BrandedReportInner />
    </Suspense>
  );
}
