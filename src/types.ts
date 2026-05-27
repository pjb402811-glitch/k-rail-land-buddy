/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LandParcel {
  id: string; // 예: KR-001
  address: string; // 소재지
  area: number; // 면적 (㎡)
  landType: string; // 지목 (잡종지, 전, 대지 등)
  officialPrice: number; // 공시지가 (원/㎡)
  recommendedUse: string; // 추천용도
  restrictions: string; // 규제 및 특이사항
  status: '대부가능' | '계약중' | '보류' | '심사중'; // 대부상태
  imageUrl?: string; // 부지 예시 이미지 URL
  region: string; // 대전, 세종, 서울, 부산, 대구, 광주, 강원 등
  // --- 대표님 오더 100% 오픈 API 기반 데이터 매핑 정보 추가 ---
  latitude: number; // 위도
  longitude: number; // 경도
  zoning: string; // 국토계획 용도지역구분
  isRailwayProtected: boolean; // 철도보호지구 저촉 여부
  hasRoadAccess: boolean; // 지적도상 도로 접합성 (진입로 가용성)
  waterDistance: number; // 환경부 GIS 데이터 기반 상하수도/구거 관로 최단 거리 (m)
  electricityAccess: '가용' | '가설필요'; // 한전 배전반 연계 전기 가용 여부
}

export interface LeaseApplication {
  id: string;
  applicantName: string;
  entityType?: string; // 개인, 예비창업자, 소상공인, 도시농부, 법인 등
  parcelId: string;
  address: string;
  purpose: string;
  leasePeriod: number; // 대부 기간 (개월 단위, 기본 12)
  startDate: string;
  endDate: string;
  appliedDate: string;
  status: '심사중' | '승인' | '보완요청' | '반려';
  yearlyFee: number;
  monthlyFee: number;
  documents?: Array<{ name: string; size: string; type: string }>;
  timeline?: Array<{ status: string; date: string; description: string; actor?: string }>;
}

export interface LandBuddyMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'recommend' | 'simulation' | 'form';
    parcel?: LandParcel;
    application?: Partial<LeaseApplication>;
  };
}
