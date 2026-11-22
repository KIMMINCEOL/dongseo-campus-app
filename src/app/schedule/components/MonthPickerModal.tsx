'use client';

import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MIN_SUPPORTED_YEAR, MAX_SUPPORTED_YEAR } from '../types';

interface MonthPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickerYear: number;
  setPickerYear: (updater: number | ((prev: number) => number)) => void;
  currentYear: number;
  currentMonth: number;
  onSelectMonth: (monthIdx: number) => void;
  onScrollToToday: () => void;
}

export default function MonthPickerModal({
  isOpen,
  onClose,
  pickerYear,
  setPickerYear,
  currentYear,
  currentMonth,
  onSelectMonth,
  onScrollToToday,
}: MonthPickerModalProps) {
  if (!isOpen) return null;

  const todayYear = new Date().getFullYear();
  const todayMonth = new Date().getMonth() + 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-[360px] rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-sm font-extrabold text-slate-900">날짜 이동</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 년도 선택 (< > 이동 버튼 및 뱃지) */}
        <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setPickerYear((prev) => Math.max(MIN_SUPPORTED_YEAR, prev - 1))}
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
            onClick={() => setPickerYear((prev) => Math.min(MAX_SUPPORTED_YEAR, prev + 1))}
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
                onClick={() => onSelectMonth(mIdx)}
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
              onScrollToToday();
              onClose();
            }}
            className="w-full py-2.5 bg-dongseo-50 hover:bg-dongseo-100 text-dongseo-700 font-extrabold text-xs rounded-xl transition"
          >
            오늘 날짜({todayYear}년 {todayMonth}월)로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
