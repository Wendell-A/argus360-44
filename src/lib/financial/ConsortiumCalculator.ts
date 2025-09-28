
export interface ConsortiumCalculationParams {
  assetValue: number;
  installments: number;
  downPayment?: number;
  adminRate: number;
  inccRate?: number; // Taxa INCC anual
  advanceFeeRate?: number; // Taxa Antecipada
  reserveFundRate?: number; // Taxa Fundo de Reserva
  embeddedBidRate?: number; // Taxa Lance Embutido (apenas informativo)
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
  advanceFeeAmount: number;
  reserveFundAmount: number;
  embeddedBidAmount: number;
}

export class ConsortiumCalculator {
  static calculate(params: ConsortiumCalculationParams): ConsortiumCalculation {
    const {
      assetValue,
      installments,
      downPayment = 0,
      adminRate,
      inccRate = 0,
      advanceFeeRate = 0,
      reserveFundRate = 0,
      embeddedBidRate = 0
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
    
    // Cálculo das taxas adicionais
    // Taxa Antecipada: 2% do valor bruto (assetValue), é uma antecipação, NÃO entra no custo total
    const advanceFeeAmount = advanceFeeRate > 0 ? (assetValue * 0.02) : 0; // Sempre 2% do valor bruto quando aplicável
    // Fundo de Reserva: apenas para visibilidade, NÃO entra no custo total
    const reserveFundAmount = (creditLetter * reserveFundRate) / 100;
    // Lance Embutido: valor mínimo de lance, apenas informativo
    const embeddedBidAmount = (creditLetter * embeddedBidRate) / 100;
    
    // Valor total incluindo apenas as taxas que compõem o custo 
    // (NÃO incluir Taxa Antecipada pois é antecipação, NÃO incluir Fundo de Reserva pois é apenas informativo, NÃO incluir Lance Embutido)
    const totalWithFees = creditLetter + totalAdminCost + inccAdjustment;
    
    // Parcela mensal: valor total com taxas / número de parcelas
    const monthlyPayment = totalWithFees / installments;
    
    // Amortização mensal da carta de crédito (para referência)
    const monthlyAmortization = creditLetter / installments;
    
    // Taxa administrativa mensal (para compatibilidade)
    const adminFee = totalAdminCost / installments;
    
    // Custo total = valor total com todas as taxas (exceto Lance Embutido)
    const totalCost = totalWithFees;

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
      totalWithIncc: totalWithFees, // Renomeado para ser mais claro
      advanceFeeAmount,
      reserveFundAmount,
      embeddedBidAmount
    };
  }
}
