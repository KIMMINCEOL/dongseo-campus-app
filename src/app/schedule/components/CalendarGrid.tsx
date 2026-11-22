'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MonthData, CustomSchedule, WEEKDAYS } from '../types';
import { getScheduleColor, formatDate } from '../utils';

interface CalendarGridProps {
  monthData: MonthData;
  selectedDateStr: string;
  currentYear: number;
  currentMonth: number;
  minYear: number;
  maxYear: number;
  onSelectDate: (dateStr: string) => void;
  onSelectSchedule: (schedule: CustomSchedule) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenMonthPicker: () => void;
}

export default function CalendarGrid({
  monthData,
  selectedDateStr,
  currentYear,
  currentMonth,
  minYear,
  maxYear,
  onSelectDate,
  onSelectSchedule,
  onPrevMonth,
  onNextMonth,
  onOpenMonthPicker,
}: CalendarGridProps) {
  const rowsCount = monthData.cells.length / 7;
  const todayDateStr = formatDate(new Date());

  const canPrev = currentMonth > 0 || currentYear > minYear;
  const canNext = currentMonth < 11 || currentYear < maxYear;

  return (
    <div className="h-full flex flex-col box-border">
      {/* 월 타이틀: 클릭 시 년도/달 선택 팝업 열림 */}
      <div className="py-1 shrink-0 px-1 flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenMonthPicker}
          className="group flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition"
        >
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
            <span>{monthData.label}</span>
            <ChevronRight className="w-5 h-5 text-dongseo-700 group-hover:translate-x-0.5 transition-transform" />
          </h2>
        </button>

        {/* 이전 달 / 다음 달 이동 버튼 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={!canPrev}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-90 transition disabled:opacity-30"
            title="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={!canNext}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-90 transition disabled:opacity-30"
            title="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
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

      {/* 캘린더 그리드 셀 */}
      <div
        className="flex-1 grid grid-cols-7 pt-1"
        style={{
          gridTemplateRows: `repeat(${rowsCount}, minmax(0, 1fr))`,
        }}
      >
        {monthData.cells.map((cell, idx) => {
          const isSelected = cell.dateStr === selectedDateStr;
          const isToday = cell.dateStr === todayDateStr;
          const hasEvents = cell.schedules.length > 0;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
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
              {/* 날짜 숫자 */}
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

              {/* 일정 뱃지 (시작일, 중간 진행일, 종료일 모두 스마트 렌더링) */}
              <div className="w-full flex-1 flex flex-col gap-0.5 overflow-hidden">
                {hasEvents &&
                  cell.schedules.slice(0, 3).map((s, sIdx) => {
                    const badgeColor = getScheduleColor(s);
                    const isMultiDay = s.startDate !== s.endDate;
                    const isStartDay = cell.dateStr === s.startDate;
                    const isEndDay = cell.dateStr === s.endDate;
                    const isMiddleDay = isMultiDay && !isStartDay && !isEndDay;

                    return (
                      <div
                        key={sIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSchedule(s);
                        }}
                        className={`w-full mx-0.5 px-1 py-0.5 text-left flex items-center gap-1 leading-tight cursor-pointer hover:opacity-100 active:scale-95 transition-transform relative z-0 text-white ${
                          isMiddleDay
                            ? 'h-3.5 text-[9px] font-medium opacity-80 rounded'
                            : 'h-4 text-[10px] font-bold rounded-md opacity-95'
                        }`}
                        style={{
                          backgroundColor: badgeColor,
                        }}
                        title={isMiddleDay ? `${s.title} (진행 중)` : s.title}
                      >
                        <span
                          className={`rounded-full shrink-0 bg-white ${
                            isMiddleDay ? 'w-1 h-1 opacity-70' : 'w-1.5 h-1.5'
                          }`}
                        />
                        <span className="truncate leading-none">
                          {isMiddleDay ? s.title : isEndDay && isMultiDay ? `${s.title} (종료)` : s.title}
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
}
