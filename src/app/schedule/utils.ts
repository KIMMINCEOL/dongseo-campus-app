import { CustomSchedule } from './types';

// 🎨 동일한 일정끼리 헷갈리지 않게 고유 색상을 매칭하는 컬러 팔레트 & 헬퍼 함수
export const SCHEDULE_COLOR_PALETTE = [
  '#9E1B32', // Dongseo Burgundy
  '#007AFF', // Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#5856D6', // Indigo / Purple
  '#AF52DE', // Violet
  '#00C7BE', // Teal
  '#FF2D55', // Pink
  '#5AC8FA', // Sky Blue
  '#E056FD', // Orchid
];

export function getScheduleColor(schedule: CustomSchedule): string {
  if (schedule.color) return schedule.color;
  // 제목 기반 해시 코드로 동일한 일정은 캘린더 전체에서 동일한 고유 색상 유지
  let hash = 0;
  for (let i = 0; i < schedule.title.length; i++) {
    hash = (hash << 5) - hash + schedule.title.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % SCHEDULE_COLOR_PALETTE.length;
  return SCHEDULE_COLOR_PALETTE[colorIndex];
}

// "13:00" -> { ampm: '오후', hour: 1, minute: '00' }
export function parseTimeToAmPm(timeStr: string) {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr || '12', 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? '오후' : '오전';
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  return { ampm, hour: displayHour, minute: m };
}

// { ampm: '오후', hour: 1, minute: '00' } -> "13:00"
export function composeTimeFromAmPm(ampm: string, hour: number, minute: string) {
  let h = hour;
  if (ampm === '오후' && h < 12) h += 12;
  if (ampm === '오전' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

export function formatKoreanTimeDisplay(timeStr: string) {
  const { ampm, hour, minute } = parseTimeToAmPm(timeStr);
  return `${ampm} ${hour}:${minute}`;
}

export function formatKoreanDateDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${y}. ${parseInt(m, 10)}. ${parseInt(d, 10)}.`;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftDateByMonth(dateStr: string, monthDelta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1 + monthDelta, 1);
  const lastDate = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(d, lastDate);
  const finalDate = new Date(target.getFullYear(), target.getMonth(), clampedDay);
  return formatDate(finalDate);
}

// 📅 특정 날짜에 해당하는 일정 필터링
// (3일 이상 이어지는 긴 일정도 중간 날짜 클릭 시 정상적으로 조회되도록 기간 내 날짜 모두 포함)
export function filterSchedulesForDate(dateStr: string, schedules: CustomSchedule[]) {
  return schedules.filter((s) => {
    if (s.startDate === s.endDate) {
      return dateStr === s.startDate;
    }
    const fixedEndDate = s.endDate >= s.startDate ? s.endDate : s.startDate;
    return dateStr >= s.startDate && dateStr <= fixedEndDate;
  });
}
