/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, Landmark, Users, Calendar, 
  ChevronRight, TrendingUp, ShieldCheck, Download, ExternalLink, HelpCircle 
} from 'lucide-react';
import { LeaseApplication } from '../types';
import { MONTHLY_REVENUE, LEASE_STATUS_STATS } from '../data';

interface DashboardProps {
  applications: LeaseApplication[];
  onSelectApplication: (id: string) => void;
  onGoToTab: (tab: string) => void;
}

export default function AdminDashboard({ applications, onSelectApplication, onGoToTab }: DashboardProps) {
  // 통계 계산
  const totalLandCount = 842; // 고정 및 추가분 반영
  const activeLeasesCount = 624 + applications.filter(a => a.status === '승인').length;
  const pendingLeasesCount = applications.filter(a => a.status === '심사중' || a.status === '보완요청').length;
  
  // 총 임대료 매출액 추산
  const totalMonthlyRevenue = applications
    .filter(a => a.status === '승인')
    .reduce((sum, current) => sum + current.monthlyFee, 120000000); // 기 설정분 1.2억 원 보장

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans" id="admin_dashboard_root">
      {/* 최상단 통계 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats_cards_grid">
        {/* 카드 1 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex items-center justify-between" id="stat_card_total_land">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">TOTAL MANAGED LAND (총 관리부지)</span>
            <div className="text-2xl font-bold text-[#00529C] font-mono">KR-842</div>
            <span className="text-[11px] text-[#006e1c] font-medium flex items-center gap-0.5">
              <span>+2.4%</span> 전년 대비 여가·공간복지 가용토지 확대
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#00529C]">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* 카드 2 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex items-center justify-between" id="stat_card_active_lease">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">ACTIVE LEASES (활성 대부건수)</span>
            <div className="text-2xl font-bold text-gray-900 font-mono">{activeLeasesCount}건</div>
            <span className="text-[11px] text-gray-400 block">전국 14개 철도 지역본부 연동</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* 카드 3 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex items-center justify-between" id="stat_card_revenue">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">MONTHLY REVENUE (월평균 대부료)</span>
            <div className="text-2xl font-bold text-[#006e1c] font-mono">₩{(totalMonthlyRevenue / 10000).toLocaleString()}만</div>
            <span className="text-[11px] text-[#006e1c] font-medium flex items-center gap-0.5">
              <span>+5.1%</span> 국유재산 활용 소상공인 복지환원 기준
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006e1c]">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* 카드 4 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex items-center justify-between" id="stat_card_pending_apps">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">PENDING APPS (대기중 심사)</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{pendingLeasesCount}건</div>
            <span className="text-[11px] text-amber-600 font-medium">실시간 신속 행정 처리율 98%</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 중간 차트 분석 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts_layout_grid">
        {/* 차트 1: Revenue Trends */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 lg:col-span-8 flex flex-col justify-between" id="chart_revenue_trends">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans font-bold text-[#020617] text-lg leading-tight">Revenue Trends (경작·소상공인 대부 수익 추이)</h3>
              <p className="text-xs text-gray-500">K-Rail 공간 자산 활용 극대화 추이 그래프</p>
            </div>
            <div className="flex bg-gray-150 p-1 rounded-lg text-xs" id="chart_period_toggle">
              <button className="px-3 py-1 bg-white shadow-xs rounded-md font-semibold text-gray-700">최근 5개월</button>
            </div>
          </div>

          {/* 세련된 반응형 커스텀 SVG 차트 */}
          <div className="relative h-64 flex items-end justify-between px-4 pt-6 pb-2" id="custom_svg_revenue_chart">
            {/* 세로 눈금선 */}
            <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-gray-400 font-mono pointer-events-none pb-8 select-none">
              <div className="border-b border-gray-100 w-full text-right pr-2">12,000만</div>
              <div className="border-b border-gray-100 w-full text-right pr-2">10,000만</div>
              <div className="border-b border-gray-100 w-full text-right pr-2">8,000만</div>
              <div className="border-b border-gray-100 w-full text-right pr-2">6,000만</div>
            </div>

            {/* 실제 막대그래프 */}
            {MONTHLY_REVENUE.map((item, idx) => {
              // 0 ~ 120 에 맞춰 높이 비율 계산 (최대 120M)
              const heightPct = (item.revenue / 120) * 85; 
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group z-10" id={`bar_${idx}`}>
                  {/* 말풍선 툴팁 */}
                  <div className="opacity-0 group-hover:opacity-100 transition duration-150 absolute bottom-[72%] bg-gray-900 text-white rounded px-2.5 py-1 text-xs font-semibold shadow-md pointer-events-none z-20">
                    {item.revenue}천만 원 (임대 {item.activeContracts}개)
                  </div>
                  
                  {/* 컬러 막대 */}
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className="w-12 bg-gradient-to-t from-[#00529C] to-blue-400 rounded-t-lg transition-all duration-300 group-hover:to-emerald-400 group-hover:shadow-sm"
                  />
                  
                  {/* 가로 축 라벨 */}
                  <span className="text-xs font-semibold text-gray-600 mt-2 font-sans">{item.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#00529C] rounded-md inline-block"></span>
              <span>월별 대부료 누적수익 (원 단위)</span>
            </div>
          </div>
        </div>

        {/* 차트 2: Lease Status 구성비 */}
        <div className="bg-[#003B73] rounded-2xl p-6 lg:col-span-4 text-white flex flex-col justify-between" id="chart_lease_status_composition">
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-lg">Lease Status (대부 용도 분포)</h3>
            <p className="text-xs text-blue-100/80">도시농업, 청년 창업, 공익 공간의 균형 공유</p>
          </div>

          <div className="my-6 space-y-4" id="stat_pie_representation">
            {LEASE_STATUS_STATS.map((stat, idx) => (
              <div key={idx} className="space-y-1.5" id={`stat_bar_${idx}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white/95 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: stat.color }} />
                    {stat.name}
                  </span>
                  <span className="font-mono font-bold text-[#fabd00]">{stat.value}%</span>
                </div>
                {/* 진행 게이지바 */}
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden font-sans">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.value}%`, backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onGoToTab('inventory')}
            className="w-full bg-white text-[#003B73] hover:bg-gray-50 text-xs font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 mt-2"
            id="btn_download_full_report"
          >
            <Download className="w-4 h-4 text-[#003B73]" />
            전체 유휴부지 자산 다운로드
          </button>
        </div>
      </div>

      {/* 하단: 최근 대부 신청 및 심사 현황 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5" id="recent_applications_card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-sans font-bold text-[#020617] text-base leading-tight">Recent Lease Applications (최근 대부 신청 심사 현황)</h3>
            <p className="text-xs text-gray-500">케이레일 랜드버디를 통해 접수된 공간 복지 신청자 실시간 리스트</p>
          </div>
          <button 
            onClick={() => onGoToTab('assistant')}
            className="text-xs font-bold text-[#00529C] hover:underline flex items-center gap-1"
            id="btn_view_all_apps"
          >
            새로 신청하기 <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 표 */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-[300px] overflow-y-auto" id="dashboard_table_scroll">
          <table className="w-full text-xs text-left" id="dashboard_applications_table">
            <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 uppercase tracking-wide">
              <tr>
                <th className="p-3 font-semibold">신청인 (Applicant)</th>
                <th className="p-3 font-semibold">부지번호 (Parcel ID)</th>
                <th className="p-3 font-semibold">사업 목적 (Type/Purpose)</th>
                <th className="p-3 font-semibold">신청일자 (Date Applied)</th>
                <th className="p-3 font-semibold text-center">진행 상태 (Status)</th>
                <th className="p-3 font-semibold text-center">상세 검토 (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition duration-150 text-gray-700">
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{app.applicantName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{app.entityType || '일반 시민'}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-[#00529C]">
                    {app.parcelId}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-gray-800 truncate max-w-[200px]" title={app.purpose}>{app.purpose}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{app.address}</div>
                  </td>
                  <td className="p-3 font-mono text-gray-500">
                    {app.appliedDate}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border ${
                      app.status === '승인' 
                        ? 'bg-emerald-50 text-[#006e1c] border-emerald-200' 
                        : app.status === '보완요청' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : app.status === '반려' 
                        ? 'bg-red-50 text-red-600 border-red-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {app.status === '승인' ? '심사승인' : app.status === '보완요청' ? '보완요청' : app.status === '반려' ? '심사반려' : '심사진행'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => onSelectApplication(app.id)}
                      className="text-gray-400 hover:text-[#00529C] p-1.5 hover:bg-gray-100 rounded-lg transition"
                      title="상세내역 심사"
                      id={`btn_review_${app.id}`}
                    >
                      <ExternalLink className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
