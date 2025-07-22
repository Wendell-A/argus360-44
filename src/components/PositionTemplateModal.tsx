
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreatePosition } from '@/hooks/usePositions';
import { useDepartments } from '@/hooks/useDepartments';
import { POSITION_TEMPLATES } from '@/data/templates';
import { PositionTemplate } from '@/types/templateTypes';

interface PositionTemplateModalProps {
  open: boolean;
  onClose: () => void;
}

export function PositionTemplateModal({ open, onClose }: PositionTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PositionTemplate | null>(null);
  const { createPosition, isPending } = useCreatePosition();
  const { departments } = useDepartments();

  const handleCreateFromTemplate = (template: PositionTemplate) => {
    // Encontrar departamento correspondente se especificado
    let departmentId = undefined;
    if (template.department) {
      const dept = departments.find(d => 
        d.name.toLowerCase().includes(template.department!) ||
        template.department!.toLowerCase().includes(d.name.toLowerCase())
      );
      if (dept) {
        departmentId = dept.id;
      }
    }

    createPosition({
      name: template.name,
      description: `${template.description}\n\nResponsabilidades:\n${template.responsibilities.map(r => `• ${r}`).join('\n')}\n\nRequisitos:\n${template.requirements.map(r => `• ${r}`).join('\n')}`,
      department_id: departmentId
    });
    onClose();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'junior':
        return 'bg-green-100 text-green-800';
      case 'pleno':
        return 'bg-blue-100 text-blue-800';
      case 'senior':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'junior':
        return 'Júnior';
      case 'pleno':
        return 'Pleno';
      case 'senior':
        return 'Sênior';
      case 'manager':
        return 'Gerencial';
      default:
        return level;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escolher Template de Cargo</DialogTitle>
          <DialogDescription>
            Selecione um template pré-configurado para criar um novo cargo
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {POSITION_TEMPLATES.map((template) => {
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
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className={getLevelColor(template.level)}>
                            {getLevelText(template.level)}
                          </Badge>
                          {template.department && (
                            <Badge variant="secondary" className="text-xs">
                              {template.department}
                            </Badge>
                          )}
                        </div>
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
                      Principais responsabilidades:
                    </p>
                    <div className="space-y-1">
                      {template.responsibilities.slice(0, 2).map((resp) => (
                        <p key={resp} className="text-xs text-muted-foreground">
                          • {resp}
                        </p>
                      ))}
                      {template.responsibilities.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          • +{template.responsibilities.length - 2} mais...
                        </p>
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

        {selectedTemplate && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Detalhes do Template: {selectedTemplate.name}</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Nível:</p>
                <Badge className={getLevelColor(selectedTemplate.level)}>
                  {getLevelText(selectedTemplate.level)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Responsabilidades:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {selectedTemplate.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Requisitos:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {selectedTemplate.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
