
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getBankRates, calculateIOF } from "@/lib/financial/InterestRates";
import { formatCurrency } from "@/lib/utils";

interface BankFinancingOptionsProps {
  selectedBank: string;
  onBankSelect: (bank: string, rate: number) => void;
  assetType?: 'vehicle' | 'real_estate';
  financingAmount?: number;
  termInMonths?: number;
}

export const BankFinancingOptions = ({ 
  selectedBank, 
  onBankSelect, 
  assetType = 'real_estate',
  financingAmount = 0,
  termInMonths = 180
}: BankFinancingOptionsProps) => {
  const bankRates = getBankRates(assetType);

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
                    {bank.name} - {bank.annualRate}% a.a. 
                    {bank.hasIOF ? ' + IOF' : ' + TR'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedBank && (() => {
            const selectedBankData = bankRates.find(b => b.name === selectedBank);
            const iofAmount = selectedBankData?.hasIOF ? calculateIOF(financingAmount, termInMonths) : 0;
            
            return (
              <div className="p-3 bg-muted rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Detalhes da Taxa</h4>
                    {selectedBankData?.hasIOF && (
                      <Badge variant="secondary">Veículo</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Taxa Anual:</p>
                      <p className="font-semibold">
                        {selectedBankData?.annualRate}% a.a.
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa Mensal:</p>
                      <p className="font-semibold">
                        {selectedBankData?.monthlyRate.toFixed(2)}% a.m.
                      </p>
                    </div>
                  </div>
                  
                  {selectedBankData?.hasIOF && financingAmount > 0 && (
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">IOF Total:</span>
                        <span className="font-semibold text-destructive">
                          {formatCurrency(iofAmount)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        0,38% fixo + 2,38% a.a. (limitado a 365 dias)
                      </p>
                    </div>
                  )}
                  
                  {!selectedBankData?.hasIOF && (
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">TR Mensal:</span>
                        <span className="font-semibold">
                          {selectedBankData?.tr}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
};
