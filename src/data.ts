/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LandParcel, LeaseApplication } from './types';

export const LAND_PARCELS: LandParcel[] = [
  {
    id: 'KR-001',
    address: '대전광역시 동구 정동 1-1 (대전역 인근)',
    area: 150,
    landType: '잡종지',
    officialPrice: 500000,
    recommendedUse: '소상공인 창업·푸드트럭·팝업스토어',
    restrictions: '철도보호지구 행위신고 필요·역 광장 유동인구 최상',
    status: '대부가능',
    region: '대전광역시',
    imageUrl: 'https://images.unsplash.com/photo-1541414779247-4436ea0e17d8?auto=format&fit=crop&w=600&q=80',
    latitude: 36.3325,
    longitude: 127.4342,
    zoning: '일반상업지역',
    isRailwayProtected: true,
    hasRoadAccess: true,
    waterDistance: 5,
    electricityAccess: '가용'
  },
  {
    id: 'KR-002',
    address: '대전광역시 서구 대전로 200 (선로 인접지)',
    area: 250,
    landType: '전(밭)',
    officialPrice: 80000,
    recommendedUse: '도시농업·주말농장·실버텃밭',
    restrictions: '진입로 확보 필요·인근 주민 소음 민원 완화 구역',
    status: '대부가능',
    region: '대전광역시',
    imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80',
    latitude: 36.3156,
    longitude: 127.3821,
    zoning: '자연녹지지역',
    isRailwayProtected: true,
    hasRoadAccess: false,
    waterDistance: 12,
    electricityAccess: '가설필요'
  },
  {
    id: 'KR-003',
    address: '세종특별자치시 조치원읍 교리 10-5 (역사 인근)',
    area: 80,
    landType: '대지',
    officialPrice: 300000,
    recommendedUse: '청년창업 카페·야외 플리마켓·로컬 공방',
    restrictions: '역사 리모델링 구간 인접으로 유동인구 증가 추세',
    status: '대부가능',
    region: '세종특별자치시',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    latitude: 36.5978,
    longitude: 127.2994,
    zoning: '준주거지역',
    isRailwayProtected: false,
    hasRoadAccess: true,
    waterDistance: 3,
    electricityAccess: '가용'
  },
  {
    id: 'KR-004',
    address: '대전광역시 대덕구 신탄진동 50 (선로 변)',
    area: 400,
    landType: '잡종지',
    officialPrice: 120000,
    recommendedUse: '물류창고·야적장·야외 주차장',
    restrictions: '대형 차량 진입 가능·철도 보안 구역 펜스 인접',
    status: '계약중',
    region: '대전광역시',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    latitude: 36.4282,
    longitude: 127.4215,
    zoning: '준공업지역',
    isRailwayProtected: true,
    hasRoadAccess: true,
    waterDistance: 45,
    electricityAccess: '가설필요'
  },
  {
    id: 'KR-005',
    address: '서울특별시 용산구 한강로3가 40 (선로 교량하부)',
    area: 300,
    landType: '잡종지',
    officialPrice: 1200000,
    recommendedUse: '무인 보관함·도심 주차장·플리마켓',
    restrictions: '교량 하부 공간으로 높이 제약(4.5m) 있음·철도 보호 행위허가 필',
    status: '대부가능',
    region: '서울특별시',
    imageUrl: 'https://images.unsplash.com/photo-1513828741544-cf6662767098?auto=format&fit=crop&w=600&q=80',
    latitude: 37.5285,
    longitude: 126.9632,
    zoning: '일반상업지역',
    isRailwayProtected: true,
    hasRoadAccess: true,
    waterDistance: 25,
    electricityAccess: '가용'
  },
  {
    id: 'KR-006',
    address: '부산광역시 동구 초량동 12 (부산역 도보 5분 선로변)',
    area: 120,
    landType: '잡종지',
    officialPrice: 650000,
    recommendedUse: '관광 팝업 스토어·자전거 보관 대여소·모바일 쉼터',
    restrictions: '안전 펜스 설치 필수·유동 관광 인구 밀접',
    status: '대부가능',
    region: '부산광역시',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
    latitude: 35.1152,
    longitude: 129.0423,
    zoning: '일반상업지역',
    isRailwayProtected: true,
    hasRoadAccess: true,
    waterDistance: 8,
    electricityAccess: '가용'
  },
  {
    id: 'KR-007',
    address: '대구광역시 동구 신암동 294-1',
    area: 500,
    landType: '전(밭)',
    officialPrice: 95000,
    recommendedUse: '친환경 주말농장·실버 도시텃밭',
    restrictions: '주민 복지 차원 우선 임대 권장 구역·용수 공급 시설 인접',
    status: '대부가능',
    region: '대구광역시',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    latitude: 35.8856,
    longitude: 128.6234,
    zoning: '자연녹지지역',
    isRailwayProtected: false,
    hasRoadAccess: false,
    waterDistance: 15,
    electricityAccess: '가설필요'
  },
  {
    id: 'KR-008',
    address: '광주광역시 광산구 송정동 800 (송정역 선로 서측)',
    area: 180,
    landType: '잡종지',
    officialPrice: 280000,
    recommendedUse: '소상공인 테이크아웃 창업·야외 전시 공간',
    restrictions: '복합환승센터 인접으로 개발 진행 중·진입 편의성 양호',
    status: '대부가능',
    region: '광주광역시',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    latitude: 35.1378,
    longitude: 126.7905,
    zoning: '준주거지역',
    isRailwayProtected: true,
    hasRoadAccess: true,
    waterDistance: 6,
    electricityAccess: '가용'
  },
  {
    id: 'KR-009',
    address: '강원특별자치도 강릉시 교동 21-1 (동해선 인접지)',
    area: 220,
    landType: '잡종지',
    officialPrice: 150000,
    recommendedUse: '캠핑용품 보관·자전거 쉼터·야외 플리마켓',
    restrictions: '관광 시즌 유동인구 집중·소음 차단용 울타리 설치 권장',
    status: '대부가능',
    region: '강원특별자치도',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
    latitude: 37.7685,
    longitude: 128.8954,
    zoning: '자연녹지지역',
    isRailwayProtected: false,
    hasRoadAccess: true,
    waterDistance: 30,
    electricityAccess: '가설필요'
  }
];

