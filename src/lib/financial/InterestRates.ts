
// Taxas baseadas no mercado brasileiro (2024)
export const MARKET_RATES = {
  // Financiamento de veículos
  VEHICLE_FINANCING: {
    AVERAGE: 1.99, // % ao mês
    MIN: 1.45,
    MAX: 2.89
  },
  // Financiamento imobiliário
  REAL_ESTATE_FINANCING: {
    AVERAGE: 0.85, // % ao mês
    MIN: 0.65,
    MAX: 1.20
  },
  // Consórcio (taxa de administração)
  CONSORTIUM: {
    ADMIN_FEE: 0.25, // % ao mês sobre o valor da carta
    FUND_FEE: 0.15   // % ao mês sobre o fundo comum
  },
  // Taxas reais dos bancos brasileiros (dados de pesquisa 2024)
  REAL_BANKS: {
    CAIXA: {
      rate: 11.29, // % ao ano
      tr: 0.1758   // % ao mês
    },
    BRADESCO: {
      rate: 13.50, // % ao ano
      tr: 0.1758   // % ao mês
    },
    ITAU: {
      rate: 12.19, // % ao ano
      tr: 0.1758   // % ao mês
    },
    SANTANDER: {
      rate: 12.50, // % ao ano
      tr: 0.1758   // % ao mês
    },
    BANCO_DO_BRASIL: {
      rate: 12.00, // % ao ano
      tr: 0.1758   // % ao mês
    }
  }
};

// Converter taxa anual para mensal
export const convertAnnualToMonthly = (annualRate: number, tr: number = 0.1758): number => {
  // Fórmula: ((1 + taxa_anual/100)^(1/12) - 1) * 100 + TR
  const monthlyRate = (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;
  return monthlyRate + tr;
};

export interface InterestRateConfig {
  vehicleFinancingRate: number;
  realEstateFinancingRate: number;
  consortiumAdminRate: number;
  consortiumFundRate: number;
  lastUpdated: string;
}

export const getDefaultRates = (): InterestRateConfig => ({
  vehicleFinancingRate: convertAnnualToMonthly(MARKET_RATES.REAL_BANKS.CAIXA.rate, MARKET_RATES.REAL_BANKS.CAIXA.tr),
  realEstateFinancingRate: MARKET_RATES.REAL_ESTATE_FINANCING.AVERAGE,
  consortiumAdminRate: MARKET_RATES.CONSORTIUM.ADMIN_FEE,
  consortiumFundRate: MARKET_RATES.CONSORTIUM.FUND_FEE,
  lastUpdated: new Date().toISOString()
});

export const getBankRates = () => {
  return Object.entries(MARKET_RATES.REAL_BANKS).map(([bankName, data]) => ({
    name: bankName.replace('_', ' '),
    monthlyRate: convertAnnualToMonthly(data.rate, data.tr),
    annualRate: data.rate,
    tr: data.tr
  }));
};
