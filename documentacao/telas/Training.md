# Tela de Treinamentos (Training)

**Data de Criação:** 29/09/2025  
**Rota:** `/training`  
**Componente Principal:** `src/pages/Training.tsx`

## Descrição

Plataforma de treinamento estilo Netflix para vídeos educacionais hospedados no YouTube. Os vídeos são organizados em categorias, exibidos em carrosséis horizontais e reproduzidos em modal dentro da aplicação.

## Componentes Envolvidos

### Componentes Principais
- **Training** (`src/pages/Training.tsx`): Componente principal da página
- **VideoCard** (`src/components/training/VideoCard.tsx`): Card individual de vídeo com thumbnail
- **VideoCarousel** (`src/components/training/VideoCarousel.tsx`): Carrossel horizontal de vídeos
- **VideoPlayerModal** (`src/components/training/VideoPlayerModal.tsx`): Modal com player do YouTube

### Hooks Customizados
- **useTrainingCategories**: Busca todas as categorias com seus vídeos associados

## Estrutura de Dados

### Tabela: `training_categories`
Gerencia as categorias de treinamento:
- `id`: UUID único
- `tenant_id`: ID do tenant (multi-tenancy)
- `name`: Nome da categoria (ex: "Primeiros Passos")
- `description`: Descrição opcional da categoria
- `order_index`: Ordem de exibição
- `is_active`: Status da categoria
- `created_at`, `updated_at`: Timestamps

**Constraints:**
- UNIQUE(tenant_id, name) - Evita categorias duplicadas por tenant

### Tabela: `training_videos`
Armazena os vídeos de treinamento:
- `id`: UUID único
- `tenant_id`: ID do tenant
- `category_id`: FK para training_categories
- `title`: Título do vídeo
- `description`: Descrição opcional
- `youtube_video_id`: ID do vídeo no YouTube (ex: "vRO0UfvsbDw")
- `thumbnail_url`: URL customizada da thumbnail (opcional)
- `duration_seconds`: Duração em segundos (opcional)
- `order_index`: Ordem dentro da categoria
- `is_active`: Status do vídeo
- `created_at`, `updated_at`: Timestamps

## Funcionalidades

### 1. Listagem por Categorias
- Cada categoria é exibida como um Card
- Nome e descrição da categoria no CardHeader
- Vídeos exibidos em carrossel horizontal no CardContent
- Ordenação por `order_index` (categorias e vídeos)

### 2. VideoCard
Características do card de vídeo:
- **Thumbnail**: Imagem do vídeo (customizada ou do YouTube)
- **Hover Effect**: Escala e sombra ao passar o mouse
- **Play Button**: Ícone de play aparece no hover
- **Duração**: Badge com duração no formato MM:SS
- **Título**: Limitado a 2 linhas com ellipsis
- **Descrição**: Limitado a 1 linha com ellipsis

### 3. Carrossel Horizontal
- Scroll horizontal com barra customizada (ScrollArea)
- Width fixo de 300px por card
- Gap de 16px entre cards
- Mensagem quando não há vídeos na categoria

### 4. Modal de Reprodução
Ao clicar em um vídeo:
- Abre modal em tela cheia (max-w-4xl)
- Exibe título do vídeo
- Embed do YouTube com autoplay
- Exibe descrição abaixo do player (se disponível)
- Permite fullscreen e controles do YouTube

#### Configurações do Embed
```
URL: https://www.youtube.com/embed/{VIDEO_ID}?autoplay=1
Permissões: accelerometer, autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture
allowFullScreen: true
```

## Thumbnail Automática do YouTube

Se `thumbnail_url` não estiver definido, usa a thumbnail do YouTube:
```
https://img.youtube.com/vi/{VIDEO_ID}/hqdefault.jpg
```

Qualidades disponíveis:
- `default.jpg` - 120x90
- `mqdefault.jpg` - 320x180
- `hqdefault.jpg` - 480x360 (usado)
- `sddefault.jpg` - 640x480
- `maxresdefault.jpg` - 1280x720

## Segurança (RLS)

### training_categories
**SELECT:**
- Qualquer usuário autenticado do tenant pode visualizar

