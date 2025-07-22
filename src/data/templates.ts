
import { 
  Users, 
  TrendingUp, 
  Megaphone, 
  Shield, 
  Calculator, 
  Wrench,
  Heart,
  Building,
  UserCheck,
  BarChart3,
  Headphones,
  Code
} from 'lucide-react';
import { DepartmentTemplate, PositionTemplate, TeamTemplate } from '@/types/templateTypes';

export const DEPARTMENT_TEMPLATES: DepartmentTemplate[] = [
  {
    id: 'vendas',
    name: 'Vendas',
    description: 'Equipe responsável por vendas e relacionamento com clientes',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-800',
    positions: ['Gerente de Vendas', 'Consultor de Vendas', 'Coordenador de Vendas'],
    responsibilities: ['Prospecção de clientes', 'Negociação de contratos', 'Acompanhamento pós-venda']
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Responsável por estratégias de marketing e comunicação',
    icon: Megaphone,
    color: 'bg-blue-100 text-blue-800',
    positions: ['Gerente de Marketing', 'Analista de Marketing', 'Designer Gráfico'],
    responsibilities: ['Campanhas publicitárias', 'Gestão de redes sociais', 'Branding']
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'Controle financeiro e contabilidade da empresa',
    icon: Calculator,
    color: 'bg-yellow-100 text-yellow-800',
    positions: ['Controller', 'Analista Financeiro', 'Assistente Contábil'],
    responsibilities: ['Controle de fluxo de caixa', 'Análise financeira', 'Relatórios contábeis']
  },
  {
    id: 'rh',
    name: 'Recursos Humanos',
    description: 'Gestão de pessoas e desenvolvimento organizacional',
    icon: Users,
    color: 'bg-purple-100 text-purple-800',
    positions: ['Gerente de RH', 'Analista de RH', 'Recrutador'],
    responsibilities: ['Recrutamento e seleção', 'Treinamento e desenvolvimento', 'Gestão de benefícios']
  },
  {
    id: 'ti',
    name: 'Tecnologia da Informação',
    description: 'Suporte técnico e desenvolvimento de sistemas',
    icon: Wrench,
    color: 'bg-gray-100 text-gray-800',
    positions: ['Gerente de TI', 'Desenvolvedor', 'Suporte Técnico'],
    responsibilities: ['Manutenção de sistemas', 'Desenvolvimento de software', 'Suporte aos usuários']
  },
  {
    id: 'juridico',
    name: 'Jurídico',
    description: 'Assessoria jurídica e compliance',
    icon: Shield,
    color: 'bg-red-100 text-red-800',
    positions: ['Advogado', 'Paralegal', 'Compliance Officer'],
    responsibilities: ['Contratos e acordos', 'Compliance regulatório', 'Assessoria jurídica']
  },
  {
    id: 'atendimento',
    name: 'Atendimento ao Cliente',
    description: 'Suporte e relacionamento com clientes',
    icon: Heart,
    color: 'bg-pink-100 text-pink-800',
    positions: ['Supervisor de Atendimento', 'Atendente', 'Analista de CX'],
    responsibilities: ['Suporte ao cliente', 'Resolução de problemas', 'Satisfação do cliente']
  },
  {
    id: 'administrativo',
    name: 'Administrativo',
    description: 'Gestão administrativa e operacional',
    icon: Building,
    color: 'bg-indigo-100 text-indigo-800',
    positions: ['Gerente Administrativo', 'Assistente Administrativo', 'Auxiliar Administrativo'],
    responsibilities: ['Gestão de documentos', 'Processos administrativos', 'Suporte operacional']
  }
];

