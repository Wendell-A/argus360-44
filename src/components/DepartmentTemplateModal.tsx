
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateDepartment } from '@/hooks/useDepartments';
import { DEPARTMENT_TEMPLATES } from '@/data/templates';
import { DepartmentTemplate } from '@/types/templateTypes';

interface DepartmentTemplateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DepartmentTemplateModal({ open, onClose }: DepartmentTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DepartmentTemplate | null>(null);
  const { createDepartment, isPending } = useCreateDepartment();

  const handleCreateFromTemplate = (template: DepartmentTemplate) => {
    createDepartment({
      name: template.name,
      description: template.description
    });
    onClose();
  };

  const handleCreateCustom = () => {
    // Fecha o modal de templates para abrir o modal padrão de criação
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escolher Template de Departamento</DialogTitle>
          <DialogDescription>
            Selecione um template pré-configurado ou crie um departamento personalizado
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {DEPARTMENT_TEMPLATES.map((template) => {
            const IconComponent = template.icon;
            return (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${template.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Cargos sugeridos:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.positions.slice(0, 2).map((position) => (
                        <Badge key={position} variant="secondary" className="text-xs">
                          {position}
                        </Badge>
                      ))}
                      {template.positions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.positions.length - 2} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFromTemplate(template);
                    }}
                    disabled={isPending}
                  >
                    Usar este Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Não encontrou o que procura?
          </p>
          <Button variant="outline" onClick={handleCreateCustom}>
            Criar Departamento Personalizado
          </Button>
        </div>

        {selectedTemplate && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Detalhes do Template: {selectedTemplate.name}</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Responsabilidades principais:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {selectedTemplate.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Cargos sugeridos:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTemplate.positions.map((position) => (
                    <Badge key={position} variant="secondary" className="text-xs">
                      {position}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
