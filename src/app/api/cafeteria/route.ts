import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CAFETERIA } from '@/lib/dongseo-crawler';
import { RestaurantType } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const restaurant = searchParams.get('restaurant') as RestaurantType | null;
  const date = searchParams.get('date');

  let list = [...MOCK_CAFETERIA];

  if (restaurant) {
    list = list.filter(m => m.restaurant === restaurant);
  }

  if (date) {
    list = list.filter(m => m.date === date);
  }

  return NextResponse.json({
    success: true,
    data: list,
    date: date || '2026-09-27'
  });
}
