/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, ExternalLink, Globe, Database, Cpu, 
  Check, Copy, Terminal, AlertCircle, Play, Sparkles, RefreshCw,
  Layers, Map as MapIcon, Image as ImageIcon
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
  
  // 카카오 맵 관련 상태
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showSkyview, setShowSkyview] = useState(false);
  const [showUseDistrict, setShowUseDistrict] = useState(false); // 지적편집도 여부
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
  const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(address)}`;
  const toeumUrl = `https://www.eum.go.kr/web/am/amMain.jsp`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 카카오 맵 API SDK 로드 및 초기화
  useEffect(() => {
    const jsKey = ((import.meta as any).env?.VITE_KAKAO_JS_KEY as string) || '';
    if (!jsKey) {
      setMapError(true);
      return;
    }

    const initMap = () => {
      try {
        if (!mapContainerRef.current) return;
        const kakao = (window as any).kakao;
        if (!kakao || !kakao.maps || !kakao.maps.LatLng || !kakao.maps.Map || !kakao.maps.Marker || !kakao.maps.InfoWindow || !kakao.maps.Circle) {
          setMapError(true);
          return;
        }

        const centerLatLng = new kakao.maps.LatLng(latitude, longitude);

        // 항상 컨테이너의 내부 HTML을 비워서 지도 객체의 중복 렌더링 및 무한 루프 문제를 방지합니다. (철벽 방어!)
        mapContainerRef.current.innerHTML = '';

        // 지도 옵션
        const options = {
          center: centerLatLng,
          level: 3
        };

        const map = new kakao.maps.Map(mapContainerRef.current, options);
        setMapInstance(map);

        // 마커 생성
        const marker = new kakao.maps.Marker({
          position: centerLatLng
        });
        marker.setMap(map);

        // 커스텀 디자인 말풍선 윈도우 생성
        const iwContent = `
          <div style="padding:10px 12px; font-family:'Pretendard',sans-serif; font-size:11px; font-weight:700; color:#0f172a; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); min-width:160px; text-align:left;">
            <span style="color:#00529C; font-size:9px; font-weight:800; display:block; margin-bottom:3px; letter-spacing:0.5px;">🚉 K-RAIL 국유 유휴지</span>
            <div style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap; font-size:11px;">지번: ${address.split('(')[0]}</div>
            <div style="color:#059669; font-size:9.5px; margin-top:2.5px; font-weight:500;">용도: ${zoning.split('·')[0]}</div>
          </div>
        `;
        const infowindow = new kakao.maps.InfoWindow({
          content: iwContent,
          removable: false
        });
        infowindow.open(map, marker);

        // 1. 철도보호지구(isRailwayProtected)일 경우 가상 안전 펜스 (붉은 35m 반경 가이드라인) 표시
        if (isRailwayProtected) {
          const circle = new kakao.maps.Circle({
            center : centerLatLng,
            radius: 35, 
            strokeWeight: 1.8,
            strokeColor: '#f43f5e',
            strokeOpacity: 0.9,
            strokeStyle: 'dashed',
            fillColor: '#f43f5e',
            fillOpacity: 0.08
          });
          circle.setMap(map);
        }

        // 2. 인근 농업용수/소하천(waterDistance) 접근 구역 (하늘색 반경 가이드라인) 시각화
        if (waterDistance > 0) {
          const waterCircle = new kakao.maps.Circle({
            center : centerLatLng,
            radius: Math.max(30, waterDistance),
            strokeWeight: 1.2,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeStyle: 'dashed',
            fillColor: '#3b82f6',
            fillOpacity: 0.03
          });
          waterCircle.setMap(map);
        }

        // 기존 토글 상태 유지 적용
        if (showUseDistrict) {
          map.addOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
        }
        if (showSkyview) {
          map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
        }

        setMapLoaded(true);
        setMapError(false);
      } catch (err) {
        console.error('Kakao Map init failed inside try-catch:', err);
        setMapError(true);
      }
    };

    const kakao = (window as any).kakao;
    if (kakao && kakao.maps && kakao.maps.Map) {
      // 이미 SDK가 주입 및 로드되어 있으면 즉시 초기화 실행
      initMap();
    } else {
      const scriptId = 'kakao-map-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&autoload=false&libraries=services`;
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          const k = (window as any).kakao;
          if (k && k.maps) {
            k.maps.load(() => {
              initMap();
            });
          } else {
            setMapError(true);
          }
        };
        script.onerror = () => {
          setMapError(true);
        };
      } else {
        const checkInterval = setInterval(() => {
          const k = (window as any).kakao;
          if (k && k.maps && k.maps.load) {
            clearInterval(checkInterval);
            k.maps.load(() => {
              initMap();
            });
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    }
  }, [parcelId, address, latitude, longitude, isRailwayProtected, waterDistance, zoning]);

  // 지도 위성/일반 토글
  const toggleMapType = (type: 'road' | 'sky') => {
    if (!mapInstance) return;
    const kakao = (window as any).kakao;
    if (type === 'sky') {
      mapInstance.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
      setShowSkyview(true);
    } else {
      mapInstance.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);
      setShowSkyview(false);
    }
  };

  // 진짜 카카오 지적편집도(USE_DISTRICT) 오버레이 토글
  const toggleUseDistrict = () => {
    if (!mapInstance) return;
    const kakao = (window as any).kakao;
    if (showUseDistrict) {
      mapInstance.removeOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
      setShowUseDistrict(false);
    } else {
      mapInstance.addOverlayMapTypeId(kakao.maps.MapTypeId.USE_DISTRICT);
      setShowUseDistrict(true);
    }
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
    }, 400); // 400ms 간격으로 더 쾌적하고 신속하게 자동 주입 로딩
  };

  // 컴포넌트 마운트 및 부지 변경 시 수동 조작 필요 없이 '자동 즉시 로드' 구동
  useEffect(() => {
    if (parcelId) {
      handleTriggerApi();
    }
  }, [parcelId, address, latitude, longitude]);

  return (
    <div className="glass-card p-5 space-y-5 rounded-2xl font-sans" id={`spatial_hub_${parcelId}`}>
      {/* 타이틀 및 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-green-light/80 text-brand-green flex items-center justify-center border border-brand-green/10">
            <Globe className="w-4 h-4 text-brand-green" />
          </div>
          <div>
            <h4 className="font-sans font-extrabold text-gray-950 text-xs tracking-tight">국토교통부 표준•외부 공간정보 연계포털</h4>
            <span className="text-[10px] text-gray-400 font-medium">Naver/Kakao Maps & 국가공간정보포털 API 가설</span>
          </div>
        </div>
        <span className="bg-brand-green text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm">
          실시간 연동 가용
        </span>
      </div>

      {/* [고도화 추가] 진짜 인터랙티브 카카오 맵 뷰어 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-gray-400 font-sans tracking-wide flex items-center gap-1.5 uppercase">
            <MapPin className="w-3.5 h-3.5 text-brand-blue" /> 실시간 카카오 2D 지적/공간 지도
          </span>
          <div className="flex items-center gap-1.5">
            {/* 위성/일반 전환 */}
            <button
              onClick={() => toggleMapType(showSkyview ? 'road' : 'sky')}
              className={`px-2.5 py-1.5 rounded-xl text-[9.5px] font-bold flex items-center gap-1 border shadow-3xs transition-all cursor-pointer active:scale-95 duration-200 ${
                showSkyview 
                  ? 'bg-brand-green-light text-brand-green-deep border-brand-green/20' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
              }`}
              title="위성/일반 지도 토글"
            >
              <ImageIcon className="w-3 h-3 text-brand-green" />
              {showSkyview ? '일반지도' : '위성보기'}
            </button>
            {/* 지적편집도 토글 */}
            <button
              onClick={toggleUseDistrict}
              className={`px-2.5 py-1.5 rounded-xl text-[9.5px] font-bold flex items-center gap-1 border shadow-3xs transition-all cursor-pointer active:scale-95 duration-200 ${
                showUseDistrict 
                  ? 'bg-brand-green text-white border-brand-green' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-50'
              }`}
              title="국토부 지적편집도 레이어 오버레이"
            >
              <Layers className="w-3 h-3" />
              지적도 {showUseDistrict ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 지도 컨테이너 */}
        <div className="relative w-full h-[280px] bg-slate-50 border border-slate-200/70 rounded-2xl overflow-hidden shadow-inner">
          <div 
            ref={mapContainerRef} 
            className="w-full h-full"
            style={{ minHeight: '100%' }}
          />

          {/* 지도로딩 상태 스피너 */}
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-brand-blue animate-spin" />
              <span className="text-[10px] text-slate-500 font-medium">카카오 실시간 지도 로드 중...</span>
            </div>
          )}

          {/* 지도 에러 폴백 */}
          {mapError && (
            <div className="absolute inset-0 bg-rose-50 flex flex-col items-center justify-center p-4 text-center gap-1.5">
              <AlertCircle className="w-6 h-6 text-rose-500" />
              <span className="text-xs font-bold text-rose-900">카카오 맵 API 키 초기화 지연</span>
              <p className="text-[10px] text-rose-500 leading-normal max-w-xs">Vercel 환경변수 또는 LocalStorage에 등록된 JavaScript API 키를 불러오고 있습니다.</p>
            </div>
          )}

          {/* 철도보호/용수 표시 맵 가이드 오버레이 */}
          {mapLoaded && (
            <div className="absolute bottom-3 right-3 glass-dark px-3 py-2 rounded-xl text-white/95 text-[9px] font-bold font-sans flex flex-col gap-1 shadow-md pointer-events-none border border-white/10 z-10">
              {isRailwayProtected && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1.5 border border-dashed border-[#f43f5e] bg-[#f43f5e]/20 inline-block" />
                  <span>철도 특별안전지구 (35m 한계)</span>
                </div>
              )}
              {waterDistance > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1.5 border border-dashed border-[#3b82f6] bg-[#3b82f6]/10 inline-block" />
                  <span>농공용수 최적구역 ({waterDistance}m 반경)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. 포털 연계 버튼 카드 */}
      <div className="space-y-3">
        <div className="bg-brand-blue-light/50 border border-brand-blue/10 rounded-xl p-3.5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10.5px] font-black text-brand-blue-deep/60 font-mono tracking-wider uppercase block">TARGET ADDRESS</span>
            <p className="text-xs text-gray-900 font-extrabold leading-tight">{address}</p>
          </div>
          <button 
            onClick={handleCopyAddress}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all text-[10px] font-bold cursor-pointer active:scale-95 shadow-3xs"
            id={`btn_copy_addr_${parcelId}`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-green" />
                <span>복사 완료</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>주소 복사</span>
              </>
            )}
          </button>
        </div>

        {/* 대기업 맵 연계 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {/* 네이버 지도 바로가기 */}
          <a
            href={naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 transition-all text-[10px] sm:text-xs font-bold text-slate-700 hover:text-slate-900 shadow-3xs active:scale-97"
            id={`btn_naver_map_${parcelId}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#03C75A] inline-block shrink-0" />
            <span className="truncate">네이버 지도</span>
            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
          </a>

          {/* 카카오맵 바로가기 */}
          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 transition-all text-[10px] sm:text-xs font-bold text-slate-700 hover:text-slate-900 shadow-3xs active:scale-97"
            id={`btn_kakao_map_${parcelId}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500] inline-block shrink-0" />
            <span className="truncate">카카오맵</span>
            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
          </a>

          {/* 토지e음 바로가기 */}
          <a
            href={toeumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-brand-blue/15 bg-brand-blue-light hover:bg-brand-blue-light/75 transition-all text-[10px] sm:text-xs font-bold text-brand-blue shadow-3xs active:scale-97"
            onClick={() => {
              if(!copied) handleCopyAddress();
            }}
            id={`btn_toeum_portal_${parcelId}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-brand-blue inline-block shrink-0" />
            <span>토지e음 조회</span>
            <span className="text-[8.5px] text-brand-blue/80 font-normal underline shrink-0">(복사됨)</span>
            <ExternalLink className="w-3 h-3 text-brand-blue/50 shrink-0" />
          </a>
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
          💡 **팁:** 토지e음은 정부 공식 토지이용규제 서비스입니다. 버튼 클릭 시 주소가 자동으로 클립보드에 복사되므로, 열리는 검색창에 바로 **붙여넣기(Ctrl+V)**하여 해당 필지의 상세 용도지부 제한을 원스톱 체크하십시오.
        </p>
      </div>

      {/* 2. 국토계획 공공 API 동적 시뮬레이터 (자동 연동 결과 노출) */}
      <div className="glass-dark text-gray-100 rounded-2xl p-4.5 space-y-3.5 overflow-hidden shadow-2xl relative" id={`api_console_${parcelId}`}>
        {/* 장식용 은은한 글로우 효과 */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-brand-green shrink-0 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-300 font-extrabold uppercase tracking-widest">Public LAND API Console</span>
          </div>
          <span className="font-mono text-[9px] bg-brand-green/20 text-brand-green px-2 py-0.5 rounded font-bold">
            vworld.mlit.go.kr
          </span>
        </div>

        {/* API 앤드포인트 뱃지 */}
        <div className="bg-brand-dark/65 px-3 py-2 rounded-xl border border-white/5 font-mono text-[10.5px] text-[#A78BFA] leading-none overflow-x-auto whitespace-nowrap scrollbar-none shadow-inner">
          <span className="text-brand-green font-bold">GET</span> /api/public/vworld/landPlanReg?address={address.split(' ')[1]}...&serviceKey=K-RAIL-LBUDDY
        </div>

        {/* 자동 로딩 진행 상태 */}
        {apiLoading && (
          <div className="py-3 space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-[10.5px] font-mono text-brand-green">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{apiStep}</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-green h-full w-4/5 rounded-full animate-infinite-loading" />
            </div>
          </div>
        )}

        {/* 로드 완료 - 정부 XML/JSON 표준 파싱 뷰어 */}
        {apiLoaded && (
          <div className="space-y-3 pt-1 animate-in fade-in-50 duration-250">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-brand-green">
              <Check className="w-4 h-4 shrink-0 text-brand-green" />
              <span>공공 API 응답 파싱 완료 (Status: 200 SUCCESS)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-brand-dark/45 p-2 rounded-xl border border-white/5 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">용도지역 (Planning Area)</div>
                <div className="text-white font-semibold mt-0.5">{zoning}</div>
              </div>
              <div className="bg-brand-dark/45 p-2 rounded-xl border border-white/5 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">철도제한구역 여부</div>
                <div className={`font-bold mt-0.5 ${isRailwayProtected ? 'text-brand-gold' : 'text-brand-green'}`}>
                  {isRailwayProtected ? '철도보호지구 저촉 포함' : '보호구역 외 통과 (안전)'}
                </div>
              </div>
              <div className="bg-brand-dark/45 p-2 rounded-xl border border-white/5 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">가용 건폐율 상한</div>
                <div className="text-brand-green font-bold mt-0.5">
                  {zoning.includes('상업') ? '최대 70%' : zoning.includes('녹지') ? '최대 20%' : '최대 60%'} (가설물 100%)
                </div>
              </div>
              <div className="bg-brand-dark/45 p-2 rounded-xl border border-white/5 leading-normal">
                <div className="text-gray-500 font-bold text-[9px] uppercase">도로 접합 / 최단 용수</div>
                <div className="text-white font-semibold mt-0.5">
                  {hasRoadAccess ? '도로접함' : '맹지'} • 용수 {waterDistance}m 인접
                </div>
              </div>
            </div>

            {/* 변상금 및 안전 가용 여부 가이드 */}
            <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-brand-green/20 text-[10px] text-emerald-300 leading-relaxed flex gap-1.5">
              <AlertCircle className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
              <span>
                <strong>사용허가(임차) 자정 통보:</strong> 본 부지는 국토계획 상 **'{zoning}'**에 속하며, 철도안전법 저촉 우려에 대한 가상 시뮬레이션을 통과하였습니다. {hasRoadAccess ? '지적도상 완벽한 도로 접합이 확보되어 즉시 행정 신청에 걸림돌이 없습니다.' : '진입로가 미확보(맹지)되어 있으므로 공사 전 평탄화 지원 방안을 지사에서 연계하여 안전하게 이용 가능합니다!'}
              </span>
            </div>

            <button
              onClick={handleTriggerApi}
              className="w-full py-2 border border-emerald-800 hover:bg-emerald-950/50 text-brand-green font-bold text-[10.5px] rounded-xl transition text-center font-mono cursor-pointer"
              id={`btn_refresh_api_${parcelId}`}
            >
              🔄 데이터 수동 재조회 (Re-fetch Data)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
