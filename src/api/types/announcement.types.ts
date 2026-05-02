export interface AnnouncementDto {
  id: number;
  titleEn: string;
  titleTr: string;
  bodyEn: string;
  bodyTr: string;
  severity: AnnouncementSeverity;
}

export enum AnnouncementSeverity {
  Info = 0,
  Success = 1,
  Warning = 2,
  Error = 3,
  Promotion = 4
}
