import { NextRequest, NextResponse } from 'next/server';
import { scrapeNoticeDetail } from '@/lib/dongseo-crawler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const notice = await scrapeNoticeDetail(id);

    if (!notice) {
      return NextResponse.json({ success: false, error: '해당 공지사항을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: notice });
  } catch (error) {
    return NextResponse.json({ success: false, error: '공지사항 본문을 불러오지 못했습니다.' }, { status: 500 });
  }
}
