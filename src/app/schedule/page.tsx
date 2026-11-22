'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { AcademicSchedule } from '@/types';
import {
  Loader2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Repeat,
  Bell,
  FileText,
  Edit2,
  Trash2,
  Check,
  RotateCw,
} from 'lucide-react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 📅 현재 연도 기준 지원 연도 동적 계산 (작년 ~ 내후년 자동 확장)
const CURRENT_BASE_YEAR = new Date().getFullYear();
const MIN_SUPPORTED_YEAR = CURRENT_BASE_YEAR - 1;
const MAX_SUPPORTED_YEAR = CURRENT_BASE_YEAR + 2;

const COLOR_OPTIONS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#007AFF', // Blue
  '#5856D6', // Purple
  '#AF52DE', // Violet
  '#9E1B32', // Dongseo Burgundy
];

interface CustomSchedule extends Omit<AcademicSchedule, 'category'> {
  category?: AcademicSchedule['category'] | '개인일정' | string;
  color?: string;
  memo?: string;
  startTime?: string; // e.g. "13:00"
  endTime?: string;   // e.g. "14:00"
  isAllDay?: boolean;
}

// 🎨 동일한 일정끼리 헷갈리지 않게 고유 색상을 매칭하는 컬러 팔레트 & 헬퍼 함수
const SCHEDULE_COLOR_PALETTE = [
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

function getScheduleColor(schedule: CustomSchedule): string {
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
function parseTimeToAmPm(timeStr: string) {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr || '12', 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? '오후' : '오전';
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  return { ampm, hour: displayHour, minute: m };
}

// { ampm: '오후', hour: 1, minute: '00' } -> "13:00"
function composeTimeFromAmPm(ampm: string, hour: number, minute: string) {
  let h = hour;
  if (ampm === '오후' && h < 12) h += 12;
  if (ampm === '오전' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

function formatKoreanTimeDisplay(timeStr: string) {
  const { ampm, hour, minute } = parseTimeToAmPm(timeStr);
  return `${ampm} ${hour}:${minute}`;
}

function shiftDateByMonth(dateStr: string, monthDelta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1 + monthDelta, 1);
  const lastDate = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(d, lastDate);
  const finalDate = new Date(target.getFullYear(), target.getMonth(), clampedDay);
  return formatDate(finalDate);
}

interface MonthData {
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

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<CustomSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [buttonCooldown, setButtonCooldown] = useState(0);

  // 선택된 특정 날짜
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDate(new Date()));

  // 현재 보고 있는 년도 및 월 (기본값: 오늘 날짜 기준)
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth()); // 0 ~ 11

  // 년/월 선택 모달 상태
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => new Date().getFullYear());

  // 📝 개인 일정 추가 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(() => formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('14:00');
  const [repeat, setRepeat] = useState('반복 안함');
  const [alertTime, setAlertTime] = useState('30분 전');
  const [memo, setMemo] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[7]); // 기본: 동서대 버건디

  function formatKoreanDateDisplay(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${y}. ${parseInt(m, 10)}. ${parseInt(d, 10)}.`;
  }

  // 🎡 아이폰 스타일 피커 열림 상태 ('start' | 'end' | 'startDate' | 'endDate' | 'repeat' | 'alert' | null)
  const [activePickerTarget, setActivePickerTarget] = useState<
    'start' | 'end' | 'startDate' | 'endDate' | 'repeat' | 'alert' | null
  >(null);

  // 🔍 클릭한 일정 상세 보기 모달 상태
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<CustomSchedule | null>(null);

  // 🔄 실시간 학사일정 불러오기 & 최신화 함수 (forceRefresh: 동서대 실시간 크롤링 및 DB 동기화 강제)
  const fetchSchedule = async (showLoading = true, forceRefresh = false) => {
    if (showLoading) setLoading(true);
    if (forceRefresh) setIsSyncing(true);
    try {
      // 🛡️ 학교 사이트 보호: 사용자가 현재 보고 있는 연도(currentYear)만 refresh=true 전달 (1년에 단 1건의 HTTP 요청)
      // 나머지 연도는 Supabase DB 캐시에서만 조회하여 학교 사이트 DoS 방지
      const targetYears = [CURRENT_BASE_YEAR - 1, CURRENT_BASE_YEAR, CURRENT_BASE_YEAR + 1];
      const responses = await Promise.all(
        targetYears.map(async (y) => {
          try {
            const refreshParam = forceRefresh && y === currentYear ? '&refresh=true' : '';
            const res = await fetch(`/api/schedule?year=${y}${refreshParam}`, { cache: 'no-store' });
            const json = await res.json();
            return { ok: res.ok, ...json };
          } catch (e) {
            return { ok: false, success: false, data: [] };
          }
        })
      );

      // 크롤링 성공 여부, 폴백 여부, 쿨다운 여부 확인
      const allSucceeded = responses.every((r) => r.ok && r.success);
      const anyFallback = responses.some((r) => r.source === 'fallback_database' || !r.success);
      const throttledRes = responses.find((r) => r.throttled);
      const combined = responses.flatMap((res) => res.data || []);

      // 유효한 일정이 있을 때만 상태를 업데이트 (크롤링 실패/빈 응답 시 기존 일정 증발 방지)
      if (combined.length > 0) {
        let loaded = combined.map((item: CustomSchedule) => ({
          ...item,
          title: item.title.replace(/^(\d{2,4}[-년\s]*[12]학기|\d{2,4}학년도|\d{2,4}년)\s*/, '').trim() || item.title,
        }));

        // 로컬 스토리지에 저장된 사용자 개인 일정 불러오기
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('dsu_personal_schedules');
          if (saved) {
            try {
              const personal = JSON.parse(saved);
              loaded = [...loaded, ...personal];
            } catch (e) {
              console.error(e);
            }
          }
        }
        setSchedules(loaded);
      }

      // 새로고침 완료 알림 (성공 / 10분 쿨다운 보호 / 기존 DB 유지 / 완전 실패 구분)
      if (forceRefresh) {
        if (throttledRes && throttledRes.message) {
          setSyncToast(throttledRes.message);
        } else if (allSucceeded) {
          setSyncToast('동서대 학사일정이 최신화되었습니다.');
        } else if (anyFallback && combined.length > 0) {
          setSyncToast('동서대 서버 응답 지연: 기존 저장된 일정을 유지합니다.');
        } else {
          setSyncToast('동서대 일정 서버에 연결할 수 없습니다.');
        }
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
      if (forceRefresh) {
        setSyncToast('일정 동기화 중 오류가 발생했습니다.');
        setTimeout(() => setSyncToast(null), 3000);
      }
    } finally {
      if (showLoading) setLoading(false);
      if (forceRefresh) setIsSyncing(false);
    }
  };

  // 새로고침 버튼 10초 쿨다운 카운트다운 타이머
  useEffect(() => {
    if (buttonCooldown <= 0) return;
    const timer = setInterval(() => {
      setButtonCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [buttonCooldown]);

  useEffect(() => {
    fetchSchedule(true);

    // 🕒 5분(300,000ms)마다 백그라운드에서 동서대 홈페이지를 체크하여 자동 최신화
    const autoRefreshTimer = setInterval(() => {
      fetchSchedule(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(autoRefreshTimer);
  }, []);

  // 현재 선택된 월의 셀 데이터 계산
  const currentMonthData = React.useMemo(() => {
    const y = currentYear;
    const m = currentMonth;
    const firstDayOfWeek = new Date(y, m, 1).getDay();
    const lastDateOfMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthLastDate = new Date(y, m, 0).getDate();

    const cells = [];

    // 이전 달 날짜 채우기
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevMonthDate = new Date(y, m - 1, d);
      const dateStr = formatDate(prevMonthDate);
      cells.push({
        dateNumber: d,
        dateStr,
        isCurrentMonth: false,
        schedules: filterSchedulesForDate(dateStr, schedules),
      });
    }

    // 현재 달 날짜 채우기
    for (let d = 1; d <= lastDateOfMonth; d++) {
      const thisDate = new Date(y, m, d);
      const dateStr = formatDate(thisDate);
      cells.push({
        dateNumber: d,
        dateStr,
        isCurrentMonth: true,
        schedules: filterSchedulesForDate(dateStr, schedules),
      });
    }

    // 다음 달 날짜 채우기 (35칸 또는 42칸으로 균일하게 채움)
    const totalCount = cells.length > 35 ? 42 : 35;
    const remaining = totalCount - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthDate = new Date(y, m + 1, d);
      const dateStr = formatDate(nextMonthDate);
      cells.push({
        dateNumber: d,
        dateStr,
        isCurrentMonth: false,
        schedules: filterSchedulesForDate(dateStr, schedules),
      });
    }

    return {
      year: y,
      month: m,
      label: `${y}년 ${m + 1}월`,
      cells,
    };
  }, [currentYear, currentMonth, schedules]);

  const scrollToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(formatDate(now));
  };

  // 년/월 변경 선택창 열기
  const handleOpenMonthPicker = () => {
    setPickerYear(currentYear);
    setIsMonthPickerOpen(true);
  };

  // 년/월 선택 완료
  const handleSelectMonth = (monthIdx: number) => {
    setCurrentYear(pickerYear);
    setCurrentMonth(monthIdx);
    setIsMonthPickerOpen(false);
  };

  // 현재 수정 중인 일정 ID (null이면 새 일정 추가 모드)
  const [editingId, setEditingId] = useState<string | null>(null);

  // 일정 추가 모달 열기
  const handleOpenAddModal = () => {
    setEditingId(null);
    setStartDate(selectedDateStr);
    setEndDate(selectedDateStr);
    setStartTime('13:00');
    setEndTime('14:00');
    setIsAllDay(false);
    setTitle('');
    setMemo('');
    setSelectedColor(COLOR_OPTIONS[7]);
    setIsAddModalOpen(true);
  };

  // 기존 일정 수정 모달 열기
  const handleOpenEditModal = (schedule: CustomSchedule) => {
    setEditingId(schedule.id);
    setTitle(schedule.title);
    setStartDate(schedule.startDate);
    setEndDate(schedule.endDate);
    setStartTime(schedule.startTime || '13:00');
    setEndTime(schedule.endTime || '14:00');
    setIsAllDay(schedule.isAllDay ?? false);
    setMemo(schedule.memo || '');
    if (schedule.color) setSelectedColor(schedule.color);
    setSelectedScheduleDetail(null); // 상세 팝업 닫기
    setIsAddModalOpen(true); // 입력/수정 팝업 열기
  };

  // 일정 삭제
  const handleDeleteSchedule = (id: string) => {
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;

    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);

    if (typeof window !== 'undefined') {
      const personalOnly = updated.filter((s) => s.id.startsWith('personal-'));
      localStorage.setItem('dsu_personal_schedules', JSON.stringify(personalOnly));
    }

    setSelectedScheduleDetail(null);
  };

  // 일정 등록 및 수정 저장
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let updated: CustomSchedule[];

    if (editingId) {
      // 기존 일정 수정
      updated = schedules.map((s) =>
        s.id === editingId
          ? {
              ...s,
              title: title.trim(),
              startDate,
              endDate: endDate >= startDate ? endDate : startDate,
              startTime: isAllDay ? undefined : startTime,
              endTime: isAllDay ? undefined : endTime,
              isAllDay,
              color: selectedColor,
              memo: memo.trim(),
            }
          : s
      );
    } else {
      // 새 일정 추가
      const newSchedule: CustomSchedule = {
        id: `personal-${Date.now()}`,
        title: title.trim(),
        startDate,
        endDate: endDate >= startDate ? endDate : startDate,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        isAllDay,
        category: '개인일정',
        color: selectedColor,
        memo: memo.trim(),
      };
      updated = [...schedules, newSchedule];
    }

    setSchedules(updated);

    // 개인 일정 로컬 스토리지에 저장
    if (typeof window !== 'undefined') {
      const personalOnly = updated.filter((s) => s.id.startsWith('personal-'));
      localStorage.setItem('dsu_personal_schedules', JSON.stringify(personalOnly));
    }

    setIsAddModalOpen(false);
    setEditingId(null);
  };

  return (
    <main className="h-screen bg-white flex flex-col overflow-hidden pb-16">
      <Header title="학사일정" />

      <div className="flex-1 flex flex-col max-w-[480px] mx-auto w-full overflow-hidden">
        {/* 상단 서브바: 오늘로 이동 & ➕ 일정 추가 버튼 */}
        <div className="bg-white/95 backdrop-blur-md z-20 border-b border-slate-100 px-4 py-1.5 shrink-0 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">학사 캘린더</span>

          <div className="flex items-center gap-1.5">
            {/* 🔄 수동 즉시 새로고침 버튼 (동서대 홈페이지에서 강제 최신화, 10초 UI 쿨다운) */}
            <button
              onClick={() => {
                if (isSyncing || buttonCooldown > 0) return;
                setButtonCooldown(10);
                fetchSchedule(false, true);
              }}
              disabled={isSyncing || buttonCooldown > 0}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 flex items-center justify-center transition disabled:opacity-50 text-[11px] font-bold"
              title={buttonCooldown > 0 ? `${buttonCooldown}초 후 새로고침 가능` : "동서대 학사일정 실시간 최신화"}
              aria-label="학사일정 최신화"
            >
              {buttonCooldown > 0 ? (
                <span className="text-[11px] font-semibold text-slate-400">{buttonCooldown}</span>
              ) : (
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-dongseo-700' : ''}`} />
              )}
            </button>

            <button
              onClick={scrollToToday}
              className="text-xs font-bold text-dongseo-700 bg-dongseo-50 hover:bg-dongseo-100 active:scale-95 px-3 py-1 rounded-full transition shadow-xs"
            >
              오늘로 이동
            </button>

            {/* ➕ 개인 일정 추가 버튼 */}
            <button
              onClick={handleOpenAddModal}
              className="w-7 h-7 rounded-full bg-dongseo-700 hover:bg-dongseo-800 active:scale-90 text-white flex items-center justify-center transition shadow-sm"
              title="개인 일정 추가"
              aria-label="일정 추가"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 🔔 최신화 알림 토스트 배너 */}
        {syncToast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all animate-fade-in pointer-events-none">
            {syncToast}
          </div>
        )}

        {/* 📱 스크롤 없이 단일 월 표시 & 년/월 클릭 시 커스텀 휠 피커로 이동 */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-dongseo-700 mb-2" />
            <span className="text-xs font-medium">학사일정을 불러오는 중...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col px-3 pt-2 pb-1 overflow-hidden">
            {(() => {
              const monthData = currentMonthData;
              const rowsCount = monthData.cells.length / 7;

              return (
                <div className="h-full flex flex-col box-border">
                  {/* 월 타이틀: 클릭 시 년도/달 선택 팝업 열림 */}
                  <div className="py-1 shrink-0 px-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleOpenMonthPicker}
                      className="group flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition"
                    >
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                        <span>{monthData.label}</span>
                        <ChevronRight className="w-5 h-5 text-dongseo-700 group-hover:translate-x-0.5 transition-transform" />
                      </h2>
                    </button>

                    {/* 이전 달 / 다음 달 버튼 */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentMonth === 0) {
                            if (currentYear > MIN_SUPPORTED_YEAR) {
                              setCurrentYear(currentYear - 1);
                              setCurrentMonth(11);
                            }
                          } else {
                            setCurrentMonth(currentMonth - 1);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-90 transition"
                        title="이전 달"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentMonth === 11) {
                            if (currentYear < MAX_SUPPORTED_YEAR) {
                              setCurrentYear(currentYear + 1);
                              setCurrentMonth(0);
                            }
                          } else {
                            setCurrentMonth(currentMonth + 1);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-90 transition"
                        title="다음 달"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* 월 타이틀 바로 밑에 배치된 요일 헤더 */}
                  <div className="grid grid-cols-7 py-1 text-center shrink-0 border-b border-slate-100">
                    {WEEKDAYS.map((day, idx) => (
                      <span
                        key={day}
                        className={`text-xs font-bold ${
                          idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : 'text-slate-400'
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* 캘린더 그리드가 화면 잔여 높이를 100% 꽉 채우도록 설정 */}
                  <div
                    className="flex-1 grid grid-cols-7 pt-1"
                    style={{
                      gridTemplateRows: `repeat(${rowsCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {monthData.cells.map((cell, idx) => {
                      const isSelected = cell.dateStr === selectedDateStr;
                      const isToday = cell.dateStr === formatDate(new Date());
                      const hasEvents = cell.schedules.length > 0;

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDateStr(cell.dateStr)}
                          className={`flex flex-col items-center justify-start pt-1 pb-1 transition-all duration-150 relative ${
                            isSelected
                              ? 'bg-dongseo-700/10 rounded-xl font-bold'
                              : isToday
                              ? 'bg-dongseo-50 font-extrabold'
                              : cell.isCurrentMonth
                              ? 'text-slate-800 hover:bg-slate-50'
                              : 'text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {/* 위쪽으로 배치된 날짜 숫자 */}
                          <span
                            className={`w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full leading-none mb-0.5 ${
                              isSelected
                                ? 'bg-dongseo-700 text-white font-extrabold shadow-sm'
                                : isToday
                                ? 'bg-dongseo-100 text-dongseo-800 font-extrabold'
                                : ''
                            }`}
                          >
                            {cell.dateNumber}
                          </span>

                          {/* 이미지 속 스타일의 일정 텍스트 뱃지 (사이 여백 없이 완전히 이어짐) */}
                          <div className="w-full flex-1 flex flex-col gap-0.5">
                            {hasEvents &&
                              cell.schedules.slice(0, 3).map((s, sIdx) => {
                                const badgeColor = getScheduleColor(s);
                                const isMultiDay = s.startDate !== s.endDate;
                                const isStartDay = cell.dateStr === s.startDate;
                                const isEndDay = cell.dateStr === s.endDate;
                                const isMiddleDay = isMultiDay && !isStartDay && !isEndDay;

                                // 첫날과 마지막 날만 독립적으로 표시되므로 온전한 둥근 뱃지 적용
                                const roundingClass = 'rounded-md mx-0.5';

                                return (
                                  <div
                                    key={sIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedScheduleDetail(s);
                                    }}
                                    className={`w-full ${roundingClass} h-4 px-1 py-0.5 text-[10px] font-bold text-left flex items-center gap-1 leading-tight cursor-pointer hover:opacity-90 active:scale-95 transition-transform relative z-0 text-white`}
                                    style={{
                                      backgroundColor: badgeColor,
                                    }}
                                    title={s.title}
                                  >
                                    {/* 시작일, 종료일 또는 단일 일정일 때 점 아이콘과 타이틀 노출 */}
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{
                                        backgroundColor: '#ffffff',
                                      }}
                                    />
                                    <span className="truncate leading-none">
                                      {s.title}
                                    </span>
                                  </div>
                                );
                              })}
                            {cell.schedules.length > 3 && (
                              <span
                                className={`text-[8px] font-extrabold text-left px-1 ${
                                  isSelected ? 'text-white' : 'text-dongseo-700'
                                }`}
                              >
                                +{cell.schedules.length - 3}개 더보기
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 📅 년도 및 월 선택 모달 (iOS 스타일 휠/피커 및 라운드 스타일) */}
      {isMonthPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-extrabold text-slate-900">날짜 이동</span>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 년도 선택 (< > 이동 버튼 및 뱃지) */}
            <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setPickerYear(Math.max(MIN_SUPPORTED_YEAR, pickerYear - 1))}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 active:scale-95 transition"
                disabled={pickerYear <= MIN_SUPPORTED_YEAR}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                {pickerYear}년
              </span>
              <button
                type="button"
                onClick={() => setPickerYear(Math.min(MAX_SUPPORTED_YEAR, pickerYear + 1))}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 active:scale-95 transition"
                disabled={pickerYear >= MAX_SUPPORTED_YEAR}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 1월 ~ 12월 그리드 선택 (아이폰 라운드 뱃지 스타일) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {Array.from({ length: 12 }, (_, i) => i).map((mIdx) => {
                const isCur = pickerYear === currentYear && mIdx === currentMonth;
                return (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={() => handleSelectMonth(mIdx)}
                    className={`py-3 rounded-2xl font-bold text-xs transition border ${
                      isCur
                        ? 'bg-dongseo-700 text-white border-dongseo-700 shadow-sm'
                        : 'bg-slate-50 text-slate-800 border-slate-200/80 hover:bg-slate-100 hover:border-dongseo-300'
                    }`}
                  >
                    {mIdx + 1}월
                  </button>
                );
              })}
            </div>

            {/* 오늘로 바로 가기 버튼 */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  scrollToToday();
                  setIsMonthPickerOpen(false);
                }}
                className="w-full py-2.5 bg-dongseo-50 hover:bg-dongseo-100 text-dongseo-700 font-extrabold text-xs rounded-xl transition"
              >
                오늘 날짜({new Date().getFullYear()}년 {new Date().getMonth() + 1}월)로 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 사진 속 UI와 동일한 개인 일정 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* 상단 네비게이션 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingId ? '일정 수정' : '일정 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 제목 입력 */}
              <div>
                <input
                  type="text"
                  placeholder="제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-base font-bold placeholder:text-slate-300 border-b border-slate-200 pb-2 outline-none focus:border-dongseo-700 transition"
                  required
                  autoFocus
                />
              </div>

              {/* 하루 종일 토글 */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  하루 종일
                </span>
                <button
                  type="button"
                  onClick={() => setIsAllDay(!isAllDay)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    isAllDay ? 'bg-dongseo-700' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-transform ${
                      isAllDay ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* 📱 사진 속 UI와 동일한 아이폰 라운드 카드 및 상하 스크롤 휠 피커 */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-3">
                {/* 시작 날짜 & 시간 버튼 */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-extrabold text-sm">시작</span>
                  <div className="flex items-center gap-1.5">
                    {/* 사진 속과 똑같은 아이폰 둥근 날짜 버튼 */}
                    <button
                      type="button"
                      onClick={() =>
                        setActivePickerTarget(activePickerTarget === 'startDate' ? null : 'startDate')
                      }
                      className={`px-3 py-1.5 rounded-2xl font-bold text-xs transition border ${
                        activePickerTarget === 'startDate'
                          ? 'bg-dongseo-700 text-white border-dongseo-700 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200/90 shadow-xs hover:border-dongseo-400'
                      }`}
                    >
                      {formatKoreanDateDisplay(startDate)}
                    </button>

                    {!isAllDay && (
                      <button
                        type="button"
                        onClick={() =>
                          setActivePickerTarget(activePickerTarget === 'start' ? null : 'start')
                        }
                        className={`px-3 py-1.5 rounded-2xl font-bold text-xs transition border ${
                          activePickerTarget === 'start'
                            ? 'bg-dongseo-700 text-white border-dongseo-700 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200/90 shadow-xs hover:border-dongseo-400'
                        }`}
                      >
                        {formatKoreanTimeDisplay(startTime)}
                      </button>
                    )}
                  </div>
                </div>

                {/* 📅 시작 날짜용 아이폰 인라인 달력 (< > 버튼으로 이전/다음 달 이동) */}
                {activePickerTarget === 'startDate' && (
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm animate-in fade-in space-y-2">
                    {(() => {
                      const [y, m, d] = startDate.split('-').map(Number);
                      const currentMonthDate = new Date(y, m - 1, 1);
                      const firstDay = currentMonthDate.getDay();
                      const lastDate = new Date(y, m, 0).getDate();

                      return (
                        <div>
                          {/* 달력 상단: 년/월 및 < > 이동 버튼 */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="text-xs font-extrabold text-slate-900">
                              {y}년 {m}월
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setStartDate(shiftDateByMonth(startDate, -1))}
                                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setStartDate(shiftDateByMonth(startDate, 1))}
                                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* 요일 */}
                          <div className="grid grid-cols-7 py-1 text-center">
                            {WEEKDAYS.map((w, wIdx) => (
                              <span
                                key={w}
                                className={`text-[10px] font-bold ${
                                  wIdx === 0 ? 'text-rose-500' : wIdx === 6 ? 'text-blue-500' : 'text-slate-400'
                                }`}
                              >
                                {w}
                              </span>
                            ))}
                          </div>

                          {/* 날짜 그리드 */}
                          <div className="grid grid-cols-7 gap-1 pt-1">
                            {Array.from({ length: firstDay }).map((_, fIdx) => (
                              <span key={`empty-${fIdx}`} className="py-1" />
                            ))}
                            {Array.from({ length: lastDate }, (_, i) => i + 1).map((dayNum) => {
                              const thisDateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                              const isCur = thisDateStr === startDate;
                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => {
                                    setStartDate(thisDateStr);
                                    if (endDate < thisDateStr) setEndDate(thisDateStr);
                                    setActivePickerTarget(null);
                                  }}
                                  className={`py-1.5 text-xs font-bold rounded-xl transition ${
                                    isCur
                                      ? 'bg-dongseo-700 text-white shadow-xs'
                                      : 'text-slate-700 hover:bg-slate-100 active:scale-95'
                                  }`}
                                >
                                  {dayNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 🎡 시작 시간 상하 휠 피커 (오전/오후, 시, 분) */}
                {!isAllDay && activePickerTarget === 'start' && (
                  <div className="py-2 px-1 bg-white border border-slate-100 rounded-2xl shadow-xs animate-in fade-in">
                    {(() => {
                      const cur = parseTimeToAmPm(startTime);
                      return (
                        <div className="grid grid-cols-3 gap-2 text-center items-center">
                          {/* 오전 / 오후 선택 */}
                          <div className="flex flex-col gap-1 p-1 bg-slate-50 rounded-xl">
                            {['오전', '오후'].map((ampm) => (
                              <button
                                key={ampm}
                                type="button"
                                onClick={() =>
                                  setStartTime(composeTimeFromAmPm(ampm, cur.hour, cur.minute))
                                }
                                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                                  cur.ampm === ampm
                                    ? 'bg-dongseo-700 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200/60'
                                }`}
                              >
                                {ampm}
                              </button>
                            ))}
                          </div>

                          {/* 시 (1 ~ 12) 스크롤 휠 */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">시</span>
                            <div className="h-24 overflow-y-auto w-full no-scrollbar snap-y snap-mandatory bg-slate-50 rounded-xl p-1 border border-slate-100">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() =>
                                    setStartTime(composeTimeFromAmPm(cur.ampm, h, cur.minute))
                                  }
                                  className={`w-full py-1 text-xs font-bold rounded-lg transition ${
                                    cur.hour === h
                                      ? 'bg-dongseo-700 text-white shadow-xs'
                                      : 'text-slate-600 hover:bg-slate-200/60'
                                  }`}
                                >
                                  {h}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 분 (00 ~ 55, 5분 단위) 스크롤 휠 */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">분</span>
                            <div className="h-24 overflow-y-auto w-full no-scrollbar snap-y snap-mandatory bg-slate-50 rounded-xl p-1 border border-slate-100">
                              {[
                                '00', '05', '10', '15', '20', '25',
                                '30', '35', '40', '45', '50', '55',
                              ].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() =>
                                    setStartTime(composeTimeFromAmPm(cur.ampm, cur.hour, m))
                                  }
                                  className={`w-full py-1 text-xs font-bold rounded-lg transition ${
                                    cur.minute === m
                                      ? 'bg-dongseo-700 text-white shadow-xs'
                                      : 'text-slate-600 hover:bg-slate-200/60'
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 종료 날짜 & 시간 버튼 */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-700 font-extrabold text-sm">종료</span>
                  <div className="flex items-center gap-1.5">
                    {/* 사진 속과 똑같은 아이폰 둥근 날짜 버튼 */}
                    <button
                      type="button"
                      onClick={() =>
                        setActivePickerTarget(activePickerTarget === 'endDate' ? null : 'endDate')
                      }
                      className={`px-3 py-1.5 rounded-2xl font-bold text-xs transition border ${
                        activePickerTarget === 'endDate'
                          ? 'bg-dongseo-700 text-white border-dongseo-700 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200/90 shadow-xs hover:border-dongseo-400'
                      }`}
                    >
                      {formatKoreanDateDisplay(endDate)}
                    </button>

                    {!isAllDay && (
                      <button
                        type="button"
                        onClick={() =>
                          setActivePickerTarget(activePickerTarget === 'end' ? null : 'end')
                        }
                        className={`px-3 py-1.5 rounded-2xl font-bold text-xs transition border ${
                          activePickerTarget === 'end'
                            ? 'bg-dongseo-700 text-white border-dongseo-700 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200/90 shadow-xs hover:border-dongseo-400'
                        }`}
                      >
                        {formatKoreanTimeDisplay(endTime)}
                      </button>
                    )}
                  </div>
                </div>

                {/* 📅 종료 날짜용 아이폰 인라인 달력 (< > 버튼으로 이전/다음 달 이동) */}
                {activePickerTarget === 'endDate' && (
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm animate-in fade-in space-y-2">
                    {(() => {
                      const [y, m, d] = endDate.split('-').map(Number);
                      const currentMonthDate = new Date(y, m - 1, 1);
                      const firstDay = currentMonthDate.getDay();
                      const lastDate = new Date(y, m, 0).getDate();

                      return (
                        <div>
                          {/* 달력 상단: 년/월 및 < > 이동 버튼 */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="text-xs font-extrabold text-slate-900">
                              {y}년 {m}월
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEndDate(shiftDateByMonth(endDate, -1))}
                                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEndDate(shiftDateByMonth(endDate, 1))}
                                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* 요일 */}
                          <div className="grid grid-cols-7 py-1 text-center">
                            {WEEKDAYS.map((w, wIdx) => (
                              <span
                                key={w}
                                className={`text-[10px] font-bold ${
                                  wIdx === 0 ? 'text-rose-500' : wIdx === 6 ? 'text-blue-500' : 'text-slate-400'
                                }`}
                              >
                                {w}
                              </span>
                            ))}
                          </div>

                          {/* 날짜 그리드 */}
                          <div className="grid grid-cols-7 gap-1 pt-1">
                            {Array.from({ length: firstDay }).map((_, fIdx) => (
                              <span key={`empty-${fIdx}`} className="py-1" />
                            ))}
                            {Array.from({ length: lastDate }, (_, i) => i + 1).map((dayNum) => {
                              const thisDateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                              const isCur = thisDateStr === endDate;
                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => {
                                    setEndDate(thisDateStr);
                                    setActivePickerTarget(null);
                                  }}
                                  className={`py-1.5 text-xs font-bold rounded-xl transition ${
                                    isCur
                                      ? 'bg-dongseo-700 text-white shadow-xs'
                                      : 'text-slate-700 hover:bg-slate-100 active:scale-95'
                                  }`}
                                >
                                  {dayNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 🎡 종료 시간 상하 휠 피커 (오전/오후, 시, 분) */}
                {!isAllDay && activePickerTarget === 'end' && (
                  <div className="py-2 px-1 bg-white border border-slate-100 rounded-2xl shadow-xs animate-in fade-in">
                    {(() => {
                      const cur = parseTimeToAmPm(endTime);
                      return (
                        <div className="grid grid-cols-3 gap-2 text-center items-center">
                          {/* 오전 / 오후 선택 */}
                          <div className="flex flex-col gap-1 p-1 bg-slate-50 rounded-xl">
                            {['오전', '오후'].map((ampm) => (
                              <button
                                key={ampm}
                                type="button"
                                onClick={() =>
                                  setEndTime(composeTimeFromAmPm(ampm, cur.hour, cur.minute))
                                }
                                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                                  cur.ampm === ampm
                                    ? 'bg-dongseo-700 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200/60'
                                }`}
                              >
                                {ampm}
                              </button>
                            ))}
                          </div>

                          {/* 시 (1 ~ 12) 스크롤 휠 */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">시</span>
                            <div className="h-24 overflow-y-auto w-full no-scrollbar snap-y snap-mandatory bg-slate-50 rounded-xl p-1 border border-slate-100">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() =>
                                    setEndTime(composeTimeFromAmPm(cur.ampm, h, cur.minute))
                                  }
                                  className={`w-full py-1 text-xs font-bold rounded-lg transition ${
                                    cur.hour === h
                                      ? 'bg-dongseo-700 text-white shadow-xs'
                                      : 'text-slate-600 hover:bg-slate-200/60'
                                  }`}
                                >
                                  {h}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 분 (00 ~ 55, 5분 단위) 스크롤 휠 */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">분</span>
                            <div className="h-24 overflow-y-auto w-full no-scrollbar snap-y snap-mandatory bg-slate-50 rounded-xl p-1 border border-slate-100">
                              {[
                                '00', '05', '10', '15', '20', '25',
                                '30', '35', '40', '45', '50', '55',
                              ].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() =>
                                    setEndTime(composeTimeFromAmPm(cur.ampm, cur.hour, m))
                                  }
                                  className={`w-full py-1 text-xs font-bold rounded-lg transition ${
                                    cur.minute === m
                                      ? 'bg-dongseo-700 text-white shadow-xs'
                                      : 'text-slate-600 hover:bg-slate-200/60'
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 반복 & 알림 설정 (아이폰 스타일 라운드 카드 및 라운드 옵션 팝업) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-3">
                {/* 반복 설정 */}
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-slate-400" />
                      반복
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePickerTarget(activePickerTarget === 'repeat' ? null : 'repeat')
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold text-xs transition border ${
                        activePickerTarget === 'repeat'
                          ? 'bg-dongseo-700 text-white border-dongseo-700 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200/90 shadow-xs hover:border-dongseo-400'
                      }`}
                    >
                      <span>{repeat}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          activePickerTarget === 'repeat' ? 'rotate-90 text-white' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 반복 옵션 라운드 팝업 리스트 */}
                  {activePickerTarget === 'repeat' && (
                    <div className="mt-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-0.5 animate-in fade-in">
                      {['반복 안함', '매일', '매주', '매월', '매년'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setRepeat(opt);
                            setActivePickerTarget(null);
                          }}
                          className={`w-full px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between transition ${
                            repeat === opt
                              ? 'bg-dongseo-50 text-dongseo-700 font-extrabold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt}</span>
                          {repeat === opt && <Check className="w-4 h-4 text-dongseo-700" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 알림 설정 */}
                <div className="pt-2.5 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-400" />
                      알림
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePickerTarget(activePickerTarget === 'alert' ? null : 'alert')
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-bold text-xs transition border ${
                        activePickerTarget === 'alert'
                          ? 'bg-dongseo-700 text-white border-dongseo-700 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200/90 shadow-xs hover:border-dongseo-400'
                      }`}
                    >
                      <span>{alertTime}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          activePickerTarget === 'alert' ? 'rotate-90 text-white' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 알림 옵션 라운드 팝업 리스트 */}
                  {activePickerTarget === 'alert' && (
                    <div className="mt-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-0.5 animate-in fade-in">
                      {['일정 시작 시간', '10분 전', '30분 전', '1시간 전', '1일 전'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setAlertTime(opt);
                            setActivePickerTarget(null);
                          }}
                          className={`w-full px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between transition ${
                            alertTime === opt
                              ? 'bg-dongseo-50 text-dongseo-700 font-extrabold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt}</span>
                          {alertTime === opt && <Check className="w-4 h-4 text-dongseo-700" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 메모 입력 */}
              <div className="py-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>메모 입력</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="추가적인 일정 메모를 입력하세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-dongseo-700 resize-none"
                />
              </div>

              {/* 컬러 팔레트 선택 */}
              <div className="py-2">
                <span className="text-xs font-semibold text-slate-700 block mb-2">색상 선택</span>
                <div className="flex items-center gap-2 justify-between">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* 하단 완료 버튼 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-dongseo-700 hover:bg-dongseo-800 text-white font-extrabold text-sm rounded-2xl transition shadow-md"
                >
                  완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔍 클릭한 일정 상세 내용 확인 모달 */}
      {selectedScheduleDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[360px] rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            {/* 상단 컬러 포인트 및 닫기 버튼 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getScheduleColor(selectedScheduleDetail),
                  }}
                />
                <span className="text-xs font-bold text-slate-500">
                  {selectedScheduleDetail.id.startsWith('personal-')
                    ? '개인일정'
                    : selectedScheduleDetail.category || '학사일정'}
                </span>
              </div>
              <button
                onClick={() => setSelectedScheduleDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 일정 제목 */}
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {selectedScheduleDetail.title}
              </h3>
            </div>

            {/* 일정 일시 및 D-Day */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  일정 기간
                </span>
                <div className="text-right">
                  <div className="font-bold text-slate-800">
                    {selectedScheduleDetail.startDate}
                    {selectedScheduleDetail.startDate !== selectedScheduleDetail.endDate &&
                      ` ~ ${selectedScheduleDetail.endDate}`}
                  </div>
                  <div className="text-[11px] text-dongseo-700 font-semibold">
                    {selectedScheduleDetail.isAllDay || (!selectedScheduleDetail.startTime && !selectedScheduleDetail.endTime)
                      ? '하루 종일'
                      : `${selectedScheduleDetail.startTime || '00:00'} ~ ${selectedScheduleDetail.endTime || '00:00'}`}
                  </div>
                </div>
              </div>

              {selectedScheduleDetail.dDay !== undefined && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    남은 기간
                  </span>
                  <span className="font-extrabold text-dongseo-700 bg-dongseo-50 px-2 py-0.5 rounded-full text-[11px]">
                    {selectedScheduleDetail.dDay === 0
                      ? 'D-Day (오늘)'
                      : selectedScheduleDetail.dDay > 0
                      ? `D-${selectedScheduleDetail.dDay}`
                      : '종료된 일정'}
                  </span>
                </div>
              )}
            </div>

            {/* 메모가 있는 경우 표시 */}
            {selectedScheduleDetail.memo && (
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs">
                <span className="text-[11px] font-bold text-amber-800 block mb-1">메모</span>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedScheduleDetail.memo}</p>
              </div>
            )}

            {/* 버튼 그룹: 수정, 삭제, 닫기 */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedScheduleDetail)}
                className="flex-1 py-2.5 bg-dongseo-50 hover:bg-dongseo-100 text-dongseo-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                수정
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSchedule(selectedScheduleDetail.id)}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>

              <button
                type="button"
                onClick={() => setSelectedScheduleDetail(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function filterSchedulesForDate(dateStr: string, schedules: CustomSchedule[]) {
  return schedules.filter((s) => {
    // 단일 일정이거나 2일 일정인 경우 전체 기간 표시
    if (s.startDate === s.endDate) {
      return dateStr === s.startDate;
    }

    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

    // 일수가 3일 이상 길어지는 일정은 첫날(시작일)과 마지막 날(종료일)만 나오도록 처리
    if (diffDays >= 2) {
      return dateStr === s.startDate || dateStr === s.endDate;
    }

    // 2일 일정은 시작일과 종료일 모두 포함
    return dateStr >= s.startDate && dateStr <= s.endDate;
  });
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
