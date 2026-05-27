/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MapPin, ExternalLink, Globe, Database, Cpu, 
  Check, Copy, Terminal, AlertCircle, Play, Sparkles, RefreshCw
} from 'lucide-react';

interface SpatialPortalProps {
  address: string;
  parcelId: string;
  area: number;
  officialPrice: number;
  latitude: number;
  longitude: number;
  zoning: string;
  isRailwayProtected: boolean;
  hasRoadAccess: boolean;
  waterDistance: number;
}

export default function SpatialPortal({ 
  address, parcelId, area, officialPrice, 
  latitude, longitude, zoning, isRailwayProtected, hasRoadAccess, waterDistance 
}: SpatialPortalProps) {
  const [copied, setCopied] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiStep, setApiStep] = useState('');
  
  // 국외 브라우저 리디렉션 주의 안내
  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
  const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(address)}`;
  const toeumUrl = `https://www.eum.go.kr/web/am/amMain.jsp`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 공공 API 실시간 가상 호출 시뮬레이션
  const handleTriggerApi = () => {
    setApiLoading(true);
    setApiLoaded(false);
    
    const steps = [
      `🌐 [기반] 주소 ${address.split(' ')[0]} / 위경도 (${latitude}, ${longitude}) 좌표 분석...`,
      `📄 [1단계 규제] 토지이용계획 API ➡️ ${zoning} 용도 판정 및 ${isRailwayProtected ? '철도보호지구 저촉구역 확인 (신고 대상)' : '철도구역 외 통과'}`,
      `💰 [1단계 비용] 공시지가 API 실시간 쿼리 ➡️ ㎡당 ${officialPrice.toLocaleString()} 원 로드 완료`,
      `🛣️ [2단계 인프라] V-World 지적도 공간연산 ➡️ 도로망 접합성: ${hasRoadAccess ? '정상 접합 도로 가용' : '맹지 판정 / 진입로 확보 필요'}`,
      `🚰 [2단계 인프라] 환경부 GIS 관로 데이터 ➡️ 수로 최단거리 ${waterDistance}m 최적 수용 분석`,
      `✨ [3단계 UI/UX] Gemini AI 인간의 언어 번역 브릿지 패키징 완료 (200 OK SUCCESS)`
    ];

    let currentStep = 0;
    setApiStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setApiStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        setApiLoading(false);
        setApiLoaded(true);
      }
    }, 700);
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-5 font-sans" id={`spatial_hub_${parcelId}`}>
      {/* 타이틀 및 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-xs">국토교통부 표준•외부 공간정보 연계포털</h4>
            <span className="text-[10px] text-gray-400">Naver/Kakao Maps & 국가공간정보포털 API 가설</span>
          </div>
        </div>
        <span className="bg-emerald-100 text-[#006e1c] text-[10px] px-2 py-0.5 rounded-full font-bold">
          실시간 연동 가용
        </span>
      </div>

      {/* 1. 포털 연계 버튼 카드 */}
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold text-gray-400 font-mono">TARGET ADDRESS</span>
            <p className="text-xs text-gray-900 font-bold leading-tight">{address}</p>
          </div>
          <button 
            onClick={handleCopyAddress}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition text-[10px] font-semibold"
            id={`btn_copy_addr_${parcelId}`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>주소 복사</span>
              </>
            )}
          </button>
        </div>

        {/* 대기업 맵 연계 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {/* 네이버 지도 바로가기 */}
          <a
            href={naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-xs font-semibold text-gray-700 hover:text-gray-900 shadow-2xs"
            id={`btn_naver_map_${parcelId}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#03C75A] inline-block shrink-0" />
            <span>네이버 지도</span>
            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
          </a>

          {/* 카카오맵 바로가기 */}
          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-xs font-semibold text-gray-700 hover:text-gray-900 shadow-2xs"
            id={`btn_kakao_map_${parcelId}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500] inline-block shrink-0" />
            <span>카카오맵</span>
            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
          </a>

          {/* 토지e음 바로가기 */}
          <a
            href={toeumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition text-xs font-bold text-blue-900 shadow-2xs"
            onClick={() => {
              if(!copied) handleCopyAddress();
            }}
            id={`btn_toeum_portal_${parcelId}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0" />
            <span>정부 토지e음 조회</span>
            <span className="text-[9px] text-blue-500 font-normal underline">(주소 주입됨)</span>
            <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
          </a>
        </div>
        <p className="text-[10px] text-gray-400 leading-normal">
          💡 **팁:** 토지e음은 정부 공식 토지이용규제 서비스입니다. 버튼 클릭 시 주소가 자동으로 클립보드에 복사되므로, 열리는 검색창에 바로 **붙여넣기(Ctrl+V)**하여 해당 필지의 상세 용도지부 제한을 원스톱 체크하십시오.
        </p>
      </div>

      {/* 2. 국토계획 공공 API 동적 시뮬레이터 */}
      <div className="bg-[#111827] text-gray-100 rounded-xl p-4 space-y-3 overflow-hidden shadow-xs relative" id={`api_console_${parcelId}`}>
        {/* 장식용 은은한 글로우 효과 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-[10px] text-gray-300 font-bold uppercase tracking-wider">Public LAND API Console</span>
          </div>
          <span className="font-mono text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
            vworld.mlit.go.kr
          </span>
        </div>

        {/* API 앤드포인트 뱃지 */}
        <div className="bg-black/40 px-2.5 py-1.5 rounded-lg border border-gray-800 font-mono text-[10.5px] text-[#A78BFA] leading-none overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="text-emerald-400 font-bold">GET</span> /api/public/vworld/landPlanReg?address={address.split(' ')[1]}...&serviceKey=K-RAIL-LBUDDY
        </div>

        {/* 대기 상태 */}
        {!apiLoading && !apiLoaded && (
          <div className="py-4 text-center space-y-2">
            <p className="text-xs text-gray-400 leading-normal">
              이 유휴공간의 실시간 용도구역 저촉, 건폐율제한 및 지적 표준 공공 데이터를 모의조회 하겠습니까?
            </p>
            <button
              onClick={handleTriggerApi}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 mx-auto transition active:scale-95 shadow-lg shadow-emerald-950/20"
              id={`btn_trigger_api_${parcelId}`}
            >
              <Cpu className="w-3.5 h-3.5" />
              정부 토지계획 공공 API 동적 호출
            </button>
          </div>
        )}

        {/* 로딩 진행 바 */}
        {apiLoading && (
          <div className="py-3 space-y-2.5 animate-pulse">
            <div className="flex items-center gap-2 text-[10.5px] font-mono text-emerald-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{apiStep}</span>
            </div>
            <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-4/5 rounded-full animate-infinite-loading" />
            </div>
          </div>
        )}

        {/* 로드 완료 - 정부 XML/JSON 표준 파싱 뷰어 */}
        {apiLoaded && (
          <div className="space-y-3 pt-1 animate-in fade-in-50 duration-250">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              <span>공공 API 응답 파싱 완료 (Status: 200 SUCCESS)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-black/50 p-2 rounded border border-gray-800 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">용도지역 (Planning Area)</div>
                <div className="text-white font-semibold mt-0.5">{zoning}</div>
              </div>
              <div className="bg-black/50 p-2 rounded border border-gray-800 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">철도제한구역 여부</div>
                <div className={`font-bold mt-0.5 ${isRailwayProtected ? 'text-[#F59E0B]' : 'text-emerald-400'}`}>
                  {isRailwayProtected ? '철도보호지구 저촉 포함' : '보호구역 외 통과 (안전)'}
                </div>
              </div>
              <div className="bg-black/50 p-2 rounded border border-gray-800 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">가용 건폐율 상한</div>
                <div className="text-emerald-400 font-bold mt-0.5">
                  {zoning.includes('상업') ? '최대 70%' : zoning.includes('녹지') ? '최대 20%' : '최대 60%'} (가설물 100%)
                </div>
              </div>
              <div className="bg-black/50 p-2 rounded border border-gray-800 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">도로 접합 / 최단 용수</div>
                <div className="text-white font-semibold mt-0.5">
                  {hasRoadAccess ? '도로접함' : '맹지'} • 용수 {waterDistance}m 인접
                </div>
              </div>
            </div>

            {/* 변상금 및 안전 가용 여부 가이드 */}
            <div className="bg-emerald-950/40 p-2.5 rounded border border-emerald-900/50 text-[10px] text-emerald-300 leading-normal flex gap-1.5">
              <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                **대부 자정 통보:** 본 부지는 국토계획 상 **'{zoning}'**에 속하며, 철도안전법 저촉 우려에 대한 가상 시뮬레이션을 통과하였습니다. {hasRoadAccess ? '지적도상 완벽한 도로 접합이 확보되어 즉시 행정 신청에 걸림돌이 없습니다.' : '진입로가 미확보(맹지)되어 있으므로 공사 전 평탄화 지원 방안을 지사에서 연계하여 안전하게 이용 가능합니다!'}
              </span>
            </div>

            <button
              onClick={handleTriggerApi}
              className="w-full py-1.5 border border-emerald-800 hover:bg-emerald-950 text-emerald-400 font-bold text-[10.5px] rounded-lg transition text-center font-mono"
              id={`btn_refresh_api_${parcelId}`}
            >
              🔄 데이터 재조회 (Re-fetch Data)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
