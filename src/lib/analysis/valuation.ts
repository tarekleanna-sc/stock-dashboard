// Simplified DCF (Discounted Cash Flow) valuation

export function calculateIntrinsicValue(
  freeCashFlow: number,
  growthRate: number,
  discountRate: number = 0.10,
  terminalGrowthRate: number = 0.03,
  years: number = 5,
  sharesOutstanding: number
): number {
  if (sharesOutstanding <= 0 || freeCashFlow <= 0) return 0;
  if (discountRate <= terminalGrowthRate) return 0;

  let totalPV = 0;
  let projectedFCF = freeCashFlow;

  // Project FCF forward and discount each year
  for (let year = 1; year <= years; year++) {
    projectedFCF = projectedFCF * (1 + growthRate);
    const discountFactor = Math.pow(1 + discountRate, year);
    totalPV += projectedFCF / discountFactor;
  }

  // Terminal value = (FCF at year N * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate)
  const terminalValue =
    (projectedFCF * (1 + terminalGrowthRate)) /
    (discountRate - terminalGrowthRate);

  // Discount terminal value back to present
  const discountedTerminalValue =
    terminalValue / Math.pow(1 + discountRate, years);

  const totalEnterpriseValue = totalPV + discountedTerminalValue;

  // Per-share intrinsic value
  return totalEnterpriseValue / sharesOutstanding;
}

export function calculateDiscountToIntrinsic(
  currentPrice: number,
  intrinsicValue: number
): number {
  if (intrinsicValue === 0) return 0;
  return ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
}
