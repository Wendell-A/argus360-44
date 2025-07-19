
export interface FinancingCalculation {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  installments: InstallmentDetail[];
}

export interface InstallmentDetail {
  number: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export class FinancingCalculator {
  // Sistema Price (Tabela Price) - FÓRMULA CORRIGIDA
  static calculatePrice(
    principal: number,
    monthlyRate: number,
    periods: number
  ): FinancingCalculation {
    const rate = monthlyRate / 100;
    
    // Fórmula PRICE correta: P = (PV * i) / (1 – (1 + i)^-n)
    const monthlyPayment = (principal * rate * Math.pow(1 + rate, periods)) / 
                          (Math.pow(1 + rate, periods) - 1);
    
    const installments: InstallmentDetail[] = [];
    let balance = principal;
    
    for (let i = 1; i <= periods; i++) {
      const interestPayment = balance * rate;
      const principalPayment = monthlyPayment - interestPayment;
      balance = Math.max(0, balance - principalPayment);
      
      installments.push({
        number: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance
      });
    }
    
    const totalAmount = monthlyPayment * periods;
    const totalInterest = totalAmount - principal;
    
    return {
      monthlyPayment,
      totalAmount,
      totalInterest,
      installments
    };
  }

  // Sistema SAC (Sistema de Amortização Constante) - CÁLCULO CORRIGIDO
  static calculateSAC(
    principal: number,
    monthlyRate: number,
    periods: number
  ): FinancingCalculation {
    const rate = monthlyRate / 100;
    
    // Amortização constante
    const principalPayment = principal / periods;
    
    const installments: InstallmentDetail[] = [];
    let balance = principal;
    let totalAmount = 0;
    
    for (let i = 1; i <= periods; i++) {
      // Juros incidem sobre o saldo devedor atual
      const interestPayment = balance * rate;
      const monthlyPayment = principalPayment + interestPayment;
      
      // Reduz o saldo devedor pela amortização
      balance = Math.max(0, balance - principalPayment);
      totalAmount += monthlyPayment;
      
      installments.push({
        number: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance
      });
    }
    
    const totalInterest = totalAmount - principal;
    
    return {
      monthlyPayment: installments[0].payment, // Primeira parcela (maior no SAC)
      totalAmount,
      totalInterest,
      installments
    };
  }

  // Método auxiliar para validar se os cálculos estão corretos
  static validateCalculation(calculation: FinancingCalculation, principal: number): boolean {
    const calculatedPrincipal = calculation.installments.reduce((sum, inst) => sum + inst.principal, 0);
    const tolerance = 0.01; // Tolerância de 1 centavo
    return Math.abs(calculatedPrincipal - principal) < tolerance;
  }
}
