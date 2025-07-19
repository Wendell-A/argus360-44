
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
  monthlyAmortization: number;
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
    
    // CORREÇÃO: Taxa de administração é aplicada sobre o montante total e dividida pelas parcelas
    // Taxa administrativa total sobre o valor da carta de crédito
    const totalAdminCost = (creditLetter * adminRate) / 100;
    const adminFee = totalAdminCost / installments;
    
    // Taxa do fundo de reserva mensal sobre a carta de crédito (esta continua mensal)
    const fundFee = (creditLetter * fundRate) / 100;
    const totalFundCost = fundFee * installments;
    
    // Amortização mensal da carta de crédito
    const monthlyAmortization = creditLetter / installments;
    
    // Parcela mensal total (amortização + taxa admin + taxa fundo)
    const monthlyPayment = monthlyAmortization + adminFee + fundFee;
    
    // Custo total do consórcio
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
      installments,
      monthlyAmortization
    };
  }
}
