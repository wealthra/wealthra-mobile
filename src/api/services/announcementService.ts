import axiosInstance from "../axiosInstance";
import { AnnouncementDto } from "../types/announcement.types";

let announcementsShownThisSession = false;

export const getActiveAnnouncements = async (): Promise<AnnouncementDto[]> => {
  const response = await axiosInstance.get<AnnouncementDto[]>("/api/Announcements/active");
  return response.data;
};

export const hasShownAnnouncements = () => announcementsShownThisSession;
export const setAnnouncementsShown = (value: boolean) => {
  announcementsShownThisSession = value;
};
