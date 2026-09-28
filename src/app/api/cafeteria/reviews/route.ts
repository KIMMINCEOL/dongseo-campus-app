import { NextRequest, NextResponse } from 'next/server';
import { getMealReviews, addMealReview } from '@/lib/supabase';
import { RestaurantType } from '@/types';

function maskDongseoEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '익명***@dongseo.ac.kr';
  const username = parts[0];
  const domain = parts[1];
  if (username.length <= 2) {
    return `${username}*@${domain}`;
  }
  return `${username.slice(0, 3)}***@${domain}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get('menuId') || undefined;
  const restaurant = searchParams.get('restaurant') || undefined;

  try {
    const reviews = await getMealReviews(menuId, restaurant);
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    return NextResponse.json({ success: false, error: '리뷰를 불러올 수 없습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { menuId, restaurant, date, email, rating, comment } = body;

    // 동서대학교 웹메일 유효성 검증
    if (!email || !email.trim().toLowerCase().endsWith('@dongseo.ac.kr')) {
      return NextResponse.json(
        {
          success: false,
          error: '동서대학교 웹메일(@dongseo.ac.kr) 계정으로 인증된 학우만 한줄평을 작성할 수 있습니다.',
        },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: '1~5점 사이의 별점을 입력해 주세요.' }, { status: 400 });
    }

    if (!comment || comment.trim().length < 2) {
      return NextResponse.json({ success: false, error: '최소 2자 이상의 한줄평을 입력해 주세요.' }, { status: 400 });
    }

    const masked = maskDongseoEmail(email.trim());

    const created = await addMealReview({
      menuId: menuId || 'general',
      restaurant: (restaurant || '학생식당') as RestaurantType,
      date: date || new Date().toISOString().slice(0, 10),
      studentEmailMasked: masked,
      rating: Number(rating),
      comment: comment.trim(),
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return NextResponse.json({ success: false, error: '리뷰 등록 중 문제가 발생했습니다.' }, { status: 500 });
  }
}
