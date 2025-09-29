import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminTrainingCategories,
  useCreateTrainingVideo,
  useUpdateTrainingVideo,
  type TrainingVideo,
} from '@/hooks/useAdminTraining';

const formSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  youtube_video_id: z.string().min(1, 'URL ou ID do vídeo é obrigatório'),
  category_id: z.string().min(1, 'Selecione uma categoria'),
  order_index: z.coerce.number().min(0, 'Ordem deve ser maior ou igual a 0'),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface VideoFormModalProps {
  open: boolean;
  onClose: () => void;
  video?: TrainingVideo | null;
}

export function VideoFormModal({ open, onClose, video }: VideoFormModalProps) {
  const { data: categories } = useAdminTrainingCategories();
  const createMutation = useCreateTrainingVideo();
  const updateMutation = useUpdateTrainingVideo();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      youtube_video_id: '',
      category_id: '',
      order_index: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (video) {
      form.reset({
        title: video.title,
        description: video.description || '',
        youtube_video_id: video.youtube_video_id,
        category_id: video.category_id,
        order_index: video.order_index,
        is_active: video.is_active,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        youtube_video_id: '',
        category_id: '',
        order_index: 0,
        is_active: true,
      });
    }
  }, [video, form]);

  const onSubmit = (values: FormValues) => {
    if (video) {
      updateMutation.mutate(
        { id: video.id, ...values },
        {
          onSuccess: () => {
            onClose();
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          ...values,
          tenant_id: '00000000-0000-0000-0000-000000000000', // Será substituído pelo tenant do admin
        } as any,
        {
          onSuccess: () => {
            onClose();
            form.reset();
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {video ? 'Editar Vídeo' : 'Novo Vídeo'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do vídeo de treinamento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Como criar um novo usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do vídeo..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtube_video_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL ou ID do Vídeo do YouTube *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=... ou dQw4w9WgXcQ"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Cole a URL completa ou apenas o ID do vídeo do YouTube
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.filter(c => c.is_active).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order_index"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição *</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Vídeo Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Vídeos inativos não serão exibidos para os usuários
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {video ? 'Salvar Alterações' : 'Criar Vídeo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
