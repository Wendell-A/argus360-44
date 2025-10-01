
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  avatarUrl?: string;
  fullName: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({ avatarUrl, fullName, size = "md" }: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
    xl: "h-16 w-16 text-lg"
  };

  return (
    <Avatar className={sizeClasses[size]}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-medium">
        {getInitials(fullName)}
      </AvatarFallback>
    </Avatar>
  );
}