export const INITIAL_APPLICATIONS: LeaseApplication[] = [
  {
    id: 'APP-2026-001',
    applicantName: 'Arjun Srinivasan (아준 스리니바산)',
    entityType: '등록 소상공인 (MSME)',
    parcelId: 'KR-001',
    address: '대전광역시 동구 정동 1-1 (대전역 인근)',
    purpose: '푸드트럭 허브 (Food Truck Hub)',
    leasePeriod: 12,
    startDate: '2026-06-01',
    endDate: '2027-05-31',
    appliedDate: '2026-05-20',
    status: '심사중',
    yearlyFee: 2250000,
    monthlyFee: 187500,
    documents: [
      { name: 'Business_Plan_V2.pdf', size: '4.2 MB', type: 'PDF' },
      { name: 'KYC_Verified_Arjuns.pdf', size: '1.1 MB', type: 'PDF' },
      { name: 'Site_Layout_Drawing.jpg', size: '2.8 MB', type: 'Image' }
    ],
    timeline: [
      { status: '신청서 제출', date: '2026-05-20 10:15', description: '시민 포털을 통해 Arjun Srinivasan 님이 신청서를 제출했습니다.', actor: '민원인' },
      { status: '내부 감사 통과', date: '2026-05-22 14:30', description: '자동화 KYC 검사 및 서류 적격 여부 1차 심사가 완료되었습니다.', actor: '시스템' },
      { status: '공단 심사 진행', date: '2026-05-25 09:00', description: '담당 심사관(김철수 주임)에게 배정되어 현장 실사 및 철도안전성 평가 검토 중입니다.', actor: '김철수 심사관' }
    ]
  },
  {
    id: 'APP-2026-002',
    applicantName: 'John Doe Logistics (존 도 로지스틱스)',
    entityType: '법인 사업자',
    parcelId: 'KR-004',
    address: '대전광역시 대덕구 신탄진동 50',
    purpose: '대형 물류 야적 및 차량 대기선 구축',
    leasePeriod: 24,
    startDate: '2026-05-01',
    endDate: '2028-04-30',
    appliedDate: '2026-04-15',
    status: '승인',
    yearlyFee: 2400000, // 400 * 120000 * 0.05
    monthlyFee: 200000,
    documents: [
      { name: 'Logistics_Operations_Plan.pdf', size: '8.5 MB', type: 'PDF' },
      { name: 'Safety_Checklist_KR.pdf', size: '1.5 MB', type: 'PDF' }
    ],
    timeline: [
      { status: '신청서 제출', date: '2026-04-15 11:00', description: '존 도 로지스틱스 대행인 제출', actor: '민원인' },
      { status: '현장 실사 완료', date: '2026-04-20 16:00', description: '열차 하중 검토 결과 진동 영향 미미함 확인', actor: '박동부 차장' },
      { status: '대부 최종 승인', date: '2026-04-25 15:40', description: '연간 요율 5% 적용하여 계약서 발급 완료', actor: '국가철도공단 이사장' }
    ]
  },
  {
    id: 'APP-2026-003',
    applicantName: '김 영 희 (도시농부)',
    entityType: '개인',
    parcelId: 'KR-002',
    address: '대전광역시 서구 대전로 200 (선로 인접지)',
    purpose: '친환경 유기농 주말가족농장 운영',
    leasePeriod: 36,
    startDate: '2026-06-15',
    endDate: '2029-06-14',
    appliedDate: '2026-05-25',
    status: '심사중',
    yearlyFee: 200000, // 250 * 80000 * 0.01 = 200000원
    monthlyFee: 16666,
    documents: [
      { name: 'Eco_Farming_Proposal.pdf', size: '2.1 MB', type: 'PDF' }
    ],
    timeline: [
      { status: '신청서 제출', date: '2026-05-25 13:02', description: '김영희 농부 주말농장 대부 신청 접수 완료', actor: '민원인' }
    ]
  },
  {
    id: 'APP-2026-004',
    applicantName: '홍 길 동 (청년예비창업)',
    entityType: '예비 창업자',
    parcelId: 'KR-003',
    address: '세종시 조치원읍교리 10-5',
    purpose: '조치원 기차역 인접 청년 예술 플리마켓',
    leasePeriod: 12,
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    appliedDate: '2026-05-26',
    status: '보완요청',
    yearlyFee: 720000, // 80 * 300000 * 0.03 = 720,000원
    monthlyFee: 60000,
    documents: [
      { name: 'FleaMarket_Layout.pdf', size: '5.0 MB', type: 'PDF' }
    ],
    timeline: [
      { status: '신청서 제출', date: '2026-05-26 10:00', description: '청년마켓 대부 신청서 제출함', actor: '민원인' },
      { status: '보완 요청 발급', date: '2026-05-27 10:30', description: '플리마켓 부스 배치도가 철도 선로 한계선(3m 이내)을 침범하여 배치를 재조정해 주십시오. (철도보호안전법 저촉 우려)', actor: '김철수 심사관' }
    ]
  }
];

