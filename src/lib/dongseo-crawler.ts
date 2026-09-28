import * as cheerio from 'cheerio';
import { Notice, NoticeCategory, CafeteriaMenu, AcademicSchedule, RestaurantType } from '@/types';

// 동서대학교 공식 도메인 및 게시판 pCode 매핑
const DSU_BASE_URL = 'https://www.dongseo.ac.kr';
const PCODE_MAP: Record<NoticeCategory, string> = {
  '전체': 'MN2000192',
  '일반': 'MN2000192', // 동서공지
  '학사': 'MN2000193', // 학사공지
  '장학': 'MN2000194', // 장학공지
  '취업': 'MN2000195', // 취업/창업
  '행사': 'MN2000196', // 행사공지
};

// 현실적인 동서대 기본 목업 데이터 (오프라인 / 스크래핑 실패 시 즉각 폴백)
export const MOCK_NOTICES: Notice[] = [
  {
    id: 'dsu-101',
    title: '[학사] 2026학년도 2학기 수강신청 변경 및 정정 기간 안내',
    category: '학사',
    author: '교무처 학사지원팀',
    date: '2026-09-25',
    views: 1842,
    isPinned: true,
    url: 'https://www.dongseo.ac.kr/kr/index.php?pCode=MN2000193&mode=view&idx=101',
    contentText: `2026학년도 2학기 수강신청 변경 및 최종 정정 기간을 다음과 같이 안내하오니 학생 여러분께서는 기간 내에 필히 확인하시기 바랍니다.\n\n1. 정정 기간: 2026. 09. 28(월) 10:00 ~ 10. 02(금) 17:00까지\n2. 대상: 재학생 및 복학생 전원\n3. 신청 방법: 동서대학교 종합정보시스템(포털) 로그인 > 학생정보 > 수강정정\n4. 유의사항:\n - 최소 이수학점(12학점 이상) 미달 시 장학금 수혜 대상에서 제외될 수 있습니다.\n - 폐강 강좌 수강생은 반드시 타 강좌로 대체 신청바랍니다.`,
    attachments: [
      { name: '2026-2학기 수강신청 정정 매뉴얼.pdf', url: 'https://www.dongseo.ac.kr/files/manual_2026_2.pdf', size: '1.4MB' },
      { name: '개설강좌 변경사항 목록.xlsx', url: 'https://www.dongseo.ac.kr/files/courses_change.xlsx', size: '240KB' }
    ]
  },
  {
    id: 'dsu-102',
    title: '[장학] 2026년 2학기 동서희망장학금 및 성적우수장학금 지급 일정 안내',
    category: '장학',
    author: '학생취업지원처',
    date: '2026-09-24',
    views: 2410,
    isPinned: true,
    url: 'https://www.dongseo.ac.kr/kr/index.php?pCode=MN2000194&mode=view&idx=102',
    contentText: `2026학년도 2학기 동서희망장학금 및 교내 성적우수장학금 지급 관련 일정을 안내해 드립니다.\n\n1. 지급 대상: 장학생 선발 심사를 통과한 본교 정규학기 등록 재학생\n2. 지급 방법: 학생 종합정보시스템에 등록된 본인 명의 계좌 입금 또는 학자금 대출 상환\n3. 지급 예정일: 2026. 10. 15(목) 오후 순차 지급 예정\n4. 문의처: 학생취업지원처 장학지원팀 (051-320-2043~4)`,
    attachments: [
      { name: '2026-2 장학금 지급 규정 및 선발 기준안.hwp', url: 'https://www.dongseo.ac.kr/files/scholarship_rule.hwp', size: '820KB' }
    ]
  },
  {
    id: 'dsu-103',
    title: '[일반] 2026 DSU 가을 대동제 축제 및 동아리 버스킹 공연 일정 안내',
    category: '일반',
    author: '총학생회',
    date: '2026-09-23',
    views: 3120,
    isPinned: false,
    url: 'https://www.dongseo.ac.kr/kr/index.php?pCode=MN2000192&mode=view&idx=103',
    contentText: `학우 여러분 안녕하십니까! 2026년 동서대학교 가을 대동제가 본교 스튜던트 플라자 및 민석스포츠센터 야외 광장에서 개최됩니다.\n\n일시: 2026. 10. 08(목) ~ 10. 09(금) 양일간\n주요 프로그램:\n - 초대가수 축하공연 (라인업 추후 인스타그램 및 공지 발표)\n - 단과대별 야시장 및 푸드트럭 운영\n - 동아리 버스킹 및 DSU e스포츠 결승전\n\n안전하고 즐거운 축제가 될 수 있도록 많은 관심과 참여 부탁드립니다.`,
    attachments: [
      { name: '대동제 부스배치도 및 안전수칙.png', url: 'https://www.dongseo.ac.kr/files/festival_map.png', size: '3.1MB' }
    ]
  },
  {
    id: 'dsu-104',
    title: '[취업] 2026 하반기 주요 IT/소프트웨어 및 대기업 채용박람회 참가 안내',
    category: '취업',
    author: '대학일자리플러스센터',
    date: '2026-09-21',
    views: 940,
    isPinned: false,
    url: 'https://www.dongseo.ac.kr/kr/index.php?pCode=MN2000195&mode=view&idx=104',
    contentText: `대학일자리플러스센터에서 동서대 학생들을 위한 하반기 공채 대비 취업박람회 및 1:1 현직자 멘토링 세션을 운영합니다.\n\n- 일시: 2026. 10. 14(수) 13:00 ~ 18:00\n- 장소: 뉴밀레니엄관 2층 글로벌룸\n- 사전 등록 혜택: 이력서 무료 사진 촬영권 및 현직자 모의면접 참가 기회 제공`,
    attachments: [
      { name: '참가기업 명단 및 사전신청서.hwp', url: 'https://www.dongseo.ac.kr/files/job_fair_list.hwp', size: '512KB' }
    ]
  },
  {
    id: 'dsu-105',
    title: '[행사] 제14회 동서 미디어 콘텐츠 공모전 출품작 접수 (상금 총 1,000만원)',
    category: '행사',
    author: '미디어커뮤니케이션학부',
    date: '2026-09-20',
    views: 1250,
    isPinned: false,
    url: 'https://www.dongseo.ac.kr/kr/index.php?pCode=MN2000196&mode=view&idx=105',
    contentText: `동서대학교 미디어 혁신 인재 양성을 위한 2026 전국 대학생 미디어 콘텐츠 공모전을 개최합니다. 본교 재학생 여러분의 번뜩이는 아이디어와 작품을 기다립니다.`,
    attachments: []
  }
];

