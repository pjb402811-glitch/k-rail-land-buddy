/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, Landmark, CheckSquare, BookOpen, 
  Map, UserCheck, RefreshCw, AlertCircle, Clock, Heart, Menu, X, ArrowRight,
  Smartphone, Monitor, Layers, FileSpreadsheet, Lock, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaseApplication, LandParcel } from './types';
import { INITIAL_APPLICATIONS, LAND_PARCELS } from './data';
import LandBuddyAssistant from './components/LandBuddyAssistant';
import AdminDashboard from './components/AdminDashboard';
import ApplicationReview from './components/ApplicationReview';
import InventoryManagement from './components/InventoryManagement';
import GuideBook from './components/GuideBook';

export default function App() {
  // viewMode: 'user' (시민 모바일 앱) vs 'admin' (관리자 행정 포털)
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  
  // 모바일 앱 내부의 바텀 탭 상태: 'assistant' | 'inventory' | 'guide'
  const [mobileTab, setMobileTab] = useState<string>('assistant');
  
  // 관리자 포털 내부의 서브 탭 상태: 'dashboard' | 'review' | 'upload'
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  const [parcels, setParcels] = useState<LandParcel[]>(() => {
    const saved = localStorage.getItem('k_rail_land_buddy_parcels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 데이터 유효성 검증: 필수 키들이 있는지 방어적으로 확인
          const first = parsed[0];
          if (first && first.id && first.address) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved parcels', e);
      }
    }
    return LAND_PARCELS;
  });

  const [applications, setApplications] = useState<LeaseApplication[]>(() => {
    const saved = localStorage.getItem('k_rail_land_buddy_apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 구버전 데이터 검출 및 강제 마이그레이션 방어선
          // 옛날 데이터(appliedDate가 없거나 structure가 깨진 것) 감지 시, 구버전은 비우고 최신 데이터로 복원
          const hasOutdated = parsed.some(app => !app || !app.id || !app.appliedDate || typeof app.monthlyFee !== 'number');
          if (hasOutdated) {
            console.warn('구버전 대부 신청서 데이터 포맷 감지. 강제 마이그레이션을 위해 초기화합니다.');
            localStorage.removeItem('k_rail_land_buddy_apps');
            return INITIAL_APPLICATIONS;
          }
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved applications', e);
      }
    }
    return INITIAL_APPLICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('k_rail_land_buddy_parcels', JSON.stringify(parcels));
  }, [parcels]);

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [selectedReviewAppId, setSelectedReviewAppId] = useState<string>('APP-2026-001');
  const [currentUtcTime, setCurrentUtcTime] = useState<string>('2026-05-27 12:33:00'); 

  useEffect(() => {
    localStorage.setItem('k_rail_land_buddy_apps', JSON.stringify(applications));
  }, [applications]);

  // 실시간 시계 작동
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const format = now.toISOString().replace('T', ' ').substring(0, 19);
      setCurrentUtcTime(format);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 엑셀 일괄 업로드 콜백
  const handleImportParcels = (newParcels: LandParcel[]) => {
    setParcels(prev => [...newParcels, ...prev]);
  };

  // 대부 신청 접수 콜백
  const handleApplySubmit = (newApp: LeaseApplication) => {
    setApplications((prev) => [newApp, ...prev]);
    setSelectedReviewAppId(newApp.id);
  };

  // 행정 처분 조치 콜백 (승인, 반려, 보완요청)
  const handleUpdateStatus = (
    id: string, 
    newStatus: '심사중' | '승인' | '보완요청' | '반려', 
    timelineLog: string
  ) => {
    setApplications((prev) => 
      prev.map((app) => {
        if (app.id === id) {
          const timestamp = new Date().toLocaleString('ko-KR');
          const actor = newStatus === '승인' ? '국가철도공단 이사장' : '김철수 주임 심사관';
          return {
            ...app,
            status: newStatus,
            timeline: [
              ...(app.timeline || []),
              {
                status: `${newStatus} 처분`,
                date: timestamp,
                description: timelineLog,
                actor
              }
            ]
          };
        }
        return app;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans relative overflow-x-hidden" id="k_rail_land_buddy_app">
      
      {/* 🚀 최상단 프리미엄 오케스트레이션 헤더 (뷰포트 스위칭 토글 장착) */}
      <header className="glass-panel border-b border-white/20 sticky top-0 z-40 backdrop-blur-xl bg-white/70 shadow-xs" id="app_header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* 로고 영역 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00529C] to-[#0074db] flex items-center justify-center text-white shadow-md shadow-blue-900/10 shrink-0">
              <Landmark className="w-5.5 h-5.5 transform rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] bg-[#00529C]/10 border border-[#00529C]/20 text-[#00529C] px-1.5 py-0.5 rounded-md font-bold leading-none">
                  K-Rail Space Asset
                </span>
                <span className="text-gray-300 text-xs">|</span>
                <span className="text-[10px] text-[#009C5E] font-bold tracking-tight">공간 복지 통합 시스템</span>
              </div>
              <h1 className="font-sans font-bold text-gray-900 text-base leading-tight">
                K-Rail Land-Buddy <span className="text-[#00529C] font-semibold text-xs tracking-wide">(케이레일 랜드버디)</span>
              </h1>
            </div>
          </div>

          {/* ⚡ 뷰 모드 듀얼 셀렉터 스위치 (글래스모피즘 슬라이더 효과) */}
          <div className="bg-gray-200/80 p-1.5 rounded-2xl flex items-center gap-1 border border-white/40 shadow-inner" id="viewmode_switcher">
            <button
              onClick={() => setViewMode('user')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'user'
                  ? 'bg-white text-[#00529C] shadow-sm shadow-blue-900/10 scale-[1.03]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
              }`}
              id="switch_to_user"
            >
              <Smartphone className="w-4 h-4 text-[#00529C]" />
              <span>📱 시민 모바일 앱</span>
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'admin'
                  ? 'bg-[#00529C] text-white shadow-sm shadow-blue-900/10 scale-[1.03]'
                  : 'text-gray-650 hover:text-gray-900 hover:bg-white/40'
              }`}
              id="switch_to_admin"
            >
              <Monitor className="w-4 h-4" />
              <span>💻 관리자 행정 포털</span>
            </button>
          </div>

          {/* 우측 공직 신뢰 시계 및 사용자 정보 */}
          <div className="hidden md:flex items-center gap-4 text-xs" id="header_right_bar">
            {/* 실시간 시계 */}
            <div className="glass-card bg-white/60 border border-white/50 px-3.5 py-1.5 rounded-xl text-gray-600 font-mono text-center shrink-0 flex items-center gap-1.5 shadow-3xs">
              <Clock className="w-3.5 h-3.5 text-[#00529C] animate-pulse" />
              {currentUtcTime} UTC
            </div>

            {/* 유저 프로필 배너 */}
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-[#009C5E] to-[#05be73] text-white font-bold flex items-center justify-center text-xs shadow-md shadow-emerald-950/15">
                JD
              </div>
              <div className="text-left leading-tight">
                <div className="font-bold text-gray-800">공간복지 가설처</div>
                <div className="text-[10px] text-gray-400">자산 전담 주임 심사관</div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* 📱 1단계: 사용자 모바일 앱 화면 (스마트폰 기기 뷰 렌더링) */}
      {viewMode === 'user' && (
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:py-8 animate-in fade-in duration-300 relative" id="user_mobile_container">
          
          {/* 배경 장식 원 (Aesthetic Background Elements) */}
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-blue-100/40 blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-emerald-100/30 blur-3xl pointer-events-none -z-10" />

          {/* 📱 프리미엄 스마트폰 디바이스 프레임 */}
          <div 
            className="relative w-full max-w-[420px] h-[840px] rounded-[52px] border-[14px] border-gray-900 bg-gray-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden transition-all duration-300"
            id="mobile_device_frame"
          >
            {/* 스마트폰 상단 스피커 & 전면 카메라 (다이내믹 노치 아일랜드) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-50 flex items-center justify-center gap-1.5 shadow-sm">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-950/90 border border-gray-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
              </div>
              <div className="w-10 h-1 bg-gray-950/80 rounded-full" />
            </div>

            {/* 스마트폰 내부 액정 화면 (액정 규격 내 독립 스크롤 및 가로 스크롤 완전 방지 적용) */}
            <div className="flex-1 bg-[#F4F7F9] overflow-y-auto overflow-x-hidden flex flex-col relative pt-7 scrollbar-thin select-none" id="mobile_liquid_screen">
              
              {/* 모바일 상단 폰 전용 노티바 (Status Bar) */}
              <div className="absolute top-0 inset-x-0 h-7 px-6 flex items-center justify-between text-[10.5px] font-bold text-gray-700 z-40 bg-[#F4F7F9]/80 backdrop-blur-xs select-none">
                <span className="font-mono">9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] bg-emerald-500/20 text-[#006e1c] border border-emerald-500/30 px-1 rounded-sm">5G</span>
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* 모바일 내용 영역 */}
              <div className="flex-1 flex flex-col overflow-x-hidden">
                <AnimatePresence mode="wait">
                  {mobileTab === 'assistant' && (
                    <motion.div
                      key="assistant_mobile"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="flex-1 flex flex-col"
                    >
                      <LandBuddyAssistant 
                        onApplySubmit={handleApplySubmit} 
                        activeParcelId={selectedParcelId}
                        onSelectParcel={(id) => {
                          setSelectedParcelId(id);
                        }}
                        parcels={parcels}
                        hideRightPanel={true}
                      />
                    </motion.div>
                  )}

                  {mobileTab === 'inventory' && (
                    <motion.div
                      key="inventory_mobile"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="p-4"
                    >
                      <InventoryManagement 
                        parcels={parcels}
                        onImportParcels={handleImportParcels}
                        onSelectParcel={(id) => {
                          setSelectedParcelId(id);
                        }}
                        onGoToAssistant={() => {
                          setMobileTab('assistant');
                        }}
                        hideUploader={true} // 유저 모드에서는 엑셀/PDF 업로더 숨기기!
                      />
                    </motion.div>
                  )}

                  {mobileTab === 'guide' && (
                    <motion.div
                      key="guide_mobile"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="p-4"
                    >
                      <GuideBook 
                        onGoToAssistant={() => setMobileTab('assistant')}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 📱 모바일 바텀 탭 네비게이션 바 (Bottom Navigation TabBar) */}
            <nav className="bg-white border-t border-gray-150 py-2.5 px-3 flex justify-around items-center shrink-0 z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]" id="mobile_bottom_tabbar">
              <button
                onClick={() => setMobileTab('assistant')}
                className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10.5px] font-bold transition duration-200 border-t-2 ${
                  mobileTab === 'assistant' 
                    ? 'text-[#00529C] border-[#00529C] bg-blue-50/30' 
                    : 'text-gray-400 border-transparent hover:text-gray-700'
                }`}
                id="mobile_tab_assistant"
              >
                <Sparkles className="w-5 h-5" />
                <span>랜드버디 비서</span>
              </button>
              
              <button
                onClick={() => setMobileTab('inventory')}
                className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10.5px] font-bold transition duration-200 border-t-2 ${
                  mobileTab === 'inventory' 
                    ? 'text-[#00529C] border-[#00529C] bg-blue-50/30' 
                    : 'text-gray-400 border-transparent hover:text-gray-700'
                }`}
                id="mobile_tab_inventory"
              >
                <Map className="w-5 h-5" />
                <span>유휴부지 검색</span>
              </button>

              <button
                onClick={() => setMobileTab('guide')}
                className={`flex-1 flex flex-col items-center gap-1 py-1 text-[10.5px] font-bold transition duration-200 border-t-2 ${
                  mobileTab === 'guide' 
                    ? 'text-[#00529C] border-[#00529C] bg-blue-50/30' 
                    : 'text-gray-400 border-transparent hover:text-gray-700'
                }`}
                id="mobile_tab_guide"
              >
                <BookOpen className="w-5 h-5" />
                <span>랜드 가이드</span>
              </button>
            </nav>

            {/* 홈스크린 인디케이터 바 (iPhone Home Bar Detail) */}
            <div className="bg-white pb-2.5 flex items-center justify-center shrink-0 z-45" id="mobile_home_bar">
              <div className="w-32 h-1 bg-gray-900 rounded-full" />
            </div>

          </div>
        </main>
      )}

      {/* 💻 2단계: 관리자 행정 포털 화면 (시원하고 넓은 데스크톱 뷰) */}
      {viewMode === 'admin' && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:py-8 flex flex-col gap-6 animate-in fade-in duration-300" id="admin_portal_container">
          
          {/* 어드민 상단 메인 안내 보드 */}
          <div className="bg-gradient-to-r from-[#00529C] to-[#0074db] text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden" id="admin_hero_banner">
            {/* 장식용 그리드 패턴 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2.5 py-1 rounded-full font-bold tracking-wide uppercase">
                  ADMINISTRATION SYSTEM
                </span>
                <h2 className="text-xl md:text-2xl font-bold font-sans">
                  국유재산 공간 복지 포털 관리 시스템
                </h2>
                <p className="text-xs text-blue-100 max-w-2xl font-sans leading-relaxed">
                  국가철도공단 및 캠코(온비드) 연동 국유재산 행정 전용 백오피스입니다. 
                  시민들이 모바일 챗봇으로 실시간 신청한 대부 계약 신청서를 교차 심사하고, 엑셀 및 PDF 공고문을 즉시 파싱 업로드할 수 있습니다.
                </p>
              </div>
              <div className="flex bg-white/10 border border-white/20 px-4 py-3 rounded-2xl text-xs font-mono shrink-0 items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="font-bold text-white">국유재산 통합포털 온-라인</div>
                  <div className="text-[10px] text-blue-200">김철수 심사관 권한 가동 중</div>
                </div>
              </div>
            </div>
          </div>

          {/* 어드민 전용 탭바 (서브 네비게이션) */}
          <div className="bg-white rounded-2xl p-2.5 border border-gray-150 shadow-3xs flex flex-wrap items-center gap-2" id="admin_sub_tabs">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                adminTab === 'dashboard'
                  ? 'bg-[#E1F0FF] text-[#00529C]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="admin_tab_dashboard"
            >
              <span>📊 성과 대시보드</span>
            </button>
            
            <button
              onClick={() => setAdminTab('review')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                adminTab === 'review'
                  ? 'bg-[#E1F0FF] text-[#00529C]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="admin_tab_review"
            >
              <span>📋 대부 신청 심사</span>
              {applications.filter(a => a.status === '심사중').length > 0 && (
                <span className="bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {applications.filter(a => a.status === '심사중').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('upload')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                adminTab === 'upload'
                  ? 'bg-[#E1F0FF] text-[#00529C]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="admin_tab_upload"
            >
              <span>📥 자산 일괄 업로드 (CSV/PDF)</span>
            </button>
          </div>

          {/* 어드민 탭 분기점 렌더링 */}
          <div className="flex-1" id="admin_tab_content">
            <AnimatePresence mode="wait">
              {adminTab === 'dashboard' && (
                <motion.div
                  key="dashboard_admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <AdminDashboard 
                    applications={applications}
                    parcels={parcels}
                    onSelectApplication={(id) => {
                      setSelectedReviewAppId(id);
                      setAdminTab('review');
                    }}
                    onGoToTab={(tab) => {
                      if (tab === 'review' || tab === 'dashboard') {
                        setAdminTab(tab);
                      } else if (tab === 'inventory') {
                        setAdminTab('upload');
                      }
                    }}
                  />
                </motion.div>
              )}

              {adminTab === 'review' && (
                <motion.div
                  key="review_admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <ApplicationReview 
                    applicationId={selectedReviewAppId}
                    applications={applications}
                    onUpdateStatus={handleUpdateStatus}
                    onBack={() => setAdminTab('dashboard')}
                  />
                </motion.div>
              )}

              {adminTab === 'upload' && (
                <motion.div
                  key="upload_admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <InventoryManagement 
                    parcels={parcels}
                    onImportParcels={handleImportParcels}
                    onSelectParcel={(id) => {
                      setSelectedParcelId(id);
                    }}
                    onGoToAssistant={() => {
                      // 모바일 탭으로 전환하고 모바일 뷰로 전환 유도 알림 표시
                      setViewMode('user');
                      setMobileTab('assistant');
                    }}
                    hideUploader={false} // 어드민 업로드 탭에서는 업로더(CSV, PDF 스캐너)가 시원하게 노출되도록 설정!
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      )}

      {/* 🔒 안전 보안 행정 주의문구 배너 */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full mt-4 shrink-0" id="legal_notice_bar">
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-center gap-3 text-amber-950 text-[11px] font-medium leading-relaxed shadow-3xs max-w-4xl mx-auto text-left sm:text-center">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>행정 보안 및 실시간 주의사항:</strong> 랜드버디는 표준 공공 데이터 연계를 기반으로 운영됩니다. 실제 대부 인가 및 인접 선로 안전 확인을 위해 관할 철도공단 지사 및 담당 지자체와 교차 협의를 거치십시오.
          </span>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="glass-panel border-t border-white/20 bg-white/50 backdrop-blur-xl py-6 text-xs text-gray-500 text-center font-sans space-y-4 mt-8 shrink-0" id="app_footer_nav">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#00529C]" />
            <span className="font-bold text-gray-800">국가철도공단 K-Rail 랜드버디</span>
          </div>
          <div className="flex gap-4 font-semibold text-gray-600">
            <span className="hover:text-[#00529C] transition cursor-pointer">이용약관</span>
            <span>•</span>
            <span className="hover:text-[#00529C] transition cursor-pointer">개인정보처리방침</span>
            <span>•</span>
            <span className="hover:text-[#00529C] transition cursor-pointer">공간복지 가설처 연락처</span>
          </div>
          <div className="font-medium text-gray-400 font-mono">
            © 2026 Korea National Railway. All rights reserved.
          </div>
        </div>
      </footer>
      
    </div>
  );
}
