'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { Loader2, Plus, RotateCw } from 'lucide-react';
import {
  CustomSchedule,
  MonthData,
  CURRENT_BASE_YEAR,
  MIN_SUPPORTED_YEAR,
  MAX_SUPPORTED_YEAR,
} from './types';
import { formatDate, filterSchedulesForDate } from './utils';
import CalendarGrid from './components/CalendarGrid';
import MonthPickerModal from './components/MonthPickerModal';
import AddScheduleModal from './components/AddScheduleModal';
import ScheduleDetailModal from './components/ScheduleDetailModal';

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

  // 📝 개인 일정 추가/수정 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CustomSchedule | null>(null);

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

    // 🕒 5분(300,000ms)마다 백그라운드에서 캐시 체크
    const autoRefreshTimer = setInterval(() => {
      fetchSchedule(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(autoRefreshTimer);
  }, []);

  // 현재 선택된 월의 셀 데이터 계산
  const currentMonthData = useMemo(() => {
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

    // 다음 달 날짜 채우기 (총 셀 수가 7의 배수가 되도록)
    const totalCells = cells.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
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

  // 오늘 날짜로 즉시 이동
  const scrollToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(formatDate(today));
  };

  // 년/월 팝업 열기
  const handleOpenMonthPicker = () => {
    setPickerYear(currentYear);
    setIsMonthPickerOpen(true);
  };

  // 월 선택 팝업에서 특정 월 클릭 시
  const handleSelectMonth = (monthIdx: number) => {
    setCurrentYear(pickerYear);
    setCurrentMonth(monthIdx);
    setIsMonthPickerOpen(false);
  };

  // 개인 일정 추가 모달 열기
  const handleOpenAddModal = () => {
    setEditingSchedule(null);
    setIsAddModalOpen(true);
  };

  // 개인 일정 수정 모달 열기
  const handleOpenEditModal = (schedule: CustomSchedule) => {
    if (!schedule.id.startsWith('personal-')) return;
    setEditingSchedule(schedule);
    setSelectedScheduleDetail(null);
    setIsAddModalOpen(true);
  };

  // 개인 일정 저장
  const handleSaveSchedule = (data: {
    id?: string;
    title: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    color: string;
    memo: string;
  }) => {
    let updated: CustomSchedule[];

    if (data.id) {
      // 기존 일정 수정
      updated = schedules.map((s) =>
        s.id === data.id
          ? {
              ...s,
              title: data.title,
              startDate: data.startDate,
              endDate: data.endDate,
              startTime: data.startTime,
              endTime: data.endTime,
              isAllDay: data.isAllDay,
              color: data.color,
              memo: data.memo,
            }
          : s
      );
    } else {
      // 새 일정 추가
      const newSchedule: CustomSchedule = {
        id: `personal-${Date.now()}`,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: data.isAllDay,
        category: '개인일정',
        color: data.color,
        memo: data.memo,
      };
      updated = [...schedules, newSchedule];
    }

    setSchedules(updated);

    if (typeof window !== 'undefined') {
      const personalOnly = updated.filter((s) => s.id.startsWith('personal-'));
      localStorage.setItem('dsu_personal_schedules', JSON.stringify(personalOnly));
    }
  };

  // 개인 일정 삭제
  const handleDeleteSchedule = (id: string) => {
    if (!id.startsWith('personal-')) return;
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;

    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);

    if (typeof window !== 'undefined') {
      const personalOnly = updated.filter((s) => s.id.startsWith('personal-'));
      localStorage.setItem('dsu_personal_schedules', JSON.stringify(personalOnly));
    }

    setSelectedScheduleDetail(null);
  };

  return (
    <main className="h-screen bg-white flex flex-col overflow-hidden pb-16">
      <Header title="학사일정" />

      <div className="flex-1 flex flex-col max-w-[480px] mx-auto w-full overflow-hidden">
        {/* 상단 서브바: 오늘로 이동 & ➕ 일정 추가 버튼 */}
        <div className="bg-white/95 backdrop-blur-md z-20 border-b border-slate-100 px-4 py-1.5 shrink-0 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">학사 캘린더</span>

          <div className="flex items-center gap-1.5">
            {/* 🔄 수동 즉시 새로고침 버튼 (10초 UI 쿨다운) */}
            <button
              onClick={() => {
                if (isSyncing || buttonCooldown > 0) return;
                setButtonCooldown(10);
                fetchSchedule(false, true);
              }}
              disabled={isSyncing || buttonCooldown > 0}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-600 flex items-center justify-center transition disabled:opacity-50 text-[11px] font-bold"
              title={buttonCooldown > 0 ? `${buttonCooldown}초 후 새로고침 가능` : '동서대 학사일정 실시간 최신화'}
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
            <CalendarGrid
              monthData={currentMonthData}
              selectedDateStr={selectedDateStr}
              currentYear={currentYear}
              currentMonth={currentMonth}
              minYear={MIN_SUPPORTED_YEAR}
              maxYear={MAX_SUPPORTED_YEAR}
              onSelectDate={setSelectedDateStr}
              onSelectSchedule={setSelectedScheduleDetail}
              onPrevMonth={() => {
                if (currentMonth === 0) {
                  if (currentYear > MIN_SUPPORTED_YEAR) {
                    setCurrentYear(currentYear - 1);
                    setCurrentMonth(11);
                  }
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              onNextMonth={() => {
                if (currentMonth === 11) {
                  if (currentYear < MAX_SUPPORTED_YEAR) {
                    setCurrentYear(currentYear + 1);
                    setCurrentMonth(0);
                  }
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              onOpenMonthPicker={handleOpenMonthPicker}
            />
          </div>
        )}
      </div>

      {/* 📅 년도 및 월 선택 모달 */}
      <MonthPickerModal
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        pickerYear={pickerYear}
        setPickerYear={setPickerYear}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onSelectMonth={handleSelectMonth}
        onScrollToToday={scrollToToday}
      />

      {/* 📱 개인 일정 추가/수정 모달 */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        editingSchedule={editingSchedule}
        defaultDateStr={selectedDateStr}
        onSave={handleSaveSchedule}
      />

      {/* 🔍 일정 상세 보기 모달 */}
      <ScheduleDetailModal
        schedule={selectedScheduleDetail}
        onClose={() => setSelectedScheduleDetail(null)}
        onOpenEdit={handleOpenEditModal}
        onDelete={handleDeleteSchedule}
      />
    </main>
  );
}
