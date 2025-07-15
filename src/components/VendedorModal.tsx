
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { useOffices } from "@/hooks/useOffices";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

interface VendedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedor?: Profile | null;
  onSave: (vendedor: ProfileInsert & { office_id?: string }) => void;
  isLoading: boolean;
}

export default function VendedorModal({
  open,
  onOpenChange,
  vendedor,
  onSave,
  isLoading,
}: VendedorModalProps) {
  const { offices } = useOffices();
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    office_id: "",
  });

  useEffect(() => {
    if (vendedor) {
      setFormData({
        full_name: vendedor.full_name || "",
        email: vendedor.email || "",
        phone: vendedor.phone || "",
        department: vendedor.department || "",
        position: vendedor.position || "",
        office_id: "",
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        office_id: "",
      });
    }
  }, [vendedor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vendedorData: ProfileInsert & { office_id?: string } = {
      id: vendedor?.id || crypto.randomUUID(),
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || null,
      department: formData.department || null,
      position: formData.position || null,
      office_id: formData.office_id || undefined,
    };

    onSave(vendedorData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vendedor ? "Editar Vendedor" : "Novo Vendedor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="office_id">Escritório</Label>
            <Select value={formData.office_id} onValueChange={(value) => setFormData({ ...formData, office_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um escritório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Vendas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Vendedor"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