**ALL (INSERT, UPDATE, DELETE):**
- Apenas Owner e Admin podem gerenciar categorias

### training_videos
**SELECT:**
- Qualquer usuário autenticado do tenant pode visualizar

**ALL (INSERT, UPDATE, DELETE):**
- Apenas Owner e Admin podem gerenciar vídeos

## Estados de Loading

- **Skeleton loading** para categorias (3 placeholders)
- **Skeleton loading** para carrosséis de vídeos
- Mensagem amigável quando não há treinamentos
- Mensagem por categoria quando não há vídeos

## Formatação de Duração

Se `duration_seconds` estiver disponível:
```typescript
const minutes = Math.floor(seconds / 60);
const remainingSeconds = String(seconds % 60).padStart(2, '0');
return `${minutes}:${remainingSeconds}`; // Ex: "5:32"
```

## Performance e Otimizações

### Query Otimizada
O hook `useTrainingCategories` faz:
1. Uma query para buscar todas as categorias
2. Uma query para buscar todos os vídeos
3. Agrupamento client-side dos vídeos por categoria

Isso é mais eficiente que N+1 queries (uma por categoria).

### Índices no Banco
```sql
idx_training_categories_tenant: (tenant_id, order_index)
idx_training_videos_category: (category_id, order_index)
idx_training_videos_tenant: (tenant_id)
```

## Dependências

### UI Components (shadcn/ui)
- Card, CardContent, CardHeader, CardTitle
- Dialog, DialogContent, DialogHeader, DialogTitle
- ScrollArea, ScrollBar
- Skeleton

### Icons (lucide-react)
- Play (ícone principal, play button)

### React Query
- useQuery para buscar categorias e vídeos

## Interface TypeScript

```typescript
interface TrainingCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TrainingVideo {
  id: string;
  tenant_id: string;
  category_id: string;
  title: string;
  description: string | null;
  youtube_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TrainingCategoryWithVideos extends TrainingCategory {
  videos: TrainingVideo[];
}
```

## Fluxo de Dados

```
1. Usuário acessa /training
2. useTrainingCategories busca:
   - Todas as categorias ativas (ordenadas)
   - Todos os vídeos ativos (ordenados)
   - Agrupa vídeos por categoria
3. Renderização:
   - Loop por categorias
   - Card por categoria
   - Carrossel com VideoCards
4. Interação:
   - Click no VideoCard
   - Abre VideoPlayerModal
   - Reproduz vídeo do YouTube
5. Fecha modal ao clicar fora ou no X
```

## Gerenciamento de Conteúdo

### Como Adicionar Categorias
```sql
INSERT INTO training_categories (tenant_id, name, description, order_index)
VALUES (
  'TENANT_UUID',
  'Nome da Categoria',
  'Descrição opcional',
  1
);
```

### Como Adicionar Vídeos
```sql
INSERT INTO training_videos (
  tenant_id,
  category_id,
  title,
  description,
  youtube_video_id,
  order_index
)
VALUES (
  'TENANT_UUID',
  'CATEGORY_UUID',
  'Título do Vídeo',
  'Descrição opcional',
  'vRO0UfvsbDw', -- ID do YouTube
  1
);
```

### Como Obter o ID do Vídeo no YouTube
De uma URL como: `https://www.youtube.com/watch?v=vRO0UfvsbDw`
O ID é: `vRO0UfvsbDw` (parte após `v=`)

## Melhorias Futuras

1. **Interface de Gerenciamento**: Tela admin para CRUD de categorias e vídeos
2. **Progresso de Visualização**: Marcar vídeos como assistidos
3. **Favoritos**: Sistema de marcação de vídeos favoritos
4. **Busca**: Campo para buscar vídeos por título/descrição
5. **Filtros**: Por categoria, duração, data de adição
6. **Analytics**: Rastrear visualizações e engajamento
7. **Playlists**: Sequências recomendadas de vídeos
8. **Certificados**: Emitir certificados após conclusão de trilhas
9. **Comentários**: Sistema de perguntas e respostas
10. **Upload Direto**: Permitir upload de vídeos sem YouTube