// 학식 목업 데이터 (학생식당, 교직원식당, 기숙사식당)
export const MOCK_CAFETERIA: CafeteriaMenu[] = [
  {
    id: 'caf-1',
    date: '2026-09-27',
    restaurant: '학생식당',
    mealType: '중식',
    cornerName: '일품코너',
    menuItems: ['수제 돈까스 & 브라운소스', '미니 우동', '양배추 샐러드', '단무지 & 깍두기', '요구르트'],
    price: '5,500원',
    calories: '890 kcal',
    rating: 4.6,
    reviewCount: 28,
  },
  {
    id: 'caf-2',
    date: '2026-09-27',
    restaurant: '학생식당',
    mealType: '중식',
    cornerName: '찌개 & 백반코너',
    menuItems: ['돼지고기 김치찌개', '계란말이 & 케첩', '어묵볶음', '잡곡밥 / 쌀밥', '총각김치'],
    price: '5,000원',
    calories: '750 kcal',
    rating: 4.3,
    reviewCount: 19,
  },
  {
    id: 'caf-3',
    date: '2026-09-27',
    restaurant: '학생식당',
    mealType: '석식',
    cornerName: '석식 정식',
    menuItems: ['매콤 제육덮밥', '유부 된장국', '감자채 볶음', '배추김치', '과일 젤리'],
    price: '5,000원',
    calories: '780 kcal',
    rating: 4.4,
    reviewCount: 14,
  },
  {
    id: 'caf-4',
    date: '2026-09-27',
    restaurant: '교직원식당',
    mealType: '중식',
    cornerName: '교직원 웰빙 뷔페',
    menuItems: ['소고기 버섯전골', '고등어 무조림', '단호박 샐러드', '시금치 나물', '현미밥 / 백미밥', '포기김치', '수정과'],
    price: '7,000원',
    calories: '820 kcal',
    rating: 4.7,
    reviewCount: 12,
  },
  {
    id: 'caf-5',
    date: '2026-09-27',
    restaurant: '기숙사식당',
    mealType: '조식',
    cornerName: '기숙사 조식',
    menuItems: ['토스트 & 딸기잼', '스크램블 에그', '소시지 구이', '양송이 스프', '시리얼 & 우유 / 주스'],
    price: '4,500원',
    calories: '620 kcal',
    rating: 4.1,
    reviewCount: 9,
  },
  {
    id: 'caf-6',
    date: '2026-09-27',
    restaurant: '기숙사식당',
    mealType: '석식',
    cornerName: '기숙사 석식',
    menuItems: ['치킨마요 덮밥', '맑은 콩나물국', '떡볶이', '깍두기', '바나나'],
    price: '5,000원',
    calories: '810 kcal',
    rating: 4.5,
    reviewCount: 22,
  }
];

