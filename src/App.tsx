/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Landmark, BookOpen, Map, Clock, AlertCircle, Monitor, Lock, Globe
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
  
  // 관리자 비밀번호 인증을 위한 전용 상태
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  
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
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans relative overflow-x-hidden" id="k_rail_land_buddy_app">
      
      {/* 🚀 최상단 프리미엄 오케스트레이션 헤더 (뷰포트 스위칭 토글 장착) */}
      <header className="glass-panel rounded-none border-b border-white/35 sticky top-0 z-40 backdrop-blur-2xl bg-white/70 shadow-xs" id="app_header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-18 flex items-center justify-between">
          
          {/* 로고 영역 */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-900/15 shrink-0 transition-transform hover:scale-105 duration-300">
              <Landmark className="w-6 h-6 transform rotate-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] bg-brand-blue/8 border border-brand-blue/15 text-brand-blue px-2 py-0.5 rounded-md font-bold leading-none tracking-wider">
                  K-Rail Space Asset
                </span>
                <span className="text-gray-300 text-xs">|</span>
                <span className="text-[10px] text-brand-green font-bold tracking-tight">공간 복지 통합 시스템</span>
              </div>
              <h1 className="font-sans font-extrabold text-gray-900 text-base leading-tight">
                KR-Land Buddy <span className="text-brand-blue font-semibold text-xs tracking-wide">(국가철도 공간복지)</span>
              </h1>
            </div>
          </div>

          {/* ⚡ 뷰 모드 듀얼 셀렉터 스위치 (글래스모피즘 슬라이더 효과 및 럭셔리 튜닝) */}
          <div className="bg-slate-200/50 p-1.5 rounded-2xl flex items-center gap-1.5 border border-white/50 backdrop-blur-md shadow-inner" id="viewmode_switcher">
            <button
              onClick={() => setViewMode('user')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                viewMode === 'user'
                  ? 'bg-white text-brand-blue shadow-md shadow-blue-950/5 scale-[1.03] hover:scale-[1.05]'
                  : 'text-gray-650 hover:text-gray-905 hover:bg-white/40'
              }`}
              id="switch_to_user"
            >
              <Globe className="w-4 h-4 text-brand-blue" />
              <span>📱 시민 웹 서비스</span>
            </button>
            <button
              onClick={() => {
                if (viewMode === 'user') {
                  setShowAdminAuthModal(true);
                  setAdminPassword('');
                  setAuthError(false);
                } else {
                  setViewMode('user');
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-brand-blue text-white shadow-md shadow-blue-950/20 scale-[1.03] hover:scale-[1.05]'
                  : 'text-gray-650 hover:text-gray-905 hover:bg-white/40'
              }`}
              id="switch_to_admin"
            >
              <Monitor className="w-4 h-4" />
              <span>💻 관리자 행정 포털</span>
            </button>
          </div>

          {/* 우측 공직 신뢰 시계 및 사용자 정보 */}
          <div className="hidden lg:flex items-center gap-4 text-xs" id="header_right_bar">
            {/* 실시간 시계 */}
            <div className="glass-card bg-white/60 border border-white/50 px-4 py-2 rounded-xl text-gray-600 font-mono text-center shrink-0 flex items-center gap-2 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-brand-blue animate-pulse" />
              {currentUtcTime} UTC
            </div>

            {/* 유저 프로필 배너 */}
            <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-green to-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-emerald-950/15 transition-transform hover:rotate-6">
                JD
              </div>
              <div className="text-left leading-tight">
                <div className="font-extrabold text-gray-800 tracking-tight">공간복지 가설처</div>
                <div className="text-[10px] text-gray-400 font-medium font-mono">자산 전담 주임 심사관</div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* 💻 1단계: 사용자 풀스크린 대시보드 웹앱 화면 */}
      {viewMode === 'user' && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:py-8 flex flex-col gap-6 animate-in fade-in duration-300" id="user_portal_container">
          
          {/* 사용자 상단 럭셔리 헤더 배너 */}
          <div className="bg-gradient-to-r from-brand-green-deep to-brand-blue-deep text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden" id="user_hero_banner">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] bg-white/15 border border-white/25 text-white px-3 py-1 rounded-full font-bold tracking-wider uppercase backdrop-blur-xs">
                  CITIZEN SERVICE PORTAL
                </span>
                <h2 className="text-xl md:text-3xl font-extrabold tracking-tight font-sans">
                  국유재산 철도 유휴공간 임대(렌탈) & 공간 복지 서비스
                </h2>
                <p className="text-xs md:text-sm text-blue-100 max-w-2xl font-sans leading-relaxed">
                  일반 시민들의 생활 자립 및 영농 소상공인 창업 지원을 위해, 국가 유휴부지의 공시지가 렌탈료 시뮬레이션 및 3D 디지털트윈 인프라 분석을 한 화면에서 스마트하게 지원합니다.
                </p>
              </div>
              <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl text-xs font-mono shrink-0 flex items-center gap-3 backdrop-blur-md">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="font-bold text-white tracking-wide">공공 표준 API 연동 활성</div>
                  <div className="text-[10px] text-emerald-250 font-medium">카카오 지적도/V월드 실시간 체인</div>
                </div>
              </div>
            </div>
          </div>

          {/* 세련된 가로형 서브 탭 메뉴바 (럭셔리 글래스모피즘) */}
          <div className="glass-panel p-2 border border-white/40 bg-white/60 shadow-xs flex flex-wrap items-center gap-2" id="user_sub_tabs">
            <button
              onClick={() => setMobileTab('assistant')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer tab-luxury ${
                mobileTab === 'assistant'
                  ? 'bg-brand-green-light/80 text-brand-green-deep border border-brand-green/20 shadow-2xs font-extrabold'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
              id="user_tab_assistant"
            >
              <Sparkles className="w-4 h-4 text-brand-green" />
              <span>🤖 랜드버디 AI 비서 (듀얼 패널 분석)</span>
            </button>
            
            <button
              onClick={() => setMobileTab('inventory')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer tab-luxury ${
                mobileTab === 'inventory'
                  ? 'bg-brand-green-light/80 text-brand-green-deep border border-brand-green/20 shadow-2xs font-extrabold'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
              id="user_tab_inventory"
            >
              <Map className="w-4 h-4 text-brand-green" />
              <span>🗺️ 전국 유휴부지 자산 검색</span>
            </button>

            <button
              onClick={() => setMobileTab('guide')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer tab-luxury ${
                mobileTab === 'guide'
                  ? 'bg-brand-green-light/80 text-brand-green-deep border border-brand-green/20 shadow-2xs font-extrabold'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
              id="user_tab_guide"
            >
              <BookOpen className="w-4 h-4 text-brand-green" />
              <span>📚 대부 절차 행정 가이드</span>
            </button>
          </div>

          {/* 사용자 웹앱 서브 콘텐츠 렌더링 영역 */}
          <div className="flex-1" id="user_tab_content">
            <AnimatePresence mode="wait">
              {mobileTab === 'assistant' && (
                <motion.div
                  key="assistant_user"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  <LandBuddyAssistant 
                    onApplySubmit={handleApplySubmit} 
                    activeParcelId={selectedParcelId}
                    onSelectParcel={(id) => {
                      setSelectedParcelId(id);
                    }}
                    parcels={parcels}
                    hideRightPanel={false}
                  />
                </motion.div>
              )}

              {mobileTab === 'inventory' && (
                <motion.div
                  key="inventory_user"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
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
                    hideUploader={true}
                  />
                </motion.div>
              )}

              {mobileTab === 'guide' && (
                <motion.div
                  key="guide_user"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  <GuideBook 
                    onGoToAssistant={() => setMobileTab('assistant')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </main>
      )}

      {/* 💻 2단계: 관리자 행정 포털 화면 (시원하고 넓은 데스크톱 뷰) */}
      {viewMode === 'admin' && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:py-8 flex flex-col gap-6 animate-in fade-in duration-300" id="admin_portal_container">
          
          {/* 어드민 상단 메인 안내 보드 */}
          <div className="bg-gradient-to-r from-brand-blue-deep to-blue-700 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden" id="admin_hero_banner">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] bg-white/15 border border-white/25 text-white px-3 py-1 rounded-full font-bold tracking-wider uppercase backdrop-blur-xs">
                  ADMINISTRATION SYSTEM
                </span>
                <h2 className="text-xl md:text-3xl font-extrabold tracking-tight font-sans">
                  국유재산 공간 복지 포털 관리 시스템
                </h2>
                <p className="text-xs md:text-sm text-blue-100 max-w-2xl font-sans leading-relaxed">
                  국가철도공단 및 캠코(온비드) 연동 국유재산 행정 전용 백오피스입니다. 
                  시민들이 모바일 챗봇으로 실시간 신청한 대부 계약 신청서를 교차 심사하고, 엑셀 및 PDF 공고문을 즉시 파싱 업로드할 수 있습니다.
                </p>
              </div>
              <div className="flex bg-white/10 border border-white/20 px-4 py-3 rounded-2xl text-xs font-mono shrink-0 items-center gap-3 backdrop-blur-md">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <div className="font-bold text-white tracking-wide">국유재산 통합포털 온-라인</div>
                  <div className="text-[10px] text-blue-200">김철수 심사관 권한 가동 중</div>
                </div>
              </div>
            </div>
          </div>

          {/* 어드민 전용 탭바 (서브 네비게이션 럭셔리 스타일링) */}
          <div className="glass-panel p-2 border border-white/40 bg-white/60 shadow-xs flex flex-wrap items-center gap-2" id="admin_sub_tabs">
            <button
              onClick={() => setAdminTab('dashboard')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 tab-luxury cursor-pointer ${
                adminTab === 'dashboard'
                  ? 'bg-brand-blue-light/85 text-brand-blue border border-brand-blue/15 shadow-2xs font-extrabold'
                  : 'text-gray-605 hover:bg-white/50 hover:text-gray-905'
              }`}
              id="admin_tab_dashboard"
            >
              <span>📊 성과 대시보드</span>
            </button>
            
            <button
              onClick={() => setAdminTab('review')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 tab-luxury cursor-pointer ${
                adminTab === 'review'
                  ? 'bg-brand-blue-light/85 text-brand-blue border border-brand-blue/15 shadow-2xs font-extrabold'
                  : 'text-gray-605 hover:bg-white/50 hover:text-gray-905'
              }`}
              id="admin_tab_review"
            >
              <span>📋 대부 신청 심사</span>
              {applications.filter(a => a.status === '심사중').length > 0 && (
                <span className="bg-rose-500 text-white font-mono text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse shadow-sm">
                  {applications.filter(a => a.status === '심사중').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminTab('upload')}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 tab-luxury cursor-pointer ${
                adminTab === 'upload'
                  ? 'bg-brand-blue-light/85 text-brand-blue border border-brand-blue/15 shadow-2xs font-extrabold'
                  : 'text-gray-650 hover:bg-white/50 hover:text-gray-905'
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
                      setViewMode('user');
                      setMobileTab('assistant');
                    }}
                    hideUploader={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      )}

      {/* 🔒 안전 보안 행정 주의문구 배너 (글래스 튜닝) */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full mt-4 shrink-0" id="legal_notice_bar">
        <div className="bg-amber-50/50 backdrop-blur-md border border-amber-250/30 rounded-2xl p-4.5 flex items-center justify-center gap-3 text-amber-950 text-[11px] font-semibold leading-relaxed shadow-3xs max-w-4xl mx-auto text-left sm:text-center">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <span>
            <strong>행정 보안 및 실시간 주의사항:</strong> 랜드버디는 표준 공공 데이터 연계를 기반으로 운영됩니다. 실제 대부 인가 및 인접 선로 안전 확인을 위해 관할 철도공단 지사 및 담당 지자체와 교차 협의를 거치십시오.
          </span>
        </div>
      </div>

      {/* 🔒 관리자 비밀번호 게이트 인증 모달 (초고급 글래스모피즘 다이어로그) */}
      <AnimatePresence>
        {showAdminAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/45 backdrop-blur-md px-4" id="admin_auth_modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/60 p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-5 text-center"
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
                <Lock className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans font-black text-gray-950 text-xl tracking-tight">🔒 관리자 행정 포털 보안 인증</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-sans px-2">
                  이 시스템은 국가철도공단 대부 신청 및 공간복지 심사 행정 전용 영역입니다. 
                  진입을 위해 비밀번호 **4자리**를 입력해 주십시오. (기본 비밀번호: 1111)
                </p>
              </div>

              {/* 비밀번호 인풋 필드 */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (adminPassword === '1111') {
                    setViewMode('admin');
                    setShowAdminAuthModal(false);
                    setAdminPassword('');
                    setAuthError(false);
                  } else {
                    setAuthError(true);
                    setAdminPassword('');
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <input
                    type="password"
                    maxLength={4}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value.replace(/[^0-9]/g, ''));
                      setAuthError(false);
                    }}
                    placeholder="••••"
                    className="w-full text-center text-3xl tracking-widest font-mono bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-inner"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-[11px] text-rose-600 font-bold flex items-center justify-center gap-1 mt-2.5 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>비밀번호가 일치하지 않습니다. (보안 로그 기록됨)</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminAuthModal(false);
                      setAdminPassword('');
                      setAuthError(false);
                    }}
                    className="flex-1 py-3.5 rounded-xl border border-gray-250 bg-white text-gray-700 hover:bg-slate-50 font-bold text-xs transition duration-200 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl btn-premium-luxury text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    관리자 인증
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* 푸터 */}
      <footer className="glass-panel rounded-none border-t border-white/20 bg-white/40 backdrop-blur-2xl py-6 text-xs text-gray-500 text-center font-sans space-y-4 mt-8 shrink-0" id="app_footer_nav">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/10">
              <Landmark className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-800">국가철도공단 KR-Land Buddy</span>
          </div>
          <div className="flex gap-4 font-semibold text-gray-650">
            <span className="hover:text-brand-blue transition cursor-pointer">이용약관</span>
            <span>•</span>
            <span className="hover:text-brand-blue transition cursor-pointer">개인정보처리방침</span>
            <span>•</span>
            <span className="hover:text-brand-blue transition cursor-pointer">공간복지 가설처 연락처</span>
          </div>
          <div className="font-semibold text-gray-400 font-mono">
            © 2026 Korea National Railway. All rights reserved.
          </div>
        </div>
      </footer>
      
    </div>
  );
}
