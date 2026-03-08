export enum NotificationType {
   Info = 0,
   Warning = 1,
   Alert = 2,
   Message = 3
}

export interface NotificationDto {
   id: number;
   message?: string;
   type?: NotificationType;
   isRead?: boolean;
   createdOn?: string;
   relatedEntityId?: number | string | null;
}

export interface ClearAllNotificationsCommand {
   notificationIds?: number[] | null;
   clearAll?: boolean;
}

export interface MarkNotificationsReadCommand {
   notificationIds?: number[] | null;
   markAll?: boolean;
}