// 학사일정 목업 데이터
export const MOCK_SCHEDULE: AcademicSchedule[] = [
  {
    id: 'sch-1',
    title: '2학기 수강신청 정정 기간',
    startDate: '2026-09-28',
    endDate: '2026-10-02',
    category: '수강/성적',
    isImportant: true,
    dDay: 1,
  },
  {
    id: 'sch-2',
    title: '2026 DSU 가을 대동제 축제',
    startDate: '2026-10-08',
    endDate: '2026-10-09',
    category: '행사',
    isImportant: true,
    dDay: 11,
  },
  {
    id: 'sch-3',
    title: '2학기 중간고사 시험 기간',
    startDate: '2026-10-19',
    endDate: '2026-10-23',
    category: '시험',
    isImportant: true,
    dDay: 22,
  },
  {
    id: 'sch-4',
    title: '2학기 수업일수 1/2 기준선',
    startDate: '2026-10-26',
    endDate: '2026-10-26',
    category: '수강/성적',
    isImportant: false,
    dDay: 29,
  },
  {
    id: 'sch-5',
    title: '동계 계절학기 수강신청',
    startDate: '2026-11-16',
    endDate: '2026-11-20',
    category: '수강/성적',
    isImportant: false,
    dDay: 50,
  },
  {
    id: 'sch-6',
    title: '2학기 기말고사 시험 기간',
    startDate: '2026-12-14',
    endDate: '2026-12-18',
    category: '시험',
    isImportant: true,
    dDay: 78,
  }
];

// 공지사항 스크래핑 함수 (동서대 홈페이지)
export async function scrapeDongseoNotices(category: NoticeCategory = '전체'): Promise<Notice[]> {
  try {
    const pCode = PCODE_MAP[category] || 'MN2000192';
    const targetUrl = `${DSU_BASE_URL}/kr/index.php?pCode=${pCode}`;

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 }, // 5분 캐시
    });

    if (!res.ok) {
      console.warn(`[DSU Crawler] Failed to fetch live notices, HTTP status: ${res.status}`);
      return filterMockNotices(category);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const notices: Notice[] = [];

    // 동서대학교 일반 공지사항 게시판 tr 파싱
    $('table.bbs_list tbody tr, table.board_list tbody tr').each((i, el) => {
      const $row = $(el);
      const isPinned = $row.hasClass('notice') || $row.find('.icon_notice, .notice_icon').length > 0;
      const titleLink = $row.find('td.title a, td.subject a, td.tit a');
      const title = titleLink.text().trim();
      const href = titleLink.attr('href') || '';
      
      const author = $row.find('td.name, td.writer, td.author').text().trim() || '동서대학교';
      const date = $row.find('td.date, td.reg_date').text().trim() || new Date().toISOString().slice(0, 10);
      const viewsStr = $row.find('td.hit, td.view').text().trim();
      const views = parseInt(viewsStr, 10) || 0;

      // idx 파싱
      const urlParams = new URLSearchParams(href.replace(/^.*\?/, ''));
      const idx = urlParams.get('idx') || `crawled-${i}`;

      if (title) {
        notices.push({
          id: idx,
          title,
          category,
          author,
          date,
          views,
          isPinned,
          url: href.startsWith('http') ? href : `${DSU_BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`,
        });
      }
    });

    if (notices.length === 0) {
      console.warn('[DSU Crawler] No notices parsed from HTML selector, falling back to mock data');
      return filterMockNotices(category);
    }

    return notices;
  } catch (error) {
    console.error('[DSU Crawler Error]', error);
    return filterMockNotices(category);
  }
}

// 공지사항 상세 본문 인앱 파싱
export async function scrapeNoticeDetail(id: string): Promise<Notice | null> {
  // 목업에 존재하는지 우선 확인
  const mockFound = MOCK_NOTICES.find(n => n.id === id);
  if (mockFound) {
    return mockFound;
  }

  try {
    const detailUrl = `${DSU_BASE_URL}/kr/index.php?pCode=MN2000192&mode=view&idx=${id}`;
    const res = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return mockFound || null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('.view_tit, .view_title, .board_view h3').first().text().trim() || '동서대학교 공지사항';
    const author = $('.view_info .writer, .info .author').first().text().trim() || '동서대학교';
    const date = $('.view_info .date, .info .date').first().text().trim() || new Date().toISOString().slice(0, 10);
    const contentHtml = $('.view_con, .view_content, .board_view_cont').html() || '';
    const contentText = $('.view_con, .view_content, .board_view_cont').text().trim() || '';

    // 첨부파일 파싱
    const attachments: { name: string; url: string; size?: string }[] = [];
    $('.file_list li a, .view_file a').each((_, a) => {
      const $a = $(a);
      const name = $a.text().trim();
      const fileHref = $a.attr('href') || '';
      if (name && fileHref) {
        attachments.push({
          name,
          url: fileHref.startsWith('http') ? fileHref : `${DSU_BASE_URL}${fileHref.startsWith('/') ? '' : '/'}${fileHref}`,
        });
      }
    });

    return {
      id,
      title,
      category: '일반',
      author,
      date,
      views: 100,
      contentHtml,
      contentText,
      attachments,
      url: detailUrl,
    };
  } catch (error) {
    console.error('[Notice Detail Scrape Error]', error);
    return mockFound || null;
  }
}

function filterMockNotices(category: NoticeCategory): Notice[] {
  if (category === '전체') {
    return MOCK_NOTICES;
  }
  return MOCK_NOTICES.filter(n => n.category === category);
}
