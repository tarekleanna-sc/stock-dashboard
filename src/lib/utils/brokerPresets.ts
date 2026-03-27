/**
 * Broker CSV Export Presets
 *
 * Each preset defines:
 * - The exact column headers in that broker's CSV export
 * - Optional special handling (e.g., total cost ÷ quantity → per-share cost)
 * - Sample instructions for how to export from that broker
 */

export type BrokerPresetId =
  | 'fidelity'
  | 'schwab'
  | 'td_ameritrade'
  | 'ibkr'
  | 'robinhood'
  | 'vanguard'
  | 'etrade'
  | 'webull'
  | 'generic';

export interface BrokerPreset {
  id: BrokerPresetId;
  label: string;
  symbolCol: string;
  sharesCol: string;
  /**
   * costCol: the column to use for cost per share.
   * If costIsTotal = true, the value will be divided by shares to get per-share cost.
   */
  costCol: string;
  /** If true, costCol is a total basis value that needs to be divided by shares */
  costIsTotal?: boolean;
  /** Additional columns to skip / treat as non-position rows */
  skipIfColumnEquals?: { col: string; value: string };
  /** How to export from this broker */
  exportInstructions: string;
  /** Example CSV column names shown to user */
  columnHint: string;
}

export const BROKER_PRESETS: Record<BrokerPresetId, BrokerPreset> = {
  fidelity: {
    id: 'fidelity',
    label: 'Fidelity',
    symbolCol: 'Symbol',
    sharesCol: 'Quantity',
    costCol: 'Average Cost Basis',
    exportInstructions:
      'In Fidelity, go to Accounts → Positions → Download as CSV. The "Average Cost Basis" column gives per-share cost.',
    columnHint: 'Symbol, Quantity, Average Cost Basis',
  },
  schwab: {
    id: 'schwab',
    label: 'Charles Schwab',
    symbolCol: 'Symbol',
    sharesCol: 'Quantity',
    costCol: 'Cost Basis',
    costIsTotal: true,
    exportInstructions:
      'In Schwab, go to Accounts → Positions → Export. Cost Basis in the export is the total, so we divide by Quantity automatically.',
    columnHint: 'Symbol, Quantity, Cost Basis (total — auto-divided)',
  },
  td_ameritrade: {
    id: 'td_ameritrade',
    label: 'TD Ameritrade',
    symbolCol: 'Symbol',
    sharesCol: 'Quantity',
    costCol: 'Average Price',
    exportInstructions:
      'In TDA/thinkorswim, go to Monitor → Activity and Positions → Export to .CSV. Use the "Average Price" column for cost basis.',
    columnHint: 'Symbol, Quantity, Average Price',
  },
  ibkr: {
    id: 'ibkr',
    label: 'Interactive Brokers',
    symbolCol: 'Symbol',
    sharesCol: 'Quantity',
    costCol: 'Cost Price',
    skipIfColumnEquals: { col: 'Asset Category', value: 'Equity' },
    exportInstructions:
      'In IBKR, go to Reports → Flex Queries → Default Statements and export Positions as CSV. Use the Stocks/Equity section.',
    columnHint: 'Symbol, Quantity, Cost Price',
  },
  robinhood: {
    id: 'robinhood',
    label: 'Robinhood',
    symbolCol: 'Instrument',
    sharesCol: 'Quantity',
    costCol: 'Average Cost',
    exportInstructions:
      'In Robinhood, go to Account → Statements & History → Export. The "Average Cost" column gives per-share cost.',
    columnHint: 'Instrument, Quantity, Average Cost',
  },
  vanguard: {
    id: 'vanguard',
    label: 'Vanguard',
    symbolCol: 'Symbol',
    sharesCol: 'Shares',
    costCol: 'Average Cost',
    exportInstructions:
      'In Vanguard, go to My Accounts → Holdings → Download. Shares and Average Cost columns map directly.',
    columnHint: 'Symbol, Shares, Average Cost',
  },
  etrade: {
    id: 'etrade',
    label: 'E*TRADE',
    symbolCol: 'Symbol',
    sharesCol: 'Quantity',
    costCol: 'Price Paid',
    exportInstructions:
      'In E*TRADE, go to Accounts → Portfolio → Download Positions CSV. "Price Paid" is the per-share cost basis.',
    columnHint: 'Symbol, Quantity, Price Paid',
  },
  webull: {
    id: 'webull',
    label: 'Webull',
    symbolCol: 'Ticker',
    sharesCol: 'Quantity',
    costCol: 'Cost',
    exportInstructions:
      'In Webull Desktop, go to Positions → Export. "Ticker" and "Cost" map to symbol and per-share cost.',
    columnHint: 'Ticker, Quantity, Cost',
  },
  generic: {
    id: 'generic',
    label: 'Generic / Other',
    symbolCol: '',
    sharesCol: '',
    costCol: '',
    exportInstructions:
      'Upload any CSV and manually select which columns map to Symbol, Shares, and Cost Basis per Share.',
    columnHint: 'Any columns — you choose the mapping',
  },
};

export const PRESET_OPTIONS = (Object.values(BROKER_PRESETS) as BrokerPreset[]).map((p) => ({
  value: p.id,
  label: p.label,
}));
