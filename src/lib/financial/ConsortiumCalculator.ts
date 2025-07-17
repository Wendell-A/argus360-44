
export interface ConsortiumCalculationParams {
  assetValue: number;
  installments: number;
  downPayment?: number;
  adminRate: number;
  fundRate: number;
}

export interface ConsortiumCalculation {
  creditValue: number;
  creditLetter: number;
  monthlyPayment: number;
  adminFee: number;
  fundFee: number;
  totalAdminCost: number;
  totalFundCost: number;
  totalCost: number;
  installments: number;
}

export class ConsortiumCalculator {
  static calculate(params: ConsortiumCalculationParams): ConsortiumCalculation {
    const {
      assetValue,
      installments,
      downPayment = 0,
      adminRate,
      fundRate
    } = params;

    // Valor da carta de crédito (valor do bem menos entrada)
    const creditLetter = assetValue - downPayment;
    
    // Taxa de administração mensal sobre a carta de crédito
    const adminFee = (creditLetter * adminRate) / 100;
    
    // Taxa do fundo de reserva mensal sobre a carta de crédito
    const fundFee = (creditLetter * fundRate) / 100;
    
    // Parcela mensal (carta de crédito / número de parcelas + taxas)
    const creditInstallment = creditLetter / installments;
    const monthlyPayment = creditInstallment + adminFee + fundFee;
    
    // Custos totais
    const totalAdminCost = adminFee * installments;
    const totalFundCost = fundFee * installments;
    const totalCost = creditLetter + totalAdminCost + totalFundCost;

    return {
      creditValue: assetValue,
      creditLetter,
      monthlyPayment,
      adminFee,
      fundFee,
      totalAdminCost,
      totalFundCost,
      totalCost,
      installments
    };
  }
}
