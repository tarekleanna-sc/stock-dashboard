export type AlertDirection = 'above' | 'below';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
  triggered: boolean;
  triggeredAt: string | null;
  notes?: string;
  createdAt: string;
}
