'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Repeat,
  Bell,
  FileText,
  Check,
} from 'lucide-react';
import { CustomSchedule, COLOR_OPTIONS, WEEKDAYS } from '../types';
import {
  formatKoreanDateDisplay,
  formatKoreanTimeDisplay,
  shiftDateByMonth,
  parseTimeToAmPm,
  composeTimeFromAmPm,
  formatDate,
} from '../utils';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSchedule: CustomSchedule | null;
  defaultDateStr: string;
  onSave: (data: {
    id?: string;
    title: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    isAllDay: boolean;
    color: string;
    memo: string;
  }) => void;
}

export default function AddScheduleModal({
  isOpen,
  onClose,
  editingSchedule,
  defaultDateStr,
  onSave,
}: AddScheduleModalProps) {
  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(defaultDateStr);
  const [endDate, setEndDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('14:00');
  const [repeat, setRepeat] = useState('반복 안함');
  const [alertTime, setAlertTime] = useState('30분 전');
  const [memo, setMemo] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[7]); // 동서대 버건디

  const [activePickerTarget, setActivePickerTarget] = useState<
    'start' | 'end' | 'startDate' | 'endDate' | 'repeat' | 'alert' | null
  >(null);

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (editingSchedule) {
      setTitle(editingSchedule.title);
      setStartDate(editingSchedule.startDate);
      setEndDate(editingSchedule.endDate);
      setStartTime(editingSchedule.startTime || '13:00');
      setEndTime(editingSchedule.endTime || '14:00');
      setIsAllDay(editingSchedule.isAllDay ?? false);
      setMemo(editingSchedule.memo || '');
      if (editingSchedule.color) setSelectedColor(editingSchedule.color);
    } else {
      setTitle('');
      setStartDate(defaultDateStr || formatDate(new Date()));
      setEndDate(defaultDateStr || formatDate(new Date()));
      setStartTime('13:00');
      setEndTime('14:00');
      setIsAllDay(false);
      setRepeat('반복 안함');
      setAlertTime('30분 전');
      setMemo('');
      setSelectedColor(COLOR_OPTIONS[7]);
    }
    setActivePickerTarget(null);
  }, [editingSchedule, defaultDateStr, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: editingSchedule?.id,
      title: title.trim(),
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      isAllDay,
      color: selectedColor,
      memo: memo.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-sm font-extrabold text-slate-900">
            {editingSchedule ? '일정 수정' : '일정 추가'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
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

          {/* 📱 아이폰 라운드 카드 및 상하 스크롤 휠 피커 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-3">
            {/* 시작 날짜 & 시간 버튼 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-extrabold text-sm">시작</span>
              <div className="flex items-center gap-1.5">
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

            {/* 📅 시작 날짜용 아이폰 인라인 달력 */}
            {activePickerTarget === 'startDate' && (
              <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm animate-in fade-in space-y-2">
                {(() => {
                  const [y, m] = startDate.split('-').map(Number);
                  const currentMonthDate = new Date(y, m - 1, 1);
                  const firstDay = currentMonthDate.getDay();
                  const lastDate = new Date(y, m, 0).getDate();

                  return (
                    <div>
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

            {/* 🎡 시작 시간 상하 휠 피커 */}
            {!isAllDay && activePickerTarget === 'start' && (
              <div className="py-2 px-1 bg-white border border-slate-100 rounded-2xl shadow-xs animate-in fade-in">
                {(() => {
                  const cur = parseTimeToAmPm(startTime);
                  return (
                    <div className="grid grid-cols-3 gap-2 text-center items-center">
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

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1">분</span>
                        <div className="h-24 overflow-y-auto w-full no-scrollbar snap-y snap-mandatory bg-slate-50 rounded-xl p-1 border border-slate-100">
                          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(
                            (m) => (
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
                            )
                          )}
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

            {/* 📅 종료 날짜용 아이폰 인라인 달력 */}
            {activePickerTarget === 'endDate' && (
              <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm animate-in fade-in space-y-2">
                {(() => {
                  const [y, m] = endDate.split('-').map(Number);
                  const currentMonthDate = new Date(y, m - 1, 1);
                  const firstDay = currentMonthDate.getDay();
                  const lastDate = new Date(y, m, 0).getDate();

                  return (
                    <div>
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

            {/* 🎡 종료 시간 상하 휠 피커 */}
            {!isAllDay && activePickerTarget === 'end' && (
              <div className="py-2 px-1 bg-white border border-slate-100 rounded-2xl shadow-xs animate-in fade-in">
                {(() => {
                  const cur = parseTimeToAmPm(endTime);
                  return (
                    <div className="grid grid-cols-3 gap-2 text-center items-center">
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

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1">분</span>
                        <div className="h-24 overflow-y-auto w-full no-scrollbar snap-y snap-mandatory bg-slate-50 rounded-xl p-1 border border-slate-100">
                          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(
                            (m) => (
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
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 반복 & 알림 설정 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-3">
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
              className="w-full py-3 bg-dongseo-700 hover:bg-dongseo-800 text-white font-extrabold text-sm rounded-2xl transition shadow-md active:scale-98"
            >
              완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
