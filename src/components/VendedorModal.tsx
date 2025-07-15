
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

interface VendedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedor?: Profile | null;
  onSave: (vendedor: ProfileInsert) => void;
  isLoading: boolean;
}

export default function VendedorModal({
  open,
  onOpenChange,
  vendedor,
  onSave,
  isLoading,
}: VendedorModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  });

  useEffect(() => {
    if (vendedor) {
      setFormData({
        full_name: vendedor.full_name || "",
        email: vendedor.email || "",
        phone: vendedor.phone || "",
        department: vendedor.department || "",
        position: vendedor.position || "",
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
      });
    }
  }, [vendedor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vendedorData: ProfileInsert = {
      id: vendedor?.id || crypto.randomUUID(),
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || null,
      department: formData.department || null,
      position: formData.position || null,
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
