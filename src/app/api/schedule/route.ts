import { NextResponse } from 'next/server';
import { scrapeDongseoSchedule } from '@/lib/dongseo-crawler';

export async function GET() {
  const currentYear = new Date().getFullYear();
  const schedules = await scrapeDongseoSchedule(currentYear);

  return NextResponse.json({
    success: true,
    data: schedules,
  });
}

