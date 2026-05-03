export enum SupportTicketStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Closed = 3
}

export interface SupportTicketDto {
  id: number;
  userId: string;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  adminReply: string | null;
  createdOn: string;
  lastModifiedOn: string;
}

export interface CreateSupportTicketCommand {
  subject: string;
  body: string;
}
