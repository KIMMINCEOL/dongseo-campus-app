'use client';

import React from 'react';
import { X, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { CustomSchedule } from '../types';
import { getScheduleColor } from '../utils';

interface ScheduleDetailModalProps {
  schedule: CustomSchedule | null;
  onClose: () => void;
  onOpenEdit: (schedule: CustomSchedule) => void;
  onDelete: (id: string) => void;
}

export default function ScheduleDetailModal({
  schedule,
  onClose,
  onOpenEdit,
  onDelete,
}: ScheduleDetailModalProps) {
  if (!schedule) return null;

  const isPersonal = schedule.id.startsWith('personal-');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-[360px] rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
        {/* 상단 컬러 포인트 및 닫기 버튼 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: getScheduleColor(schedule),
              }}
            />
            <span className="text-xs font-bold text-slate-500">
              {isPersonal
                ? '개인일정'
                : `동서대 공식 일정 · ${schedule.category || '학사'}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 일정 제목 */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 leading-snug">
            {schedule.title}
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
                {schedule.startDate}
                {schedule.startDate !== schedule.endDate &&
                  ` ~ ${schedule.endDate}`}
              </div>
              <div className="text-[11px] text-dongseo-700 font-semibold">
                {schedule.isAllDay || (!schedule.startTime && !schedule.endTime)
                  ? '하루 종일'
                  : `${schedule.startTime || '00:00'} ~ ${schedule.endTime || '00:00'}`}
              </div>
            </div>
          </div>

          {schedule.dDay !== undefined && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                남은 기간
              </span>
              <span className="font-extrabold text-dongseo-700 bg-dongseo-50 px-2 py-0.5 rounded-full text-[11px]">
                {schedule.dDay === 0
                  ? 'D-Day (오늘)'
                  : schedule.dDay > 0
                  ? `D-${schedule.dDay}`
                  : '종료된 일정'}
              </span>
            </div>
          )}
        </div>

        {/* 메모가 있는 경우 표시 */}
        {schedule.memo && (
          <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs">
            <span className="text-[11px] font-bold text-amber-800 block mb-1">메모</span>
            <p className="text-slate-700 whitespace-pre-wrap">{schedule.memo}</p>
          </div>
        )}

        {/* 버튼 그룹: 개인 일정에만 수정/삭제 버튼 제공, 학교 공식 일정은 확인(닫기) 버튼만 제공 */}
        <div className="flex items-center gap-2 pt-1">
          {isPersonal ? (
            <>
              <button
                type="button"
                onClick={() => onOpenEdit(schedule)}
                className="flex-1 py-2.5 bg-dongseo-50 hover:bg-dongseo-100 text-dongseo-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                수정
              </button>

              <button
                type="button"
                onClick={() => onDelete(schedule.id)}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition active:scale-95"
              >
                닫기
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-dongseo-700 hover:bg-dongseo-800 text-white font-extrabold text-xs rounded-xl transition shadow-xs active:scale-98"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
