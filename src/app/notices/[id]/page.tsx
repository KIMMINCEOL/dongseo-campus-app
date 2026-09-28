'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Notice } from '@/types';
import {
  Download,
  Share2,
  Bookmark,
  Calendar,
  User,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { isNoticeBookmarked, toggleNoticeBookmark } from '@/lib/bookmarks';

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setBookmarked(isNoticeBookmarked(id));

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/notices/${id}`);
        const data = await res.json();
        if (data.success) {
          setNotice(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleBookmark = () => {
    if (!notice) return;
    const nextState = toggleNoticeBookmark(notice.id);
    setBookmarked(nextState);
  };

  const handleShare = async () => {
    if (navigator.share && notice) {
      try {
        await navigator.share({
          title: notice.title,
          text: `[동서대 공지사항] ${notice.title}`,
          url: window.location.href,
        });
      } catch {
        // 취소 등 무시
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col">
        <Header showBack title="공지사항 상세" />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-dongseo-700 mb-2" />
          <span className="text-xs">공지사항 본문을 불러오는 중...</span>
        </div>
      </main>
    );
  }

  if (!notice) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col">
        <Header showBack title="공지사항 상세" />
        <div className="p-6 text-center py-20">
          <p className="text-sm font-bold text-slate-700">해당 공지사항을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-dongseo-700 text-white rounded-xl text-xs font-semibold"
          >
            목록으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header showBack title="공지사항 본문" />

      <article className="p-4 flex-1">
        {/* 공지 메타 정보 헤더 */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-dongseo-50 text-dongseo-700 border border-dongseo-200">
              {notice.category}
            </span>
            <span className="text-xs text-slate-500 font-medium">{notice.author}</span>
          </div>

          <h1 className="text-lg font-extrabold text-slate-900 leading-snug tracking-tight">
            {notice.title}
          </h1>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {notice.date}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                조회 {notice.views.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleBookmark}
                className={`p-1.5 rounded-lg border transition ${
                  bookmarked
                    ? 'border-dongseo-200 bg-dongseo-50 text-dongseo-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
                title="북마크"
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-dongseo-700' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition relative"
                title="공유하기"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 첨부파일 다운로드 섹션 */}
        {notice.attachments && notice.attachments.length > 0 && (
          <div className="my-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-dongseo-700" />
              <span>첨부파일 ({notice.attachments.length})</span>
            </div>

            <div className="space-y-1.5">
              {notice.attachments.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-dongseo-300 transition text-xs group"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="truncate font-medium text-slate-800 group-hover:text-dongseo-700">
                      {file.name}
                    </span>
                    {file.size && (
                      <span className="text-[11px] text-slate-400 shrink-0">({file.size})</span>
                    )}
                  </div>
                  <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-dongseo-50 text-slate-600 group-hover:text-dongseo-700 shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 인앱 본문 네이티브 렌더링 */}
        <div className="py-4">
          {notice.contentHtml ? (
            <div
              className="prose prose-sm max-w-none text-slate-800 leading-relaxed [&_img]:rounded-xl [&_img]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:bg-slate-100 [&_th]:p-2 [&_td]:p-2 [&_td]:border [&_td]:border-slate-200"
              dangerouslySetInnerHTML={{ __html: notice.contentHtml }}
            />
          ) : (
            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {notice.contentText}
            </div>
          )}
        </div>

        {/* 원문 바로가기 버튼 */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
          <a
            href={notice.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-dongseo-700 bg-slate-50 hover:bg-dongseo-50 border border-slate-200 hover:border-dongseo-200 px-4 py-2 rounded-xl transition"
          >
            <span>동서대학교 공식 홈페이지 원문 보기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </article>
    </main>
  );
}
