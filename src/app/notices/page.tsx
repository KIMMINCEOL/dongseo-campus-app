'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NoticeCard from '@/components/NoticeCard';
import { Notice, NoticeCategory } from '@/types';
import { Search, X, Loader2, Megaphone } from 'lucide-react';

const CATEGORIES: NoticeCategory[] = ['전체', '학사', '일반', '장학', '취업', '행사'];

export default function NoticesPage() {
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices(selectedCategory, searchQuery);
  }, [selectedCategory]);

  const fetchNotices = async (category: NoticeCategory, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== '전체') params.set('category', category);
      if (q.trim()) params.set('q', q.trim());

      const res = await fetch(`/api/notices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices(selectedCategory, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchNotices(selectedCategory, '');
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Header title="공지사항" />

      {/* 검색 바 */}
      <div className="bg-white border-b border-slate-100 px-4 pt-3 pb-2 sticky top-[53px] z-30">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="공지 제목, 부서, 키워드 검색"
            className="w-full bg-slate-100 text-slate-900 text-sm pl-10 pr-9 py-2.5 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-dongseo-700 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* 카테고리 탭 스크롤 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 mt-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-dongseo-700 text-white shadow-sm shadow-dongseo-700/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 공지 목록 */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
          <span>
            총 <strong className="text-dongseo-700">{notices.length}</strong>건의 공지
          </span>
          {searchQuery && <span>&apos;{searchQuery}&apos; 검색 결과</span>}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-dongseo-700 mb-2" />
            <span className="text-xs">동서대 공지사항을 불러오는 중...</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 p-6">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">해당하는 공지사항이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">다른 검색어나 카테고리를 선택해보세요.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
