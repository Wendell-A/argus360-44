/**
 * Componente de Ações Rápidas do Dashboard
 * Data: 03 de Agosto de 2025, 14:02 UTC
 * 
 * Permite ações diretas sem navegação para outras telas
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Target, TrendingUp, Phone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardQuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Nova Venda',
      description: 'Registrar nova venda',
      icon: <Plus className="h-5 w-5" />,
      action: () => navigate('/vendas'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Novo Cliente',
      description: 'Cadastrar cliente',
      icon: <Users className="h-5 w-5" />,
      action: () => navigate('/clientes'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Nova Meta',
      description: 'Definir meta',
      icon: <Target className="h-5 w-5" />,
      action: () => navigate('/metas'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Simulação',
      description: 'Simular consórcio',
      icon: <TrendingUp className="h-5 w-5" />,
      action: () => navigate('/consorcios'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white h-20 flex flex-col items-center justify-center space-y-1 rounded-lg transition-all duration-200 hover:scale-105`}
              variant="default"
            >
              {action.icon}
              <span className="text-xs font-medium">{action.title}</span>
              <span className="text-xs opacity-90">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};