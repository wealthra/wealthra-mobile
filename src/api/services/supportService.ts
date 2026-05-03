import axiosInstance from "../axiosInstance";
import { SupportTicketDto, CreateSupportTicketCommand } from "../types/support.types";

export const getMyTickets = async (): Promise<SupportTicketDto[]> => {
  const response = await axiosInstance.get<SupportTicketDto[]>("/api/support/tickets/mine");
  return response.data;
};

export const createTicket = async (command: CreateSupportTicketCommand): Promise<number> => {
  const response = await axiosInstance.post<number>("/api/support/tickets", command);
  return response.data;
};
