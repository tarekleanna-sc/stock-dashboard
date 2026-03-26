import { z } from 'zod';

export const positionSchema = z.object({
  ticker: z
    .string()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker too long')
    .transform((v) => v.toUpperCase().trim()),
  shares: z.number().positive('Shares must be positive'),
  costBasisPerShare: z.number().positive('Cost basis must be positive'),
  accountId: z.string().min(1, 'Account is required'),
  notes: z.string().optional(),
});

export type PositionFormData = z.infer<typeof positionSchema>;

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  broker: z.enum([
    'fidelity', 'schwab', 'robinhood', 'vanguard', 'td_ameritrade',
    'etrade', 'interactive_brokers', 'webull', 'merrill', 'other',
  ]),
  accountType: z.enum([
    'brokerage', 'roth_ira', 'traditional_ira', '401k', 'hsa', '529', 'other',
  ]),
  cashBalance: z.number().min(0, 'Cash balance cannot be negative').optional(),
});

export type AccountFormData = z.infer<typeof accountSchema>;

export const mockPortfolioSchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  timeHorizon: z.enum(['short', 'medium', 'long']),
  accountSize: z.number().min(100, 'Minimum account size is $100'),
});

export type MockPortfolioFormData = z.infer<typeof mockPortfolioSchema>;

export const targetAllocationSchema = z.object({
  allocations: z.array(
    z.object({
      ticker: z.string(),
      target: z.number().min(0).max(100),
    })
  ),
});
