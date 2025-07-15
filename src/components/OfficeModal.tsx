
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Database } from "@/integrations/supabase/types";

type Office = Database["public"]["Tables"]["offices"]["Row"];
type OfficeInsert = Database["public"]["Tables"]["offices"]["Insert"];

interface OfficeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  office?: Office | null;
  offices: Office[];
  onSave: (office: OfficeInsert) => void;
  isLoading: boolean;
}

export default function OfficeModal({
  open,
  onOpenChange,
  office,
  offices,
  onSave,
  isLoading,
}: OfficeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "matriz" as "matriz" | "filial" | "representacao",
    cnpj: "",
    parent_office_id: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip_code: "",
    },
    contact: {
      phone: "",
      email: "",
    },
    working_hours: {
      monday_friday: "",
      saturday: "",
      sunday: "",
    },
  });

  useEffect(() => {
    if (office) {
      const address = office.address as any || {};
      const contact = office.contact as any || {};
      const working_hours = office.working_hours as any || {};

      setFormData({
        name: office.name || "",
        type: office.type || "matriz",
        cnpj: office.cnpj || "",
        parent_office_id: office.parent_office_id || "",
        address: {
          street: address.street || "",
          city: address.city || "",
          state: address.state || "",
          zip_code: address.zip_code || "",
        },
        contact: {
          phone: contact.phone || "",
          email: contact.email || "",
        },
        working_hours: {
          monday_friday: working_hours.monday_friday || "",
          saturday: working_hours.saturday || "",
          sunday: working_hours.sunday || "",
        },
      });
    } else {
      setFormData({
        name: "",
        type: "matriz",
        cnpj: "",
        parent_office_id: "",
        address: {
          street: "",
          city: "",
          state: "",
          zip_code: "",
        },
        contact: {
          phone: "",
          email: "",
        },
        working_hours: {
          monday_friday: "",
          saturday: "",
          sunday: "",
        },
      });
    }
  }, [office, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const officeData: OfficeInsert = {
      name: formData.name,
      type: formData.type,
      cnpj: formData.cnpj || null,
      parent_office_id: formData.parent_office_id || null,
      address: formData.address,
      contact: formData.contact,
      working_hours: formData.working_hours,
    };

    onSave(officeData);
  };

  const availableParentOffices = offices.filter(o => o.id !== office?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {office ? "Editar Escritório" : "Novo Escritório"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Escritório *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "matriz" | "filial" | "representacao") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matriz">Matriz</SelectItem>
                    <SelectItem value="filial">Filial</SelectItem>
                    <SelectItem value="representacao">Representação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_office">Escritório Pai</Label>
                <Select
                  value={formData.parent_office_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent_office_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {availableParentOffices.map((parentOffice) => (
                      <SelectItem key={parentOffice.id} value={parentOffice.id}>
                        {parentOffice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.address.zip_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zip_code: e.target.value },
                    })
                  }
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value },
                    })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Horário de Funcionamento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monday_friday">Segunda a Sexta</Label>
                <Input
                  id="monday_friday"
                  value={formData.working_hours.monday_friday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours: { ...formData.working_hours, monday_friday: e.target.value },
                    })
                  }
                  placeholder="08:00 - 18:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saturday">Sábado</Label>
                <Input
                  id="saturday"
                  value={formData.working_hours.saturday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours: { ...formData.working_hours, saturday: e.target.value },
                    })
                  }
                  placeholder="08:00 - 12:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sunday">Domingo</Label>
                <Input
                  id="sunday"
                  value={formData.working_hours.sunday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_hours: { ...formData.working_hours, sunday: e.target.value },
                    })
                  }
                  placeholder="Fechado"
                />
              </div>
            </div>
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
