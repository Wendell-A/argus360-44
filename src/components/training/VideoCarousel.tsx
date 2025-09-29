import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrainingVideo } from '@/hooks/useTraining';
import { VideoCard } from './VideoCard';

interface VideoCarouselProps {
  videos: TrainingVideo[];
  onVideoClick: (video: TrainingVideo) => void;
}

export function VideoCarousel({ videos, onVideoClick }: VideoCarouselProps) {
  if (videos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4">
        Nenhum vídeo disponível nesta categoria
      </p>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {videos.map((video) => (
          <div key={video.id} className="w-[300px] flex-shrink-0">
            <VideoCard video={video} onClick={() => onVideoClick(video)} />
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
