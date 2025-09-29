import { useState } from 'react';
import { Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrainingVideo, useTrainingCategories } from '@/hooks/useTraining';
import { VideoCarousel } from '@/components/training/VideoCarousel';
import { VideoPlayerModal } from '@/components/training/VideoPlayerModal';

export default function Training() {
  const { data: categories, isLoading } = useTrainingCategories();
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-full p-3">
          <Play className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Treinamentos</h1>
          <p className="text-muted-foreground">
            Explore nossa biblioteca de vídeos de treinamento
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-48 w-[300px]" />
                <Skeleton className="h-48 w-[300px]" />
                <Skeleton className="h-48 w-[300px]" />
              </div>
            </div>
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum treinamento disponível no momento
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <VideoCarousel
                  videos={category.videos}
                  onVideoClick={setSelectedVideo}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VideoPlayerModal
        video={selectedVideo}
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      />
    </div>
  );
}
