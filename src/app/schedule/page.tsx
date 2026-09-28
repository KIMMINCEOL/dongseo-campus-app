'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { AcademicSchedule } from '@/types';
import { Calendar, CalendarCheck, Clock, Flame, Loader2 } from 'lucide-react';

const CATEGORIES = ['전체', '수강/성적', '시험', '행사'];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<AcademicSchedule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();
        if (data.success) {
          setSchedules(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const filtered =
    selectedCategory === '전체'
      ? schedules
      : schedules.filter((s) => s.category === selectedCategory);

  const importantItems = schedules.filter((s) => s.isImportant);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-6">
      <Header title="학사일정" />

      <div className="p-4 space-y-5 flex-1">
        {/* 중요 학사일정 D-Day 슬라이더/그리드 */}
        <section>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Flame className="w-4 h-4 text-dongseo-700" />
            <h2 className="text-sm font-bold text-slate-900">놓치면 안 될 핵심 일정 (D-Day)</h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {importantItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">{item.category}</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-dongseo-700 text-white shadow-sm">
                    D-{item.dDay}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-2">
                  {item.startDate} {item.startDate !== item.endDate && `~ ${item.endDate.slice(5)}`}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 카테고리 필터 */}
        <section>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-dongseo-700 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 전체 일정 타임라인 */}
        <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-dongseo-700" />
              <h3 className="text-sm font-bold text-slate-900">2026학년도 2학기 일정표</h3>
            </div>
            <span className="text-xs text-slate-400">총 {filtered.length}건</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-dongseo-700 mb-2" />
              <span className="text-xs">일정을 불러오는 중...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-dongseo-700 bg-dongseo-50 px-2 py-0.5 rounded border border-dongseo-200">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {item.startDate} {item.startDate !== item.endDate && `~ ${item.endDate}`}
                      </span>
                    </div>
                  </div>

                  {item.dDay !== undefined && (
                    <span
                      className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${
                        item.dDay <= 7
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      D-{item.dDay}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