export const POSITION_TEMPLATES: PositionTemplate[] = [
  // Vendas
  {
    id: 'gerente-vendas',
    name: 'Gerente de Vendas',
    description: 'Liderança e gestão da equipe de vendas',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-800',
    department: 'vendas',
    level: 'manager',
    responsibilities: ['Gestão da equipe de vendas', 'Definição de metas', 'Acompanhamento de resultados'],
    requirements: ['Experiência em vendas', 'Liderança de equipes', 'Conhecimento do mercado']
  },
  {
    id: 'consultor-vendas',
    name: 'Consultor de Vendas',
    description: 'Responsável por vendas diretas e relacionamento com clientes',
    icon: UserCheck,
    color: 'bg-green-50 text-green-700',
    department: 'vendas',
    level: 'pleno',
    responsibilities: ['Prospecção de clientes', 'Apresentação de produtos', 'Fechamento de vendas'],
    requirements: ['Experiência em vendas', 'Relacionamento interpessoal', 'Orientação a resultados']
  },
  
  // Marketing
  {
    id: 'gerente-marketing',
    name: 'Gerente de Marketing',
    description: 'Estratégia e gestão de marketing',
    icon: Megaphone,
    color: 'bg-blue-100 text-blue-800',
    department: 'marketing',
    level: 'manager',
    responsibilities: ['Estratégia de marketing', 'Gestão de campanhas', 'Análise de mercado'],
    requirements: ['Formação em Marketing', 'Experiência em gestão', 'Conhecimento digital']
  },
  {
    id: 'analista-marketing',
    name: 'Analista de Marketing',
    description: 'Análise e execução de campanhas de marketing',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-700',
    department: 'marketing',
    level: 'pleno',
    responsibilities: ['Análise de dados', 'Criação de campanhas', 'Gestão de redes sociais'],
    requirements: ['Conhecimento em marketing digital', 'Análise de dados', 'Criatividade']
  },
  
  // Atendimento
  {
    id: 'supervisor-atendimento',
    name: 'Supervisor de Atendimento',
    description: 'Supervisão da equipe de atendimento ao cliente',
    icon: Headphones,
    color: 'bg-pink-100 text-pink-800',
    department: 'atendimento',
    level: 'senior',
    responsibilities: ['Supervisão da equipe', 'Controle de qualidade', 'Resolução de escalações'],
    requirements: ['Experiência em atendimento', 'Liderança', 'Comunicação']
  },
  {
    id: 'atendente',
    name: 'Atendente',
    description: 'Atendimento direto ao cliente',
    icon: Heart,
    color: 'bg-pink-50 text-pink-700',
    department: 'atendimento',
    level: 'junior',
    responsibilities: ['Atendimento telefônico', 'Resolução de dúvidas', 'Registro de ocorrências'],
    requirements: ['Comunicação clara', 'Paciência', 'Orientação ao cliente']
  },
  
  // TI
  {
    id: 'desenvolvedor',
    name: 'Desenvolvedor',
    description: 'Desenvolvimento de sistemas e aplicações',
    icon: Code,
    color: 'bg-gray-100 text-gray-800',
    department: 'ti',
    level: 'pleno',
    responsibilities: ['Desenvolvimento de software', 'Manutenção de sistemas', 'Testes de aplicações'],
    requirements: ['Conhecimento em programação', 'Lógica de programação', 'Trabalho em equipe']
  }
];

export const TEAM_TEMPLATES: TeamTemplate[] = [
  {
    id: 'equipe-vendas',
    name: 'Equipe de Vendas',
    description: 'Equipe focada em resultados comerciais',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-800',
    department: 'vendas',
    structure: 'hierarchical',
    defaultRoles: ['Gerente', 'Coordenador', 'Consultor'],
    goals: ['Aumentar vendas em 20%', 'Melhorar conversão', 'Expandir carteira de clientes']
  },
  {
    id: 'equipe-atendimento',
    name: 'Equipe de Atendimento',
    description: 'Equipe dedicada ao suporte ao cliente',
    icon: Headphones,
    color: 'bg-pink-100 text-pink-800',
    department: 'atendimento',
    structure: 'flat',
    defaultRoles: ['Supervisor', 'Atendente Senior', 'Atendente'],
    goals: ['Reduzir tempo de resposta', 'Aumentar satisfação', 'Resolver 95% dos casos']
  },
  {
    id: 'equipe-desenvolvimento',
    name: 'Equipe de Desenvolvimento',
    description: 'Equipe técnica para desenvolvimento de soluções',
    icon: Code,
    color: 'bg-gray-100 text-gray-800',
    department: 'ti',
    structure: 'matrix',
    defaultRoles: ['Tech Lead', 'Desenvolvedor Senior', 'Desenvolvedor'],
    goals: ['Entregar projetos no prazo', 'Manter qualidade do código', 'Inovar tecnologicamente']
  }
];
