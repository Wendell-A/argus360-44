import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, AlertCircle, CheckCircle, UserPlus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const notificationIcons: Record<string, any> = {
  NEW_SALE_FOR_APPROVAL: AlertCircle,
  SALE_APPROVED: CheckCircle,
  CLIENT_TRANSFERRED_TO_YOU: UserPlus,
  GOAL_ACHIEVED: TrendingUp,
};

const notificationTitles: Record<string, string> = {
  NEW_SALE_FOR_APPROVAL: 'Nova venda para aprovação',
  SALE_APPROVED: 'Venda aprovada',
  CLIENT_TRANSFERRED_TO_YOU: 'Cliente transferido para você',
  GOAL_ACHIEVED: 'Meta atingida',
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const navigate = useNavigate();
  
  const Icon = notificationIcons[notification.type] || AlertCircle;
  const title = notificationTitles[notification.type] || 'Notificação';
  
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.cta_link) {
      navigate(notification.cta_link);
    }
  };

  const getDescription = () => {
    switch (notification.type) {
      case 'NEW_SALE_FOR_APPROVAL':
        return `${notification.data.seller_name} registrou uma venda de ${notification.data.client_name}`;
      case 'SALE_APPROVED':
        return `Sua venda para ${notification.data.client_name} foi aprovada`;
      case 'CLIENT_TRANSFERRED_TO_YOU':
        return `${notification.data.from_user_name} transferiu ${notification.data.client_name} para você`;
      default:
        return 'Verifique os detalhes';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 hover:bg-accent cursor-pointer transition-colors ${
        !notification.is_read ? 'bg-accent/50' : ''
      }`}
      onClick={handleClick}
    >
      <div className={`p-2 rounded-full ${!notification.is_read ? 'bg-primary/10' : 'bg-muted'}`}>
        <Icon className={`h-4 w-4 ${!notification.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
            {title}
          </p>
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {getDescription()}
        </p>
        
        <p className="text-xs text-muted-foreground mt-2">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
