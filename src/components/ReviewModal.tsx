'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { RestaurantType } from '@/types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantType;
  menuId?: string;
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  restaurant,
  menuId,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [emailUsername, setEmailUsername] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = emailUsername.trim().replace('@dongseo.ac.kr', '');
    if (!cleanUsername) {
      setErrorMsg('동서대 웹메일 아이디를 입력해주세요.');
      return;
    }

    const fullEmail = `${cleanUsername}@dongseo.ac.kr`;

    if (!comment.trim()) {
      setErrorMsg('한줄평 내용을 작성해주세요.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/cafeteria/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant,
          menuId: menuId || 'general',
          email: fullEmail,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '리뷰 저장에 실패했습니다.');
      }

      setSuccessMsg('평가가 정상적으로 등록되었습니다!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setComment('');
        setEmailUsername('');
        setSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <span className="text-xs font-semibold text-dongseo-700 bg-dongseo-50 px-2.5 py-0.5 rounded-full border border-dongseo-200">
            {restaurant}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-2">오늘의 식단 평가하기</h3>
          <p className="text-xs text-slate-500 mt-0.5">학우들을 위해 솔직한 별점과 한줄평을 남겨주세요</p>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 별점 선택 */}
          <div className="flex flex-col items-center justify-center gap-1.5 py-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700">
              {rating === 5 && '⭐️⭐️⭐️⭐️⭐️ 완전 맛있어요!'}
              {rating === 4 && '⭐️⭐️⭐️⭐️ 추천해요!'}
              {rating === 3 && '⭐️⭐️⭐️ 보통이에요'}
              {rating === 2 && '⭐️⭐️ 아쉬워요'}
              {rating === 1 && '⭐️ 개선이 필요해요'}
            </span>
          </div>

          {/* 동서대 웹메일 인증 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              동서대 웹메일 인증 (재학생 확인용)
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-dongseo-700 focus-within:border-transparent">
              <input
                type="text"
                value={emailUsername}
                onChange={(e) => setEmailUsername(e.target.value)}
                placeholder="학번 또는 메일아이디"
                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                required
              />
              <span className="bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 border-l border-slate-200 select-none">
                @dongseo.ac.kr
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              * 리뷰 공개 시 학번/아이디는 <span className="font-semibold text-slate-600">2021****@dongseo.ac.kr</span>처럼 자동 마스킹 보호됩니다.
            </p>
          </div>

          {/* 한줄평 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">한줄평</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="예) 돈까스 바삭하고 소스도 잘 어울렸어요! 가성비 최고"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-dongseo-700 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* 버튼 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-dongseo-700 hover:bg-dongseo-800 text-sm font-semibold text-white shadow transition disabled:opacity-50"
            >
              {loading ? '등록 중...' : '평가 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
