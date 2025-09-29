import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, FolderOpen, Video } from 'lucide-react';
import { CategoryList } from '@/components/admin/training/CategoryList';
import { VideoList } from '@/components/admin/training/VideoList';

export default function AdminTraining() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Treinamentos</h1>
          <p className="text-muted-foreground">
            Gerencie categorias e vídeos de treinamento para os usuários
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            Vídeos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <CategoryList />
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <VideoList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
