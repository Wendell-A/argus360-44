
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
    
    // NOVA FÓRMULA CORRIGIDA: Valor × (1 + Taxa Admin) ÷ Parcelas
    // Aplicamos a taxa administrativa sobre o valor total e dividimos pelas parcelas
    const totalWithAdminFee = creditLetter * (1 + adminRate / 100);
    const monthlyPayment = totalWithAdminFee / installments;
    
    // Cálculo das taxas para compatibilidade com relatórios existentes
    const totalAdminCost = (creditLetter * adminRate) / 100;
    const adminFee = totalAdminCost / installments;
    
    // Taxa do fundo de reserva mensal sobre a carta de crédito
    const fundFee = (creditLetter * fundRate) / 100;
    const totalFundCost = fundFee * installments;
    
    // Amortização mensal da carta de crédito (para referência)
    const monthlyAmortization = creditLetter / installments;
    
    // Custo total = parcela mensal × número de parcelas + fundo de reserva
    const totalCost = (monthlyPayment * installments) + totalFundCost;

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
