
export interface ConsortiumCalculationParams {
  assetValue: number;
  installments: number;
  downPayment?: number;
  adminRate: number;
  fundRate: number;
  inccRate?: number; // Taxa INCC anual
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
      fundRate,
      inccRate = 0
    } = params;

    // Valor da carta de crédito (valor do bem menos entrada)
    const creditLetter = assetValue - downPayment;
    
    // Cálculo da taxa administrativa total
    const totalAdminCost = (creditLetter * adminRate) / 100;
    
    // Valor base da parcela (carta de crédito + taxa administrativa) dividido pelas parcelas
    const baseMonthlyPayment = (creditLetter + totalAdminCost) / installments;
    
    // Taxa do fundo de reserva mensal sobre a carta de crédito
    const fundFee = (creditLetter * fundRate) / 100;
    const totalFundCost = fundFee * installments;
    
    // Cálculo do ajuste INCC (aplicado anualmente sobre o saldo devedor)
    // Aproximação: INCC aplicado sobre o valor médio do saldo devedor
    const averageBalance = creditLetter / 2; // Saldo médio durante o período
    const yearsInContract = installments / 12;
    const inccAdjustment = (averageBalance * (inccRate / 100)) * yearsInContract;
    
    // Parcela mensal final: parcela base + fundo de reserva + ajuste INCC mensal
    const monthlyInccAdjustment = inccAdjustment / installments;
    const monthlyPayment = baseMonthlyPayment + fundFee + monthlyInccAdjustment;
    
    // Valor total com INCC
    const totalWithIncc = creditLetter + totalAdminCost + totalFundCost + inccAdjustment;
    
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
      fundFee,
      totalAdminCost,
      totalFundCost,
      totalCost,
      installments,
      monthlyAmortization,
      inccAdjustment,
      totalWithIncc
    };
  }
}
