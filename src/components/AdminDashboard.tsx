/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, Landmark, Users, Calendar, 
  ChevronRight, TrendingUp, ShieldCheck, Download, ExternalLink, HelpCircle 
} from 'lucide-react';
import { LeaseApplication, LandParcel } from '../types';

interface DashboardProps {
  applications: LeaseApplication[];
  parcels: LandParcel[]; // 실시간 동적 유휴부지 자산 DB 추가 (실제 데이터 연동)
  onSelectApplication: (id: string) => void;
  onGoToTab: (tab: string) => void;
}

export default function AdminDashboard({ applications, parcels, onSelectApplication, onGoToTab }: DashboardProps) {
  
  // 1. 100% 실제 데이터 기반의 실시간 통계 계산 (가짜 하드코딩 데이터 전면 삭제!)
  const totalLandCount = parcels.length; // 실제 등록된 부지 수 그대로 연동!
  const activeLeasesCount = applications.filter(a => a.status === '승인').length; // 실제 승인된 건수 그대로!
  const pendingLeasesCount = applications.filter(a => a.status === '심사중' || a.status === '보완요청').length;
  
  // 실제 승인된 대부 신청서의 월 임대료 총합 계산 (오프셋 0원 출발!)
  const totalMonthlyRevenue = applications
    .filter(a => a.status === '승인')
    .reduce((sum, current) => sum + current.monthlyFee, 0);

  // 2. 📊 경작·소상공인 대부 수익 추이 (Revenue Trends) 최근 5개월 실데이터 기반 동적 가공
  const months = ['1월', '2월', '3월', '4월', '5월'];
  const dynamicMonthlyRevenue = months.map((monthStr, idx) => {
    const monthNum = idx + 1; // 1, 2, 3, 4, 5
    
    // 해당 월에 접수된 '승인' 상태의 실제 신청서 필터링 ( appliedDate: '2026-05-20' 포맷 파싱 )
    const monthApps = (applications || []).filter(app => {
      if (!app) return false;
      if (app.status !== '승인') return false;
      if (!app.appliedDate || typeof app.appliedDate !== 'string') return false;
      const dateParts = app.appliedDate.split('-');
      if (dateParts.length >= 2) {
        const appMonth = parseInt(dateParts[1], 10);
        return appMonth === monthNum;
      }
      return false;
    });

    const revenueSum = monthApps.reduce((sum, current) => sum + (current.monthlyFee || 0), 0);
    return {
      month: monthStr,
      revenue: revenueSum, // 원화 그대로 보존
      activeContracts: monthApps.length
    };
  });

  // 차트 스케일 계산 (동적 가변형 Y축 설정)
  const maxRevenueVal = Math.max(...dynamicMonthlyRevenue.map(d => d.revenue), 100000); // 최소 10만 원 기준선
  // Y축 4분할 단위 연산
  const yAxisMax = Math.ceil(maxRevenueVal / 100000) * 100000; // 10만 원 단위 올림

  // 3. 🎯 대부 용도 분포 (Lease Status) 실데이터 기반 실시간 구성비 통계
  const totalParcelsCount = (parcels || []).length || 1;
  
  const commercialCount = (parcels || []).filter(p => {
    if (!p || !p.recommendedUse || typeof p.recommendedUse !== 'string') return false;
    const use = p.recommendedUse;
    return use.includes('창업') || use.includes('푸드트럭') || 
           use.includes('카페') || use.includes('상업') || 
           use.includes('매장') || use.includes('플리마켓');
  }).length;

  const industrialCount = (parcels || []).filter(p => {
    if (!p || !p.recommendedUse || typeof p.recommendedUse !== 'string') return false;
    const use = p.recommendedUse;
    return use.includes('물류') || use.includes('야적장') || 
           use.includes('주차장') || use.includes('창고') ||
           use.includes('주차');
  }).length;

  const publicCount = Math.max(0, totalParcelsCount - commercialCount - industrialCount);

  // 구성비 백분율 구하기
  const commPct = Math.round((commercialCount / totalParcelsCount) * 100);
  const indPct = Math.round((industrialCount / totalParcelsCount) * 100);
  const pubPct = Math.max(0, 100 - commPct - indPct);

  const leaseStatusStats = [
    { 
      name: '상업용 (푸드트럭/카페 등)', 
      value: commPct, 
      color: '#fabd00' 
    },
    { 
      name: '산업/물류용 (야적장/주차장)', 
      value: indPct, 
      color: '#00E676' 
    },
    { 
      name: '공공/도시농업 (경작/복지)', 
      value: pubPct, 
      color: '#29B6F6' 
    }
  ];

  // 엑셀 내보내기용 가상 다운로드 기기 (실데이터 변환 다운로드!)
  const handleDownloadExcel = () => {
    const csvRows = [
      ["부지번호(Site ID)", "소재지(Address)", "면적(Area, ㎡)", "지목(Type)", "공시지가(Official Price)", "상태(Status)", "추천용도(Use)"]
    ];
    (parcels || []).forEach(p => {
      if (!p) return;
      csvRows.push([
        p.id || '', 
        (p.address || '').replace(/,/g, ''), 
        (p.area || 0).toString(), 
        p.landType || '', 
        (p.officialPrice || 0).toString(), 
        p.status || '', 
        (p.recommendedUse || '').replace(/,/g, '')
      ]);
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `K-Rail_Land_Inventory_RealDB_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-in fade-in duration-300" id="admin_dashboard_root">
      
      {/* ⚡ 최상단 통계 그리드 (실시간 100% 실데이터 연동 지표) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats_cards_grid">
        {/* 카드 1: 총 관리부지 */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-5 flex items-center justify-between" id="stat_card_total_land">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">TOTAL MANAGED LAND (총 관리부지)</span>
            <div className="text-2xl font-black text-[#00529C] font-mono">{totalLandCount.toLocaleString()} 필지</div>
            <span className="text-[10.5px] text-[#009C5E] font-bold flex items-center gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5 inline" /> 대표님이 심은 엑셀/PDF 실데이터 100% 반영
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#00529C] shadow-3xs shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* 카드 2: 활성 대부 계약 */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-5 flex items-center justify-between" id="stat_card_active_lease">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">ACTIVE LEASES (활성 대부건수)</span>
            <div className="text-2xl font-black text-gray-900 font-mono">{activeLeasesCount} 건</div>
            <span className="text-[10.5px] text-gray-500 block font-medium">행정 승인이 발효된 계약 실시간 통계</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 shadow-3xs shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* 카드 3: 월평균 대부료 */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-5 flex items-center justify-between" id="stat_card_revenue">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">MONTHLY REVENUE (월평균 대부료)</span>
            <div className="text-2xl font-black text-[#009C5E] font-mono">
              {totalMonthlyRevenue >= 10000 
                ? `₩${Math.round(totalMonthlyRevenue / 10000).toLocaleString()}만` 
                : `₩${totalMonthlyRevenue.toLocaleString()}원`}
            </div>
            <span className="text-[10.5px] text-[#009C5E] font-bold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
              <TrendingUp className="w-3.5 h-3.5 inline text-[#009C5E]" /> 결재 승인된 진짜 수익 지표
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#009C5E] shadow-3xs shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* 카드 4: 대기중 행정 심사 */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-5 flex items-center justify-between" id="stat_card_pending_apps">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">PENDING APPS (대기중 심사)</span>
            <div className="text-2xl font-black text-amber-600 font-mono">{pendingLeasesCount} 건</div>
            <span className="text-[10.5px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/50">
              실시간 접수되어 검토 중인 서류
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 shadow-3xs shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 📊 실시간 차트 분석 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts_layout_grid">
        {/* 차트 1: Revenue Trends */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6 lg:col-span-8 flex flex-col justify-between" id="chart_revenue_trends">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-sans font-bold text-[#020617] text-base leading-tight">Revenue Trends (실제 대부료 누적 수익 추이)</h3>
              <p className="text-xs text-gray-500">신청-심사-승인을 통과한 자산의 실시간 월별 매출액</p>
            </div>
            <div className="flex bg-gray-55 border border-gray-150 p-1 rounded-lg text-xs" id="chart_period_toggle">
              <span className="px-3 py-1.5 bg-white shadow-3xs rounded-md font-bold text-[#00529C]">실제 승인 데이터 연동</span>
            </div>
          </div>

          {/* 세련된 반응형 커스텀 SVG 차트 */}
          <div className="relative h-64 flex items-end justify-between px-4 pt-6 pb-2" id="custom_svg_revenue_chart">
            {/* 세로 눈금선 */}
            <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-gray-400 font-mono pointer-events-none pb-8 select-none">
              <div className="border-b border-gray-100 w-full text-right pr-2">₩{(yAxisMax / 10000).toLocaleString()}만</div>
              <div className="border-b border-gray-100 w-full text-right pr-2">₩{(yAxisMax * 0.75 / 10000).toLocaleString()}만</div>
              <div className="border-b border-gray-100 w-full text-right pr-2">₩{(yAxisMax * 0.5 / 10000).toLocaleString()}만</div>
              <div className="border-b border-gray-100 w-full text-right pr-2">₩{(yAxisMax * 0.25 / 10000).toLocaleString()}만</div>
            </div>

            {/* 실제 막대그래프 */}
            {dynamicMonthlyRevenue.map((item, idx) => {
              // Y축 상한 대비 높이 비율 계산
              const heightPct = yAxisMax > 0 ? (item.revenue / yAxisMax) * 85 : 0; 
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group z-10" id={`bar_${idx}`}>
                  {/* 말풍선 툴팁 */}
                  <div className="opacity-0 group-hover:opacity-100 transition duration-200 absolute bottom-[72%] bg-gray-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-md pointer-events-none z-20 leading-normal text-center">
                    <p className="font-bold text-emerald-400">{item.month} 매출</p>
                    <p className="font-mono mt-0.5">₩{item.revenue.toLocaleString()} 원 ({item.activeContracts}건)</p>
                  </div>
                  
                  {/* 컬러 막대 */}
                  <div 
                    style={{ height: `${heightPct > 0 ? heightPct : 3}%` }} // 데이터가 0원일 때도 최소 3% 높이로 시각선 보장
                    className={`w-12 bg-gradient-to-t ${
                      item.revenue > 0 
                        ? 'from-[#00529C] to-blue-400 hover:to-emerald-400' 
                        : 'from-gray-200 to-gray-300'
                    } rounded-t-lg transition-all duration-300 group-hover:shadow-sm`}
                  />
                  
                  {/* 가로 축 라벨 */}
                  <span className="text-xs font-bold text-gray-500 mt-2 font-sans">{item.month}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-center gap-6 text-[10.5px] text-gray-500 mt-2 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-gradient-to-t from-[#00529C] to-blue-400 rounded-md inline-block"></span>
              <span>월별 실제 대부료 수익 집계액</span>
            </div>
          </div>
        </div>

        {/* 차트 2: Lease Status 구성비 */}
        <div className="bg-[#003B73] rounded-3xl p-6 lg:col-span-4 text-white flex flex-col justify-between shadow-md" id="chart_lease_status_composition">
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-base leading-tight">Lease Status (실시간 대부 용도 분포)</h3>
            <p className="text-xs text-blue-100/80">현재 등록된 전체 가용자산의 용도별 비중</p>
          </div>

          <div className="my-6 space-y-4.5" id="stat_pie_representation">
            {leaseStatusStats.map((stat, idx) => (
              <div key={idx} className="space-y-1.5" id={`stat_bar_${idx}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white/95 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: stat.color }} />
                    {stat.name}
                  </span>
                  <span className="font-mono font-black text-[#fabd00]">{stat.value}%</span>
                </div>
                {/* 진행 게이지바 */}
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.value}%`, backgroundColor: stat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 실데이터 기반 지적 자산 엑셀 일괄 다운로드 엔진 연결 */}
          <button 
            onClick={handleDownloadExcel}
            className="w-full bg-white text-[#003B73] hover:bg-gray-55 text-xs font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 mt-2 active:scale-98"
            id="btn_download_full_report"
          >
            <Download className="w-4 h-4 text-[#003B73]" />
            실제 자산 DB 엑셀(.csv) 내려받기
          </button>
        </div>
      </div>

      {/* 📋 하단: 최근 대부 신청 및 심사 현황 */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-5" id="recent_applications_card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-sans font-bold text-[#020617] text-base leading-tight">Recent Lease Applications (실제 대부 신청서 접수 현황)</h3>
            <p className="text-xs text-gray-500">시민들이 랜드버디 모바일 비서를 통해 신청 접수한 실제 리스트</p>
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
        <div className="overflow-x-auto border border-gray-150 rounded-xl max-h-[300px] overflow-y-auto" id="dashboard_table_scroll">
          <table className="w-full text-xs text-left" id="dashboard_applications_table">
            <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 uppercase tracking-wide">
              <tr>
                <th className="p-3.5 font-semibold">신청인 (Applicant)</th>
                <th className="p-3.5 font-semibold">부지번호 (Parcel ID)</th>
                <th className="p-3.5 font-semibold">사업 목적 (Type/Purpose)</th>
                <th className="p-3.5 font-semibold">신청일자 (Date Applied)</th>
                <th className="p-3.5 font-semibold text-center">진행 상태 (Status)</th>
                <th className="p-3.5 font-semibold text-center">상세 검토 (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition duration-150 text-gray-700">
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900">{app.applicantName}</div>
                      <div className="text-[10px] text-gray-400 font-mono font-semibold">{app.entityType || '일반 시민'}</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#00529C]">
                      {app.parcelId}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-gray-800 truncate max-w-[200px]" title={app.purpose}>{app.purpose}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{app.address}</div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-500">
                      {app.appliedDate}
                    </td>
                    <td className="p-3.5 text-center">
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
                    <td className="p-3.5 text-center">
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-sans text-gray-400">
                    <p className="font-bold text-[#00529C] text-sm mb-1">접수된 대부 계약 신청서가 없습니다</p>
                    <p className="text-xs text-gray-500">시민용 모바일 앱 챗봇을 통해 가상 대부 신청을 하시면 이곳에 실시간 접수됩니다.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
