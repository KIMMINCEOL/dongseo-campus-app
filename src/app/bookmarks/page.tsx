'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NoticeCard from '@/components/NoticeCard';
import { Notice } from '@/types';
import { Bookmark, Sparkles } from 'lucide-react';
import { getBookmarkedIds } from '@/lib/bookmarks';

export default function BookmarksPage() {
  const [bookmarkedNotices, setBookmarkedNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const ids = getBookmarkedIds();
      if (ids.length === 0) {
        setBookmarkedNotices([]);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/notices');
      const data = await res.json();
      if (data.success) {
        const filtered = (data.data as Notice[]).filter((n) => ids.includes(n.id));
        setBookmarkedNotices(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
    const handleUpdate = () => loadBookmarks();
    window.addEventListener('dsu_bookmarks_updated', handleUpdate);
    return () => window.removeEventListener('dsu_bookmarks_updated', handleUpdate);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-6">
      <Header showBack title="보관함 (스크랩)" />

      <div className="p-4 flex-1">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
          <span>
            스크랩한 공지 <strong className="text-dongseo-700">{bookmarkedNotices.length}</strong>개
          </span>
          <span className="text-[11px] text-slate-400">내 기기에 안전하게 보관됨</span>
        </div>

        {bookmarkedNotices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="w-12 h-12 rounded-full bg-dongseo-50 text-dongseo-700 flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">보관된 공지사항이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              공지사항 목록에서 북마크 아이콘을 누르면 이곳에 저장됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {bookmarkedNotices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
