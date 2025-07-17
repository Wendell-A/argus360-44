
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
  }
};

export interface InterestRateConfig {
  vehicleFinancingRate: number;
  realEstateFinancingRate: number;
  consortiumAdminRate: number;
  consortiumFundRate: number;
  lastUpdated: string;
}

export const getDefaultRates = (): InterestRateConfig => ({
  vehicleFinancingRate: MARKET_RATES.VEHICLE_FINANCING.AVERAGE,
  realEstateFinancingRate: MARKET_RATES.REAL_ESTATE_FINANCING.AVERAGE,
  consortiumAdminRate: MARKET_RATES.CONSORTIUM.ADMIN_FEE,
  consortiumFundRate: MARKET_RATES.CONSORTIUM.FUND_FEE,
  lastUpdated: new Date().toISOString()
});
