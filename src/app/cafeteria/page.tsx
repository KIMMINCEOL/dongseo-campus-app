'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MealCard from '@/components/MealCard';
import ReviewModal from '@/components/ReviewModal';
import { CafeteriaMenu, RestaurantType, MealReview } from '@/types';
import {
  UtensilsCrossed,
  Calendar,
  MessageSquare,
  Star,
  PlusCircle,
  Loader2,
  Building,
} from 'lucide-react';

const RESTAURANTS: RestaurantType[] = ['학생식당', '교직원식당', '기숙사식당'];

export default function CafeteriaPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantType>('학생식당');
  const [menus, setMenus] = useState<CafeteriaMenu[]>([]);
  const [reviews, setReviews] = useState<MealReview[]>([]);
  const [loading, setLoading] = useState(true);

  // 리뷰 작성 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [targetMenu, setTargetMenu] = useState<CafeteriaMenu | null>(null);

  const fetchMenusAndReviews = async (restaurant: RestaurantType) => {
    setLoading(true);
    try {
      const [menuRes, reviewRes] = await Promise.all([
        fetch(`/api/cafeteria?restaurant=${encodeURIComponent(restaurant)}`),
        fetch(`/api/cafeteria/reviews?restaurant=${encodeURIComponent(restaurant)}`),
      ]);

      const menuData = await menuRes.json();
      const reviewData = await reviewRes.json();

      if (menuData.success) {
        setMenus(menuData.data);
      }
      if (reviewData.success) {
        setReviews(reviewData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenusAndReviews(selectedRestaurant);
  }, [selectedRestaurant]);

  const handleOpenReviewModal = (menu?: CafeteriaMenu) => {
    setTargetMenu(menu || null);
    setModalOpen(true);
  };

  // 평균 평점 계산
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col pb-6">
      <Header title="학식 메뉴" />

      {/* 식당 선택 탭 */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 sticky top-[53px] z-30">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {RESTAURANTS.map((rest) => {
            const isSelected = selectedRestaurant === rest;
            return (
              <button
                key={rest}
                onClick={() => setSelectedRestaurant(rest)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white text-dongseo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rest}
              </button>
            );
          })}
        </div>

        {/* 날짜 표시 */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-dongseo-700" />
            2026. 09. 27 (오늘의 식단)
          </span>
          <button
            onClick={() => handleOpenReviewModal()}
            className="flex items-center gap-1 text-dongseo-700 hover:text-dongseo-800 font-bold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            한줄평 남기기
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-dongseo-700 mb-2" />
            <span className="text-xs">식단 정보를 불러오는 중...</span>
          </div>
        ) : (
          <>
            {/* 코너별 메뉴 카드 */}
            <div className="space-y-3">
              {menus.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl text-center border border-slate-100">
                  <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">등록된 식단이 없습니다.</p>
                </div>
              ) : (
                menus.map((menu) => (
                  <MealCard
                    key={menu.id}
                    menu={menu}
                    onOpenReview={(m) => handleOpenReviewModal(m)}
                  />
                ))
              )}
            </div>

            {/* 재학생 한줄평 & 리뷰 피드 */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-dongseo-700" />
                  <h3 className="text-sm font-bold text-slate-900">학우들의 실시간 한줄평</h3>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-amber-800">{avgRating}</span>
                  <span className="text-slate-400">({reviews.length})</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  첫 번째 한줄평의 주인공이 되어보세요!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">
                            {rev.studentEmailMasked}
                          </span>
                          <span className="text-[10px] text-dongseo-700 bg-dongseo-50 px-1.5 py-0.5 rounded border border-dongseo-200">
                            동서대 인증
                          </span>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* 별점/한줄평 작성 모달 */}
      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        restaurant={selectedRestaurant}
        menuId={targetMenu?.id}
        onSuccess={() => fetchMenusAndReviews(selectedRestaurant)}
      />
    </main>
  );
}
