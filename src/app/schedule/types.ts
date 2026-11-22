import { AcademicSchedule } from '@/types';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 📅 현재 연도 기준 지원 연도 동적 계산 (작년 ~ 내후년 자동 확장)
export const CURRENT_BASE_YEAR = new Date().getFullYear();
export const MIN_SUPPORTED_YEAR = CURRENT_BASE_YEAR - 1;
export const MAX_SUPPORTED_YEAR = CURRENT_BASE_YEAR + 2;

export const COLOR_OPTIONS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#007AFF', // Blue
  '#5856D6', // Purple
  '#AF52DE', // Violet
  '#9E1B32', // Dongseo Burgundy
];

export interface CustomSchedule extends Omit<AcademicSchedule, 'category'> {
  category?: AcademicSchedule['category'] | '개인일정' | string;
  color?: string;
  memo?: string;
  startTime?: string; // e.g. "13:00"
  endTime?: string;   // e.g. "14:00"
  isAllDay?: boolean;
}

export interface MonthData {
  year: number;
  month: number;
  label: string;
  cells: {
    dateNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    schedules: CustomSchedule[];
  }[];
}