export const MONTHLY_REVENUE = [
  { month: '1월', revenue: 85, activeContracts: 580 },
  { month: '2월', revenue: 92, activeContracts: 592 },
  { month: '3월', revenue: 104, activeContracts: 605 },
  { month: '4월', revenue: 110, activeContracts: 615 },
  { month: '5월', revenue: 120, activeContracts: 624 }
];

export const LEASE_STATUS_STATS = [
  { name: '상업용 (푸드트럭/카페 등)', value: 45, color: '#00529C' }, // Railway Blue
  { name: '산업/물류용 (야적장/주차장)', value: 30, color: '#00731E' }, // Dark Green
  { name: '공공/도시농업 (경작/복지)', value: 25, color: '#FFC107' } // Yellow Gold
];

export const LAND_BUDDY_PRESETS = [
  {
    title: '🍔 대전역 근처 청년창업',
    query: '대전역 근처에 푸드트럭이나 팝업스토어 창업할 땅이 있을까요?',
    targetId: 'KR-001'
  },
  {
    title: '🌱 조용한 주말농장 땅',
    query: '도시농부 텃밭이나 주말농장용으로 대전 근처 친환경 경작지를 찾고 있어요.',
    targetId: 'KR-002'
  },
  {
    title: '☕ 세종시 청년 카페/마켓',
    query: '세종 조치원 역사 인근에서 청년창업 플리마켓이나 카페를 열고 싶어요.',
    targetId: 'KR-003'
  },
  {
    title: '📦 신탄진 근처 물류용지',
    query: '신탄진 근처에 야적장이랑 주차창으로 사용할 수 있는 단기 임대 땅이 필요한가요?',
    targetId: 'KR-004'
  },
  {
    title: '🏠 부산역 인근 관광쉼터',
    query: '부산역 근처 관광 특화 쉼터를 기획 중인데 대부 가능한 땅 추천 부탁해요.',
    targetId: 'KR-006'
  }
];
