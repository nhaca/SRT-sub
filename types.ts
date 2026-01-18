
export enum AppTab {
  EXTRACT = 'EXTRACT',
  TRANSLATE = 'TRANSLATE'
}

export enum TargetLanguage {
  VIETNAMESE = 'Tiếng Việt',
  ENGLISH = 'Tiếng Anh',
  CHINESE = 'Tiếng Trung'
}

export interface SrtSegment {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export interface ProcessingStatus {
  loading: boolean;
  message: string;
  error: string | null;
}
