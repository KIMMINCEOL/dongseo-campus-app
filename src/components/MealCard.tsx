'use client';

import React from 'react';
import { CafeteriaMenu } from '@/types';
import { Star, MessageSquarePlus, Flame, Coins } from 'lucide-react';

interface MealCardProps {
  menu: CafeteriaMenu;
  onOpenReview: (menu: CafeteriaMenu) => void;
}

export default function MealCard({ menu, onOpenReview }: MealCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-dongseo-50 text-dongseo-700 border border-dongseo-200">
            {menu.mealType}
          </span>
          <h4 className="text-sm font-extrabold text-slate-800">{menu.cornerName}</h4>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-slate-800">{menu.rating.toFixed(1)}</span>
          <span className="text-slate-400">({menu.reviewCount})</span>
        </div>
      </div>

      {/* 식단 메뉴 리스트 */}
      <ul className="space-y-1.5 mb-3">
        {menu.menuItems.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-dongseo-400 shrink-0" />
            <span className={idx === 0 ? 'font-bold text-slate-900' : ''}>{item}</span>
          </li>
        ))}
      </ul>

      {/* 부가 정보 & 평가 버튼 */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 text-xs">
        <div className="flex items-center gap-2.5 text-slate-500 font-medium">
          {menu.price && (
            <span className="flex items-center gap-1 text-dongseo-700 font-bold">
              <Coins className="w-3.5 h-3.5" />
              {menu.price}
            </span>
          )}
          {menu.calories && (
            <span className="flex items-center gap-1 text-slate-400">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              {menu.calories}
            </span>
          )}
        </div>

        <button
          onClick={() => onOpenReview(menu)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-dongseo-50 text-slate-700 hover:text-dongseo-700 border border-slate-200 hover:border-dongseo-200 font-semibold transition text-xs"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          평가하기
        </button>
      </div>
    </div>
  );
}
