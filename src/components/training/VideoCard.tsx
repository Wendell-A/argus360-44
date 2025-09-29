import { Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TrainingVideo } from '@/hooks/useTraining';

interface VideoCardProps {
  video: TrainingVideo;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const thumbnailUrl = video.thumbnail_url || 
    `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;

  return (
    <Card 
      className="cursor-pointer group overflow-hidden transition-all hover:scale-105 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-primary rounded-full p-4">
              <Play className="h-8 w-8 text-primary-foreground fill-current" />
            </div>
          </div>
          {video.duration_seconds && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {video.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
