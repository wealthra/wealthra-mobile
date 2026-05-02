import axiosInstance from "../axiosInstance";
import { AnnouncementDto } from "../types/announcement.types";

export const getActiveAnnouncements = async (): Promise<AnnouncementDto[]> => {
  const response = await axiosInstance.get<AnnouncementDto[]>("/Announcements/active");
  return response.data;
};
