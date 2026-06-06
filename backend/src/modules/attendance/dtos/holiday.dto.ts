export interface CreateHolidayDto {
  name: string;
  date: string | Date;
  description?: string;
  isOptional?: boolean;
}

export interface UpdateHolidayDto {
  name?: string;
  date?: string | Date;
  description?: string;
  isOptional?: boolean;
}

export interface HolidayQueryDto {
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
}
