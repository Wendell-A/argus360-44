
export interface ConsortiumCalculation {
  creditLetter: number;
  monthlyPayment: number;
  adminFee: number;
  fundFee: number;
  totalAdminCost: number;
  totalFundCost: number;
  totalCost: number;
  monthsToContemplate: number;
  contemplationProbability: number;
}

export interface ConsortiumSimulationParams {
  assetValue: number;
  installments: number;
  downPayment?: number;
  adminRate: number; // % ao mês
  fundRate?: number; // % ao mês
}

export class ConsortiumCalculator {
  static calculate(params: ConsortiumSimulationParams): ConsortiumCalculation {
    const {
      assetValue,
      installments,
      downPayment = 0,
      adminRate,
      fundRate = 0
    } = params;

    const creditLetter = assetValue - downPayment;
    const adminFee = (creditLetter * adminRate) / 100;
    const fundFee = (creditLetter * fundRate) / 100;
    const monthlyPayment = (creditLetter / installments) + adminFee + fundFee;

    const totalAdminCost = adminFee * installments;
    const totalFundCost = fundFee * installments;
    const totalCost = creditLetter + totalAdminCost + totalFundCost;

    // Estimativa simplificada de contemplação
    // Em grupos reais, isso seria baseado em estatísticas do grupo
    const baseMonthsToContemplate = Math.ceil(installments * 0.4); // 40% do prazo
    const contemplationProbability = Math.min(95, (installments - baseMonthsToContemplate + 1) / installments * 100);

    return {
      creditLetter,
      monthlyPayment,
      adminFee,
      fundFee,
      totalAdminCost,
      totalFundCost,
      totalCost,
      monthsToContemplate: baseMonthsToContemplate,
      contemplationProbability
    };
  }

  // Cálculo de lance para contemplação antecipada
  static calculateBidAmount(
    creditLetter: number,
    desiredMonth: number,
    totalInstallments: number,
    competitiveness: 'low' | 'medium' | 'high' = 'medium'
  ): number {
    const competitivenessMultiplier = {
      low: 0.05,     // 5% da carta
      medium: 0.08,  // 8% da carta  
      high: 0.12     // 12% da carta
    };

    const timeMultiplier = Math.max(0.5, (totalInstallments - desiredMonth) / totalInstallments);
    const bidPercentage = competitivenessMultiplier[competitiveness] * timeMultiplier;
    
    return creditLetter * bidPercentage;
  }
}
