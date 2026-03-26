'use client';

import { useState, useRef, useCallback } from 'react';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useSupabase } from '@/providers/SupabaseProvider';
import { BrokerAccount } from '@/types/portfolio';

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim().replace(/^\$/, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^\$/, ''));
  return result;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVRow(lines[0]);
  const rows = lines.slice(1).map(parseCSVRow);
  return { headers, rows };
}

// ─── Column Auto-Detection ────────────────────────────────────────────────────

const SYMBOL_PATTERNS = /^(symbol|ticker|stock|security|description|instrument)$/i;
const SHARES_PATTERNS = /^(quantity|shares|qty|units|amount|position)$/i;
const COST_PATTERNS = /^(average.?cost|avg.?cost|cost.?basis|cost.?per.?share|purchase.?price|average.?price|avg.?price|unit.?cost)$/i;

function autoDetectColumns(headers: string[]) {
  return {
    symbolCol: headers.find(h => SYMBOL_PATTERNS.test(h.trim())) ?? '',
    sharesCol: headers.find(h => SHARES_PATTERNS.test(h.trim())) ?? '',
    costCol:   headers.find(h => COST_PATTERNS.test(h.trim())) ?? '',
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'upload' | 'map' | 'preview' | 'done';

interface ParsedRow {
  id: number;
  symbol: string;
  shares: number;
  costBasis: number;
  isValid: boolean;
  errors: string[];
  selected: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accounts: BrokerAccount[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CSVImportModal({ isOpen, onClose, accounts }: Props) {
  const { supabase, user } = useSupabase();
  const { addPosition } = usePortfolioStore();

  const [step, setStep] = useState<Step>('upload');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  // Parsed CSV state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Column mapping
  const [symbolCol, setSymbolCol] = useState('');
  const [sharesCol, setSharesCol] = useState('');
  const [costCol,   setCostCol]   = useState('');
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id ?? '');

  // Preview state
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setSymbolCol('');
    setSharesCol('');
    setCostCol('');
    setImportedCount(0);
  }

  function handleClose() {
    reset();
    onClose();
  }

  // ── File ingestion ──────────────────────────────────────────────────────────

  function ingestFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a .csv file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { alert('Could not parse CSV — make sure it has headers.'); return; }
      setHeaders(h);
      setRawRows(r);
      const detected = autoDetectColumns(h);
      setSymbolCol(detected.symbolCol);
      setSharesCol(detected.sharesCol);
      setCostCol(detected.costCol);
      if (accounts.length > 0) setTargetAccountId(accounts[0].id);
      setStep('map');
    };
    reader.readAsText(file);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) ingestFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) ingestFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build preview rows from mapping ────────────────────────────────────────

  function buildPreview() {
    const symIdx  = headers.indexOf(symbolCol);
    const shrIdx  = headers.indexOf(sharesCol);
    const cstIdx  = headers.indexOf(costCol);

    const rows: ParsedRow[] = rawRows
      .map((row, i) => {
        const symbol  = symIdx  >= 0 ? row[symIdx]?.trim().toUpperCase()  : '';
        const sharesRaw = shrIdx >= 0 ? row[shrIdx]?.trim().replace(/,/g, '') : '';
        const costRaw   = cstIdx >= 0 ? row[cstIdx]?.trim().replace(/,/g, '') : '';

        const shares   = parseFloat(sharesRaw);
        const costBasis = parseFloat(costRaw);
        const errors: string[] = [];

        if (!symbol)            errors.push('Missing symbol');
        if (isNaN(shares) || shares <= 0) errors.push('Invalid shares');
        if (isNaN(costBasis) || costBasis <= 0) errors.push('Invalid cost basis');

        return { id: i, symbol, shares, costBasis, isValid: errors.length === 0, errors, selected: errors.length === 0 };
      })
      .filter((r) => r.symbol || r.shares || r.costBasis); // skip blank rows

    setPreviewRows(rows);
    setStep('preview');
  }

  function toggleRow(id: number) {
    setPreviewRows((rows) => rows.map((r) => r.id === id ? { ...r, selected: !r.selected } : r));
  }

  function toggleAll(val: boolean) {
    setPreviewRows((rows) => rows.map((r) => r.isValid ? { ...r, selected: val } : r));
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!user || !targetAccountId) return;
    const toImport = previewRows.filter((r) => r.selected && r.isValid);
    if (toImport.length === 0) return;

    setImporting(true);
    let count = 0;
    for (const row of toImport) {
      try {
        await addPosition(
          { accountId: targetAccountId, ticker: row.symbol, shares: row.shares, costBasisPerShare: row.costBasis },
          supabase,
          user.id
        );
        count++;
      } catch { /* skip failures */ }
    }
    setImportedCount(count);
    setImporting(false);
    setStep('done');
  }

  const selectedCount = previewRows.filter((r) => r.selected && r.isValid).length;
  const validCount    = previewRows.filter((r) => r.isValid).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <GlassModal isOpen={isOpen} onClose={handleClose} title="Import Positions from CSV">
      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="space-y-5">
          <p className="text-sm text-white/60">
            Upload a CSV export from your broker. Supported: Fidelity, Schwab, Robinhood,
            TD Ameritrade, IBKR, or any CSV with Symbol / Shares / Cost columns.
          </p>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 cursor-pointer transition-all ${
              dragging
                ? 'border-cyan-400/60 bg-cyan-500/10'
                : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
            }`}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-white/80">Drop your CSV here, or click to browse</p>
              <p className="text-xs text-white/40 mt-1">.csv files only</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Format hint */}
          <GlassCard padding="sm" className="bg-white/[0.02]">
            <p className="text-xs text-white/40 font-medium mb-2">Expected CSV format (any of these column names work):</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-white/60 font-semibold mb-1">Symbol</p>
                <p className="text-white/30">Symbol, Ticker, Security</p>
              </div>
              <div>
                <p className="text-white/60 font-semibold mb-1">Shares</p>
                <p className="text-white/30">Quantity, Shares, Qty</p>
              </div>
              <div>
                <p className="text-white/60 font-semibold mb-1">Cost Basis</p>
                <p className="text-white/30">Average Cost, Cost Basis, Avg Price</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── Step 2: Map Columns ── */}
      {step === 'map' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <p className="text-sm text-white/70">
              Found <span className="text-white font-semibold">{rawRows.length}</span> rows in{' '}
              <span className="text-cyan-400">{fileName}</span>. Map the columns below.
            </p>
          </div>

          <div className="space-y-3">
            {(
              [
                { label: 'Symbol Column', value: symbolCol, set: setSymbolCol, required: true },
                { label: 'Shares Column', value: sharesCol, set: setSharesCol, required: true },
                { label: 'Cost Basis per Share Column', value: costCol, set: setCostCol, required: true },
              ] as const
            ).map(({ label, value, set, required }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  {label} {required && <span className="text-rose-400">*</span>}
                </label>
                <select
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 outline-none focus:border-cyan-500/40"
                >
                  <option value="">— Select column —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">
                Import into Account <span className="text-rose-400">*</span>
              </label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 outline-none focus:border-cyan-500/40"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <GlassButton variant="ghost" onClick={reset}>Back</GlassButton>
            <GlassButton
              onClick={buildPreview}
              disabled={!symbolCol || !sharesCol || !costCol || !targetAccountId}
            >
              Preview Import →
            </GlassButton>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              <span className="text-white font-semibold">{validCount}</span> valid rows detected.
              Select which to import.
            </p>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)}  className="text-xs text-cyan-400 hover:text-cyan-300">All</button>
              <span className="text-white/20">|</span>
              <button onClick={() => toggleAll(false)} className="text-xs text-white/40 hover:text-white/60">None</button>
            </div>
          </div>

          {/* Preview table */}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#0d0d2b] border-b border-white/[0.08]">
                <tr>
                  <th className="py-2 pl-3 pr-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCount === validCount && validCount > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="accent-cyan-400"
                    />
                  </th>
                  <th className="py-2 px-2 text-left text-xs text-white/40 font-medium">Symbol</th>
                  <th className="py-2 px-2 text-right text-xs text-white/40 font-medium">Shares</th>
                  <th className="py-2 px-2 text-right text-xs text-white/40 font-medium">Avg Cost</th>
                  <th className="py-2 pl-2 pr-3 text-left text-xs text-white/40 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-white/[0.04] last:border-0 transition-colors ${
                      row.isValid
                        ? 'hover:bg-white/[0.03] cursor-pointer'
                        : 'opacity-40'
                    }`}
                    onClick={() => row.isValid && toggleRow(row.id)}
                  >
                    <td className="py-2.5 pl-3 pr-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={!row.isValid}
                        onChange={() => toggleRow(row.id)}
                        className="accent-cyan-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-white">{row.symbol || '—'}</td>
                    <td className="py-2.5 px-2 text-right text-white/70 tabular-nums">
                      {isNaN(row.shares) ? '—' : row.shares}
                    </td>
                    <td className="py-2.5 px-2 text-right text-white/70 tabular-nums">
                      {isNaN(row.costBasis) ? '—' : `$${row.costBasis.toFixed(2)}`}
                    </td>
                    <td className="py-2.5 pl-2 pr-3">
                      {row.isValid ? (
                        <span className="text-emerald-400 text-xs">✓ Valid</span>
                      ) : (
                        <span className="text-rose-400 text-xs">{row.errors.join(', ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep('map')} className="text-sm text-white/40 hover:text-white/70 transition-colors">
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">{selectedCount} position{selectedCount !== 1 ? 's' : ''} selected</span>
              <GlassButton
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
              >
                {importing ? 'Importing…' : `Import ${selectedCount} Position${selectedCount !== 1 ? 's' : ''}`}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Import Complete</p>
            <p className="text-sm text-white/50 mt-1">
              Successfully imported <span className="text-emerald-400 font-semibold">{importedCount}</span> position{importedCount !== 1 ? 's' : ''} into your portfolio.
            </p>
          </div>
          <GlassButton onClick={handleClose}>Done</GlassButton>
        </div>
      )}
    </GlassModal>
  );
}
