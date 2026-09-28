export type NoticeCategory = '전체' | '일반' | '학사' | '장학' | '취업' | '행사';

export interface NoticeAttachment {
  name: string;
  url: string;
  size?: string;
}

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  author: string;
  date: string;
  views: number;
  contentHtml?: string;
  contentText?: string;
  attachments?: NoticeAttachment[];
  url: string;
  isPinned?: boolean;
}

export type RestaurantType = '학생식당' | '교직원식당' | '기숙사식당';
export type MealType = '조식' | '중식' | '석식';

export interface CafeteriaMenu {
  id: string;
  date: string; // YYYY-MM-DD
  restaurant: RestaurantType;
  mealType: MealType;
  cornerName: string; // e.g. '일품코너', '백반', '스페셜'
  menuItems: string[];
  price?: string;
  calories?: string;
  rating: number; // 평균 평점 (1.0 ~ 5.0)
  reviewCount: number;
}

export interface MealReview {
  id: string;
  menuId: string;
  restaurant: RestaurantType;
  date: string;
  studentEmailMasked: string; // e.g. 'ds***@dongseo.ac.kr'
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AcademicSchedule {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category: '수강/성적' | '등록/장학' | '시험' | '휴학/복학' | '행사';
  isImportant?: boolean;
  dDay?: number;
}
