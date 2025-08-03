/**
 * Componente de Tabela de Performance dos Vendedores
 * Data: 03 de Agosto de 2025, 14:15 UTC
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, TrendingUp, DollarSign } from 'lucide-react';

interface VendorsPerformanceTableProps {
  vendors: Array<{
    id: string;
    name: string;
    email: string;
    sales_count: number;
    commission_total: number;
    office_name: string;
    active: boolean;
  }>;
  isLoading?: boolean;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 1:
      return <Trophy className="h-4 w-4 text-gray-400" />;
    case 2:
      return <Trophy className="h-4 w-4 text-amber-600" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>;
  }
};

export const VendorsPerformanceTable: React.FC<VendorsPerformanceTableProps> = ({
  vendors,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance dos Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance dos Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum vendedor encontrado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar vendedores por número de vendas (decrescente)
  const sortedVendors = [...vendors].sort((a, b) => b.sales_count - a.sales_count);

  // Calcular estatísticas
  const totalSales = vendors.reduce((sum, vendor) => sum + vendor.sales_count, 0);
  const totalCommissions = vendors.reduce((sum, vendor) => sum + vendor.commission_total, 0);
  const activeVendors = vendors.filter(vendor => vendor.active).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Performance dos Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{totalSales}</p>
              <p className="text-xs text-muted-foreground">Total de Vendas</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <p className="text-lg font-bold">{formatCurrency(totalCommissions)}</p>
              <p className="text-xs text-muted-foreground">Total Comissões</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{activeVendors}</p>
              <p className="text-xs text-muted-foreground">Vendedores Ativos</p>
            </div>
          </div>

          {/* Tabela de Vendedores */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Escritório</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                  <TableHead className="text-right">Comissões</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVendors.map((vendor, index) => (
                  <TableRow key={vendor.id} className={index < 3 ? 'bg-muted/50' : ''}>
                    <TableCell className="text-center">
                      {getRankIcon(index)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(vendor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">{vendor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {vendor.office_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold">{vendor.sales_count}</span>
                        {totalSales > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({((vendor.sales_count / totalSales) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-semibold">{formatCurrency(vendor.commission_total)}</p>
                        {vendor.sales_count > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(vendor.commission_total / vendor.sales_count)} / venda
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={vendor.active ? 'default' : 'secondary'}>
                        {vendor.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Podium dos Top 3 */}
          {sortedVendors.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {/* 2º Lugar */}
              <div className="text-center p-4 bg-gradient-to-t from-gray-100 to-gray-50 rounded-lg border-2 border-gray-300">
                <div className="flex justify-center mb-2">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <Avatar className="h-12 w-12 mx-auto mb-2">
                  <AvatarFallback>{getInitials(sortedVendors[1].name)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm">{sortedVendors[1].name.split(' ')[0]}</p>
                <p className="text-lg font-bold text-gray-600">{sortedVendors[1].sales_count}</p>
                <p className="text-xs text-muted-foreground">vendas</p>
              </div>

              {/* 1º Lugar */}
              <div className="text-center p-4 bg-gradient-to-t from-yellow-100 to-yellow-50 rounded-lg border-2 border-yellow-400">
                <div className="flex justify-center mb-2">
                  <Trophy className="h-10 w-10 text-yellow-500" />
                </div>
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarFallback>{getInitials(sortedVendors[0].name)}</AvatarFallback>
                </Avatar>
                <p className="font-bold">{sortedVendors[0].name.split(' ')[0]}</p>
                <p className="text-2xl font-bold text-yellow-600">{sortedVendors[0].sales_count}</p>
                <p className="text-xs text-muted-foreground">vendas</p>
              </div>

              {/* 3º Lugar */}
              <div className="text-center p-4 bg-gradient-to-t from-amber-100 to-amber-50 rounded-lg border-2 border-amber-400">
                <div className="flex justify-center mb-2">
                  <Trophy className="h-8 w-8 text-amber-600" />
                </div>
                <Avatar className="h-12 w-12 mx-auto mb-2">
                  <AvatarFallback>{getInitials(sortedVendors[2].name)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-sm">{sortedVendors[2].name.split(' ')[0]}</p>
                <p className="text-lg font-bold text-amber-600">{sortedVendors[2].sales_count}</p>
                <p className="text-xs text-muted-foreground">vendas</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};