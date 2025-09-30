import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface PermissionCrudGroupProps {
  moduleKey: string;
  moduleName: string;
  permissions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  onChange: (action: 'create' | 'read' | 'update' | 'delete', value: boolean) => void;
  disabled?: boolean;
}

const actionLabels = {
  create: 'Criar',
  read: 'Visualizar',
  update: 'Editar',
  delete: 'Excluir',
};

const actionDescriptions = {
  create: 'Permite criar novos registros neste módulo',
  read: 'Permite visualizar e consultar registros existentes',
  update: 'Permite editar e modificar registros existentes',
  delete: 'Permite excluir registros permanentemente',
};

export const PermissionCrudGroup: React.FC<PermissionCrudGroupProps> = ({
  moduleKey,
  moduleName,
  permissions,
  onChange,
  disabled = false,
}) => {
  const allChecked = Object.values(permissions).every(v => v);
  const someChecked = Object.values(permissions).some(v => v);

  const handleMasterToggle = () => {
    const newValue = !allChecked;
    (Object.keys(permissions) as Array<keyof typeof permissions>).forEach(action => {
      onChange(action, newValue);
    });
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card">
      {/* Master Checkbox */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`master-${moduleKey}`}
            checked={allChecked}
            onCheckedChange={handleMasterToggle}
            disabled={disabled}
            className={someChecked && !allChecked ? 'data-[state=checked]:bg-primary/50' : ''}
          />
          <Label 
            htmlFor={`master-${moduleKey}`}
            className="text-base font-semibold cursor-pointer"
          >
            {moduleName}
          </Label>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Marque para conceder todas as permissões CRUD para {moduleName}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* CRUD Checkboxes */}
      <div className="grid grid-cols-2 gap-3 pl-6">
        {(Object.keys(actionLabels) as Array<keyof typeof actionLabels>).map((action) => (
          <div key={action} className="flex items-center space-x-2">
            <Checkbox
              id={`${moduleKey}-${action}`}
              checked={permissions[action]}
              onCheckedChange={(checked) => onChange(action, checked === true)}
              disabled={disabled}
            />
            <div className="flex items-center gap-1">
              <Label 
                htmlFor={`${moduleKey}-${action}`}
                className="text-sm cursor-pointer"
              >
                {actionLabels[action]}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="max-w-xs text-xs">
                      {actionDescriptions[action]}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
