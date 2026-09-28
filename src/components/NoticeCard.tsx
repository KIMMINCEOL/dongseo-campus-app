'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Notice, NoticeCategory } from '@/types';
import { Bookmark, Eye, Paperclip, Pin } from 'lucide-react';
import { isNoticeBookmarked, toggleNoticeBookmark } from '@/lib/bookmarks';

const CATEGORY_STYLES: Record<NoticeCategory, { bg: string; text: string; border: string }> = {
  '전체': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  '학사': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '장학': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '일반': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '취업': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  '행사': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function NoticeCard({ notice }: { notice: Notice }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isNoticeBookmarked(notice.id));
    const handleUpdate = () => setBookmarked(isNoticeBookmarked(notice.id));
    window.addEventListener('dsu_bookmarks_updated', handleUpdate);
    return () => window.removeEventListener('dsu_bookmarks_updated', handleUpdate);
  }, [notice.id]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = toggleNoticeBookmark(notice.id);
    setBookmarked(nextState);
  };

  const style = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES['일반'];

  return (
    <Link
      href={`/notices/${notice.id}`}
      className="block bg-white p-4 rounded-xl border border-slate-100 hover:border-dongseo-200 shadow-sm hover:shadow transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {notice.isPinned && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-dongseo-50 text-dongseo-700 border border-dongseo-200">
              <Pin className="w-3 h-3 fill-dongseo-700 rotate-45" />
              필독
            </span>
          )}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            {notice.category}
          </span>
          <span className="text-xs text-slate-400">{notice.author}</span>
        </div>

        <button
          onClick={handleBookmarkClick}
          className={`p-1.5 rounded-lg transition-colors -mr-1 -mt-1 ${
            bookmarked
              ? 'text-dongseo-700 bg-dongseo-50'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
          aria-label={bookmarked ? '북마크 해제' : '북마크 추가'}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-dongseo-700' : ''}`} />
        </button>
      </div>

      <h3 className="font-semibold text-slate-900 mt-2 text-sm leading-snug line-clamp-2 hover:text-dongseo-700 transition-colors">
        {notice.title}
      </h3>

      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-50">
        <span className="text-slate-500 font-medium">{notice.date}</span>

        <div className="flex items-center gap-3">
          {notice.attachments && notice.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-slate-500">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{notice.attachments.length}</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-500">
            <Eye className="w-3.5 h-3.5" />
            <span>{notice.views.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
