/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, Landmark, CheckSquare, BookOpen, 
  Map, UserCheck, RefreshCw, AlertCircle, Clock, Heart, Menu, X, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaseApplication } from './types';
import { INITIAL_APPLICATIONS } from './data';
import LandBuddyAssistant from './components/LandBuddyAssistant';
import AdminDashboard from './components/AdminDashboard';
import ApplicationReview from './components/ApplicationReview';
import InventoryManagement from './components/InventoryManagement';
import GuideBook from './components/GuideBook';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('assistant');
  const [applications, setApplications] = useState<LeaseApplication[]>(() => {
    const saved = localStorage.getItem('k_rail_land_buddy_apps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved applications', e);
      }
    }
    return INITIAL_APPLICATIONS;
  });

  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [selectedReviewAppId, setSelectedReviewAppId] = useState<string>('APP-2026-001');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [currentUtcTime, setCurrentUtcTime] = useState<string>('2026-05-27 04:46:00'); // 기본 표기 및 동적 동기화

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

  // 대부 신청 접수 콜백
  const handleApplySubmit = (newApp: LeaseApplication) => {
    setApplications((prev) => [newApp, ...prev]);
    // 자동으로 대시보드로 이동하진 않고 챗봇 흐름 유지하도록 하며, 필요 시 관리자가 검토 가능하게 심사 ID 셋
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

  // 탭 네비게이션 아이템들
  const navItems = [
    { id: 'assistant', label: '🤖 랜드버디 비서', desc: '시민 맞춤형 렌탈 및 시뮬레이션' },
    { id: 'dashboard', label: '📊 성과 대시보드', desc: '공공부지 대부 통계 분석' },
    { id: 'review', label: '📋 대부 신청 심사', desc: '신청서류 적합성 교차 심사록' },
    { id: 'inventory', label: '🗺️ 부지 인벤토리', desc: '전국 철도 유휴부지 검색기' },
    { id: 'guide', label: '📖 랜드 가이드북', desc: '초간단 대부요율 및 규제 안내서' }
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans relative overflow-x-hidden" id="k_rail_land_buddy_app">
      {/* 최상단 공공 브랜드 헤더 */}
      <header className="glass-panel border-b border-white/20 sticky top-0 z-40 backdrop-blur-xl" id="app_header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 철도공단 모티브 마운트 */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00529C] to-[#0074db] flex items-center justify-center text-white shadow-md shadow-blue-900/10 shrink-0">
              <Landmark className="w-5.5 h-5.5 transform rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] bg-gradient-to-r from-[#00529C]/10 to-[#009C5E]/10 border border-[#00529C]/20 text-[#00529C] px-1.5 py-0.5 rounded-md font-bold leading-none">
                  K-Rail Space Buddy
                </span>
                <span className="text-gray-300 text-xs">|</span>
                <span className="text-[10px] text-[#009C5E] font-bold tracking-tight">공간 복지 비서</span>
              </div>
              <h1 className="font-sans font-bold text-gray-900 text-base leading-tight">
                K-Rail Land-Buddy <span className="text-[#00529C] font-semibold text-xs tracking-wide">(케이레일 랜드버디)</span>
              </h1>
            </div>
          </div>

          {/* 데스크탑 메인 네비게이션 */}
          <nav className="hidden xl:flex items-center gap-2" id="desktop_tab_nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === item.id 
                    ? 'bg-[#00529C] text-white shadow-md shadow-blue-900/15 translate-y-[-1px]' 
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 border border-transparent hover:border-white/40'
                }`}
                id={`tab_trigger_${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* 우측 공직 신뢰 시계 및 유저 프로필 */}
          <div className="hidden md:flex items-center gap-4 text-xs" id="header_right_bar">
            {/* 실시간 시계 */}
            <div className="glass-card border border-white/40 px-3.5 py-1.5 rounded-xl text-gray-600 font-mono text-center shrink-0 flex items-center gap-1.5">
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
                <div className="text-[10px] text-gray-400">김철수 심사관</div>
              </div>
            </div>
          </div>

          {/* 모바일 햄버거 메뉴 */}
          <div className="xl:hidden flex items-center gap-2">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-white/60 rounded-xl glass-card"
              id="mobile_menu_trigger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 모바일 전체화면 네비 슬라이드 */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200 py-3 px-4 space-y-2 animate-in slide-in-from-top duration-200" id="mobile_menu_dropdown">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex flex-col ${
                  activeTab === item.id 
                    ? 'bg-[#00529C] text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                id={`mobile_tab_${item.id}`}
              >
                <span>{item.label}</span>
                <span className={`text-[10px] font-normal ${activeTab === item.id ? 'text-blue-200' : 'text-gray-400'}`}>
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 메인 비주얼 공지 (시각적 따스함 'Infrastructural Warmth') */}
      <div className="bg-white border-b border-gray-100 py-3" id="top_announcement">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5 font-sans">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="font-semibold text-gray-900">철도 유휴공간 안내:</span>
            <span>선로 인접 잡종지 및 경작 가능 국유지 시범구역 정비 완료. 즉시 대부율 감면 혜택 적용!</span>
          </div>
          <div className="text-gray-500 text-[10.5px] font-medium font-sans">
            국가철도공단은 소상공인 및 소시민의 공간 자산 자립을 전격 장려합니다.
          </div>
        </div>
      </div>

      {/* 메인 바디 컨텐츠 */}
      <main className="flex-1 p-4 md:p-6 lg:py-8 relative" id="main_body_content">
        <AnimatePresence mode="wait">
          {/* 탭 분기점 */}
          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <LandBuddyAssistant 
                onApplySubmit={handleApplySubmit} 
                activeParcelId={selectedParcelId}
                onSelectParcel={(id) => {
                  setSelectedParcelId(id);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <AdminDashboard 
                applications={applications}
                onSelectApplication={(id) => {
                  setSelectedReviewAppId(id);
                  setActiveTab('review');
                }}
                onGoToTab={(tab) => {
                  setActiveTab(tab);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <ApplicationReview 
                applicationId={selectedReviewAppId}
                applications={applications}
                onUpdateStatus={handleUpdateStatus}
                onBack={() => setActiveTab('dashboard')}
              />
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <InventoryManagement 
                onSelectParcel={(id) => {
                  setSelectedParcelId(id);
                }}
                onGoToAssistant={() => {
                  setActiveTab('assistant');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <GuideBook 
                onGoToAssistant={() => setActiveTab('assistant')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 푸터 */}
      <footer className="glass-panel border-t border-white/20 backdrop-blur-xl py-6 text-xs text-gray-500 text-center font-sans space-y-4 mt-8" id="app_footer_nav">
        {/* 법적 권장 안내문 */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-center gap-3 text-amber-950 text-[11px] font-medium leading-relaxed max-w-4xl mx-auto text-left sm:text-center shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>행정 주의사항:</strong> 본 서비스의 결과는 오픈 API 표준 데이터 기반 가이딩이며, 정식 신청 전 <strong>반려 규정 예방을 위해 필지 주변 선로 시설 보호 등 공간 규제를 해당 지자체 혹은 국가철도공단 지사에서 꼭 크로스체크</strong> 하시기 바랍니다.
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
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

