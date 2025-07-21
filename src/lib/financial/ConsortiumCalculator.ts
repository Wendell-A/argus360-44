
export interface ConsortiumCalculationParams {
  assetValue: number;
  installments: number;
  downPayment?: number;
  adminRate: number;
  inccRate?: number; // Taxa INCC anual
}

export interface ConsortiumCalculation {
  creditValue: number;
  creditLetter: number;
  monthlyPayment: number;
  adminFee: number;
  totalAdminCost: number;
  totalCost: number;
  installments: number;
  monthlyAmortization: number;
  inccAdjustment: number;
  totalWithIncc: number;
}

export class ConsortiumCalculator {
  static calculate(params: ConsortiumCalculationParams): ConsortiumCalculation {
    const {
      assetValue,
      installments,
      downPayment = 0,
      adminRate,
      inccRate = 0
    } = params;

    // Valor da carta de crédito (valor do bem menos entrada)
    const creditLetter = assetValue - downPayment;
    
    // Cálculo da taxa administrativa total
    const totalAdminCost = (creditLetter * adminRate) / 100;
    
    // Cálculo do ajuste INCC (aplicado anualmente sobre o saldo devedor)
    // Aproximação: INCC aplicado sobre o valor médio do saldo devedor
    const averageBalance = creditLetter / 2; // Saldo médio durante o período
    const yearsInContract = installments / 12;
    const inccAdjustment = (averageBalance * (inccRate / 100)) * yearsInContract;
    
    // Valor total com INCC
    const totalWithIncc = creditLetter + totalAdminCost + inccAdjustment;
    
    // Parcela mensal: (carta de crédito + taxa administrativa + ajuste INCC) / número de parcelas
    const monthlyPayment = totalWithIncc / installments;
    
    // Amortização mensal da carta de crédito (para referência)
    const monthlyAmortization = creditLetter / installments;
    
    // Taxa administrativa mensal (para compatibilidade)
    const adminFee = totalAdminCost / installments;
    
    // Custo total = valor total com todos os ajustes
    const totalCost = totalWithIncc;

    return {
      creditValue: assetValue,
      creditLetter,
      monthlyPayment,
      adminFee,
      totalAdminCost,
      totalCost,
      installments,
      monthlyAmortization,
      inccAdjustment,
      totalWithIncc
    };
  }
}
