export interface CreateShiftDto {
  name: string;
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  gracePeriodMinutes?: number;
  workingHoursPerDay?: number;
  isFlexible?: boolean;
}

export interface UpdateShiftDto {
  name?: string;
  startTime?: string;
  endTime?: string;
  gracePeriodMinutes?: number;
  workingHoursPerDay?: number;
  isFlexible?: boolean;
}
