/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, MapPin, Eye, RefreshCw, 
  Sparkles, Check, AlertCircle, Bookmark, Compass, Landmark 
} from 'lucide-react';
import { LandParcel } from '../types';
import { LAND_PARCELS } from '../data';
import SpatialPortal from './SpatialPortal';

interface InventoryProps {
  onSelectParcel: (id: string) => void;
  onGoToAssistant: () => void;
}

export default function InventoryManagement({ onSelectParcel, onGoToAssistant }: InventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedUsage, setSelectedUsage] = useState('All Usage');
  const [activeDetailParcel, setActiveDetailParcel] = useState<LandParcel | null>(null);

  // 고유 지역 및 용도 리스트 가공
  const regions = ['All Regions', '대전광역시', '세종특별자치시', '서울특별시', '부산광역시', '대구광역시', '광주광역시', '강원특별자치도'];
  const usages = [
    'All Usage', 
    '소상공인 창업·푸드트럭', 
    '도시농업·주말농장', 
    '청년창업 카페·플리마켓', 
    '물류창고·야적장·주차장'
  ];

  // 필터 통과 로직
  const filteredParcels = LAND_PARCELS.filter(p => {
    const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.recommendedUse.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === 'All Regions' || p.region === selectedRegion || p.address.includes(selectedRegion.substring(0,2));
    
    let matchesUsage = true;
    if (selectedUsage !== 'All Usage') {
      if (selectedUsage === '소상공인 창업·푸드트럭') {
        matchesUsage = p.recommendedUse.includes('창업') || p.recommendedUse.includes('푸드트럭') || p.recommendedUse.includes('상업');
      } else if (selectedUsage === '도시농업·주말농장') {
        matchesUsage = p.recommendedUse.includes('농업') || p.recommendedUse.includes('농장') || p.recommendedUse.includes('텃밭');
      } else if (selectedUsage === '청년창업 카페·플리마켓') {
        matchesUsage = p.recommendedUse.includes('카페') || p.recommendedUse.includes('플리마켓');
      } else if (selectedUsage === '물류창고·야적장·주차장') {
        matchesUsage = p.recommendedUse.includes('물류') || p.recommendedUse.includes('야적장') || p.recommendedUse.includes('주차장');
      }
    }

    return matchesSearch && matchesRegion && matchesUsage;
  });

  const handleConsultParcel = (parcel: LandParcel) => {
    onSelectParcel(parcel.id);
    onGoToAssistant();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans" id="inventory_management_root">
      {/* 타이틀 및 해설 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="inventory_header_bar">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#00529C]" />
            Land Inventory Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            철도 가용 노선 인접 마스터 자산목록을 투명하게 검색하고 예상 렌탈 시뮬레이션을 상담해드립니다
          </p>
        </div>
        <div className="flex bg-[#E1F0FF] text-[#00529C] px-3 py-1.5 rounded-full text-xs font-bold items-center gap-1">
          <Check className="w-4 h-4" /> K-Rail 데이터 100% 동기화완료
        </div>
      </div>

      {/* 필터 세면대 상단바 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 grid grid-cols-1 md:grid-cols-4 gap-4" id="inventory_filters_bar">
        {/* 검색 인풋 */}
        <div className="space-y-1 md:col-span-2">
          <label className="block text-xs font-bold text-gray-500">Search by Site ID / Address (부지번호 및 소재지 검색)</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="예: KR-001, 대전역 인근, 주말농장 등"
              className="w-full bg-gray-50 text-xs border border-gray-200 focus:border-[#00529C] outline-none rounded-xl pl-10 pr-4 py-3 placeholder:text-gray-400 text-gray-700 font-sans"
              id="search_site_id_input"
            />
          </div>
        </div>

        {/* 지역 셀렉터 */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500">Region (지역 선택)</label>
          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-[#00529C] text-gray-700"
            id="region_select_filter"
          >
            {regions.map((r, ri) => (
              <option key={ri} value={r}>{r === 'All Regions' ? '전체 관할 권역' : r}</option>
            ))}
          </select>
        </div>

        {/* 목적 분류 셀렉터 */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500">Usage Type (용도 선택)</label>
          <select 
            value={selectedUsage}
            onChange={(e) => setSelectedUsage(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 outline-none focus:ring-1 focus:ring-[#00529C] text-gray-700"
            id="usage_select_filter"
          >
            {usages.map((u, ui) => (
              <option key={ui} value={u}>{u === 'All Usage' ? '전체 권장 용도' : u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 부지 데이터 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden" id="inventory_table_card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" id="inventory_table_element">
            <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 uppercase tracking-wider font-sans">
              <tr>
                <th className="p-3.5 font-semibold">Site ID (부지번호)</th>
                <th className="p-3.5 font-semibold">Address (소재지)</th>
                <th className="p-3.5 font-semibold text-right">Area (면적)</th>
                <th className="p-3.5 font-semibold">Type/Purpose (용지/지목)</th>
                <th className="p-3.5 font-semibold text-center">Status (상태)</th>
                <th className="p-3.5 font-semibold text-center">Details (보기)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParcels.length > 0 ? (
                filteredParcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-gray-50/50 transition duration-150 text-gray-700">
                    <td className="p-3.5 font-mono font-bold text-[#00529C]">{parcel.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-gray-950 font-sans">{parcel.address.split('(')[0]}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[280px]" title={parcel.address}>{parcel.address}</div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-gray-800">{parcel.area.toLocaleString()} ㎡</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded mr-1.5 text-[10px]">{parcel.landType}</span>
                      <span className="text-gray-500 font-sans">{parcel.recommendedUse}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                        parcel.status === '대부가능' 
                          ? 'bg-emerald-50 text-[#006e1c] border-emerald-200' 
                          : 'bg-gray-150 text-gray-600 border-gray-200'
                      }`}>
                        {parcel.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button 
                        onClick={() => setActiveDetailParcel(parcel)}
                        className="text-gray-400 hover:text-[#00529C] p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="부지 상세조회"
                        id={`btn_view_${parcel.id}`}
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-sans text-gray-400">
                    <p className="font-bold text-[#00529C] text-sm mb-1">일치하는 철도유휴부지가 없습니다</p>
                    <p className="text-xs text-gray-500">상위 검색 요건이나 지역 관할본부를 다시 조정해 보시거나 랜드버디 챗봇에 연계 비전을 질문바랍니다.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단: 통계 및 비전 피드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="inventory_footer_stats">
        {/* 인벤토리 활성 비율 - Inventory Health 백분율 차트 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-xs" id="inventory_health_card">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-450 block uppercase tracking-wider">INVENTORY HEALTH (가용률)</span>
            <h3 className="font-sans font-bold text-2xl text-gray-900 leading-tight">84% 개방 완료</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-sans mr-2">
              전체 842개의 인접 부지 중, 소상공인 렌탈 및 농부 체험 공간으로 624개의 부지가 안전 대부 승인되어 활성 계약 중입니다.
            </p>
          </div>
          {/* 미려한 도넛 차트 SVG */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center" id="donut_chart_svg">
            <svg className="w-full h-full transform -rotate-90">
              {/* 회색 밑선 회로 */}
              <circle cx="48" cy="48" r="38" stroke="#E9ECEF" strokeWidth="8" fill="transparent" />
              {/* 녹색 가용 회로 */}
              <circle cx="48" cy="48" r="38" stroke="#00529C" strokeWidth="8" fill="transparent" 
                strokeDasharray="238.76" strokeDashoffset="38.2" // 84% 표현
              />
            </svg>
            <span className="absolute text-sm font-bold font-mono text-[#00529C]">84%</span>
          </div>
        </div>

        {/* 지역 분포 분석 피드 배너 */}
        <div className="bg-[#f0f4f8] border border-blue-100 rounded-2xl p-5 flex flex-col justify-between shadow-xs" id="regional_distribution_card">
          <div>
            <span className="text-xs font-semibold text-[#00529C] block uppercase tracking-wider mb-1">REGIONAL DISTRIBUTION</span>
            <p className="text-xs text-gray-700 leading-relaxed font-sans">
              현재 저희 공간 복지 시스템에서는 **대전 광역권에 45%**의 특화 푸드트럭, 텃밭 사업이 집중되어 있습니다. 대구, 부산, 광주 등 대도시 기차 역사 전방 500m 이내 유휴 철도로 가용 범위를 광역망 수준으로 확장 중입니다.
            </p>
          </div>
          <button 
            onClick={onGoToAssistant}
            className="text-xs font-bold text-[#00529C] hover:underline text-left mt-3 flex items-center gap-1"
            id="btn_view_analytics_map"
          >
            K-Rail 랜드버디 즉시 상담 바로가기 ➡️
          </button>
        </div>
      </div>

      {/* 부지 정보 상세 모달 팝업 */}
      {activeDetailParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" id="inventory_detail_modal">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl border border-gray-100 animate-in fade-in-50 zoom-in-95" id="detail_modal_container">
            {/* 이미지 */}
            <div className="relative h-48 bg-gray-100 shrink-0 scroll-none">
              <img 
                src={activeDetailParcel.imageUrl} 
                alt={activeDetailParcel.id} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
                {activeDetailParcel.id}
              </div>
              <button 
                onClick={() => setActiveDetailParcel(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white font-bold text-sm flex items-center justify-center hover:bg-black/70"
                id="btn_close_detail_modal"
              >
                ✕
              </button>
            </div>

            {/* 본문 - 스크롤 적용 */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1" id="detail_modal_body">
              <div>
                <span className="text-[10px] bg-blue-100 text-[#00529C] px-2 py-0.5 rounded font-bold font-mono">
                  {activeDetailParcel.landType} • 면적 {activeDetailParcel.area}㎡
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-2">{activeDetailParcel.address}</h3>
                <p className="text-gray-500 mt-1 font-sans">공시지가: <span className="font-bold font-mono text-gray-800">₩{activeDetailParcel.officialPrice.toLocaleString()} / ㎡</span></p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 border border-gray-100">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">추천 한도 용도</span>
                  <span className="font-semibold text-emerald-700">{activeDetailParcel.recommendedUse}</span>
                </div>
                <div className="flex justify-between items-start pt-1 gap-2">
                  <span className="font-semibold text-gray-600 shrink-0">규제/특이사항</span>
                  <span className="text-right text-gray-700 font-medium leading-relaxed">{activeDetailParcel.restrictions}</span>
                </div>
              </div>

              {/* 실시간 네이버/카카오 지도 및 공공API 공간포털 연계 장치 */}
              <SpatialPortal 
                address={activeDetailParcel.address} 
                parcelId={activeDetailParcel.id}
                area={activeDetailParcel.area}
                officialPrice={activeDetailParcel.officialPrice}
              />

              <div className="bg-blue-50/50 p-3.5 rounded-xl text-blue-800 font-sans border border-blue-50">
                ⭐ **국민 공간 복지 안내:** 대전역 청년 창업 요율(3%), 경작용(1%) 등 맞춤 설계에 관하여 랜드버디 가상 시큐리티 계산을 받으시려면 아래 비서 상담 버튼을 눌러주세요.
              </div>
            </div>

            {/* 하단 액션 버튼 바 - 하단 고정 */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5 shrink-0" id="detail_modal_actions">
              <button 
                onClick={() => setActiveDetailParcel(null)}
                className="flex-1 py-3 border border-gray-300 bg-white rounded-xl text-gray-700 font-semibold text-center hover:bg-gray-50 transition"
                id="btn_close_detail"
              >
                닫기
              </button>
              <button 
                onClick={() => handleConsultParcel(activeDetailParcel)}
                className="flex-1 py-3 bg-[#00529C] hover:bg-[#004788] text-white font-bold rounded-xl text-center shadow-md flex items-center justify-center gap-1"
                id="btn_go_chat_from_inventory"
              >
                <Sparkles className="w-4.5 h-4.5 shrink-0" />
                K-Rail 비서 연결 문의
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
