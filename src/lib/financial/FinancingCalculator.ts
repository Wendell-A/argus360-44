
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
  // Sistema Price (Tabela Price)
  static calculatePrice(
    principal: number,
    monthlyRate: number,
    periods: number
  ): FinancingCalculation {
    const rate = monthlyRate / 100;
    const monthlyPayment = (principal * rate * Math.pow(1 + rate, periods)) / 
                          (Math.pow(1 + rate, periods) - 1);
    
    const installments: InstallmentDetail[] = [];
    let balance = principal;
    
    for (let i = 1; i <= periods; i++) {
      const interestPayment = balance * rate;
      const principalPayment = monthlyPayment - interestPayment;
      balance = balance - principalPayment;
      
      installments.push({
        number: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
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

  // Sistema SAC (Sistema de Amortização Constante)
  static calculateSAC(
    principal: number,
    monthlyRate: number,
    periods: number
  ): FinancingCalculation {
    const rate = monthlyRate / 100;
    const principalPayment = principal / periods;
    
    const installments: InstallmentDetail[] = [];
    let balance = principal;
    let totalAmount = 0;
    
    for (let i = 1; i <= periods; i++) {
      const interestPayment = balance * rate;
      const monthlyPayment = principalPayment + interestPayment;
      balance = balance - principalPayment;
      totalAmount += monthlyPayment;
      
      installments.push({
        number: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }
    
    const totalInterest = totalAmount - principal;
    
    return {
      monthlyPayment: installments[0].payment, // Primeira parcela (maior)
      totalAmount,
      totalInterest,
      installments
    };
  }
}
