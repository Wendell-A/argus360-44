
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getBankRates } from "@/lib/financial/InterestRates";

interface BankFinancingOptionsProps {
  selectedBank: string;
  onBankSelect: (bank: string, rate: number) => void;
}

export const BankFinancingOptions = ({ selectedBank, onBankSelect }: BankFinancingOptionsProps) => {
  const bankRates = getBankRates();

  const handleBankChange = (bankName: string) => {
    const bank = bankRates.find(b => b.name === bankName);
    if (bank) {
      onBankSelect(bankName, bank.monthlyRate);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Opções de Financiamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bank">Banco</Label>
            <Select value={selectedBank} onValueChange={handleBankChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um banco" />
              </SelectTrigger>
              <SelectContent>
                {bankRates.map((bank) => (
                  <SelectItem key={bank.name} value={bank.name}>
                    {bank.name} - {bank.annualRate}% a.a. + TR
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedBank && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Taxa Anual:</p>
                  <p className="font-semibold">
                    {bankRates.find(b => b.name === selectedBank)?.annualRate}% a.a.
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Taxa Mensal:</p>
                  <p className="font-semibold">
                    {bankRates.find(b => b.name === selectedBank)?.monthlyRate.toFixed(2)}% a.m.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
