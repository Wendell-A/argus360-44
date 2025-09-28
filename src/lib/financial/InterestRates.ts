
// Taxas baseadas no mercado brasileiro (2024)
export const MARKET_RATES = {
  // Financiamento de veículos - Taxas atualizadas
  VEHICLE_FINANCING: {
    NOMINAL_ANNUAL: 29.30, // % ao ano (taxa nominal)
    AVERAGE_MONTHLY: 2.19, // % ao mês equivalente
    MIN: 1.45,
    MAX: 2.89,
    IOF: {
      FIXED: 0.38, // % fixo
      ANNUAL: 2.38, // % anual
      DAILY: 0.0082, // % ao dia (2.38% / 365 * 1.15)
      MAX_DAYS: 365
    }
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

// Calcular IOF para financiamento de veículos
export const calculateIOF = (principalAmount: number, termInMonths: number): number => {
  const { FIXED, DAILY, MAX_DAYS } = MARKET_RATES.VEHICLE_FINANCING.IOF;
  const daysInTerm = Math.min(termInMonths * 30, MAX_DAYS); // Aproximadamente 30 dias por mês
  
  const fixedIOF = (principalAmount * FIXED) / 100;
  const dailyIOF = (principalAmount * DAILY * daysInTerm) / 100;
  
  return fixedIOF + dailyIOF;
};

// Converter taxa anual de veículos para mensal
export const convertVehicleAnnualToMonthly = (annualRate: number): number => {
  return (Math.pow(1 + annualRate / 100, 1 / 12) - 1) * 100;
};

export const getBankRates = (assetType: 'vehicle' | 'real_estate' = 'real_estate') => {
  if (assetType === 'vehicle') {
    // Taxas específicas para veículos
    return [
      {
        name: 'CAIXA VEÍCULOS',
        monthlyRate: convertVehicleAnnualToMonthly(MARKET_RATES.VEHICLE_FINANCING.NOMINAL_ANNUAL),
        annualRate: MARKET_RATES.VEHICLE_FINANCING.NOMINAL_ANNUAL,
        tr: 0,
        hasIOF: true
      },
      {
        name: 'BRADESCO VEÍCULOS', 
        monthlyRate: convertVehicleAnnualToMonthly(30.5),
        annualRate: 30.5,
        tr: 0,
        hasIOF: true
      },
      {
        name: 'ITAU VEÍCULOS',
        monthlyRate: convertVehicleAnnualToMonthly(28.9),
        annualRate: 28.9,
        tr: 0,
        hasIOF: true
      }
    ];
  }
  
  // Taxas para imóveis (original)
  return Object.entries(MARKET_RATES.REAL_BANKS).map(([bankName, data]) => ({
    name: bankName.replace('_', ' '),
    monthlyRate: convertAnnualToMonthly(data.rate, data.tr),
    annualRate: data.rate,
    tr: data.tr,
    hasIOF: false
  }));
};
