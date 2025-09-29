import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrainingVideo } from '@/hooks/useTraining';

interface VideoPlayerModalProps {
  video: TrainingVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerModal({ video, open, onOpenChange }: VideoPlayerModalProps) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{video.title}</DialogTitle>
        </DialogHeader>
        
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
        
        {video.description && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground">{video.description}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
