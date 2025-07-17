
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateDepartment } from '@/hooks/useDepartments';
import { 
  Users, 
  TrendingUp, 
  Megaphone, 
  Shield, 
  Calculator, 
  Wrench,
  Heart,
  Building
} from 'lucide-react';

interface DepartmentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  positions: string[];
  responsibilities: string[];
}

const DEPARTMENT_TEMPLATES: DepartmentTemplate[] = [
  {
    id: 'vendas',
    name: 'Vendas',
    description: 'Equipe responsável por vendas e relacionamento com clientes',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-green-100 text-green-800',
    positions: ['Gerente de Vendas', 'Consultor de Vendas', 'Coordenador de Vendas'],
    responsibilities: ['Prospecção de clientes', 'Negociação de contratos', 'Acompanhamento pós-venda']
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Responsável por estratégias de marketing e comunicação',
    icon: <Megaphone className="h-6 w-6" />,
    color: 'bg-blue-100 text-blue-800',
    positions: ['Gerente de Marketing', 'Analista de Marketing', 'Designer Gráfico'],
    responsibilities: ['Campanhas publicitárias', 'Gestão de redes sociais', 'Branding']
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'Controle financeiro e contabilidade da empresa',
    icon: <Calculator className="h-6 w-6" />,
    color: 'bg-yellow-100 text-yellow-800',
    positions: ['Controller', 'Analista Financeiro', 'Assistente Contábil'],
    responsibilities: ['Controle de fluxo de caixa', 'Análise financeira', 'Relatórios contábeis']
  },
  {
    id: 'rh',
    name: 'Recursos Humanos',
    description: 'Gestão de pessoas e desenvolvimento organizacional',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-purple-100 text-purple-800',
    positions: ['Gerente de RH', 'Analista de RH', 'Recrutador'],
    responsibilities: ['Recrutamento e seleção', 'Treinamento e desenvolvimento', 'Gestão de benefícios']
  },
  {
    id: 'ti',
    name: 'Tecnologia da Informação',
    description: 'Suporte técnico e desenvolvimento de sistemas',
    icon: <Wrench className="h-6 w-6" />,
    color: 'bg-gray-100 text-gray-800',
    positions: ['Gerente de TI', 'Desenvolvedor', 'Suporte Técnico'],
    responsibilities: ['Manutenção de sistemas', 'Desenvolvimento de software', 'Suporte aos usuários']
  },
  {
    id: 'juridico',
    name: 'Jurídico',
    description: 'Assessoria jurídica e compliance',
    icon: <Shield className="h-6 w-6" />,
    color: 'bg-red-100 text-red-800',
    positions: ['Advogado', 'Paralegal', 'Compliance Officer'],
    responsibilities: ['Contratos e acordos', 'Compliance regulatório', 'Assessoria jurídica']
  },
  {
    id: 'atendimento',
    name: 'Atendimento ao Cliente',
    description: 'Suporte e relacionamento com clientes',
    icon: <Heart className="h-6 w-6" />,
    color: 'bg-pink-100 text-pink-800',
    positions: ['Supervisor de Atendimento', 'Atendente', 'Analista de CX'],
    responsibilities: ['Suporte ao cliente', 'Resolução de problemas', 'Satisfação do cliente']
  },
  {
    id: 'administrativo',
    name: 'Administrativo',
    description: 'Gestão administrativa e operacional',
    icon: <Building className="h-6 w-6" />,
    color: 'bg-indigo-100 text-indigo-800',
    positions: ['Gerente Administrativo', 'Assistente Administrativo', 'Auxiliar Administrativo'],
    responsibilities: ['Gestão de documentos', 'Processos administrativos', 'Suporte operacional']
  }
];

interface DepartmentTemplateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DepartmentTemplateModal({ open, onClose }: DepartmentTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<DepartmentTemplate | null>(null);
  const { createDepartment, isCreating } = useCreateDepartment();

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
          {DEPARTMENT_TEMPLATES.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${template.color}`}>
                      {template.icon}
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
                  disabled={isCreating}
                >
                  Usar este Template
                </Button>
              </CardContent>
            </Card>
          ))}
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
