/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, Calendar, Compass, Paperclip, CheckSquare, 
  User, Check, AlertTriangle, XSquare, Plus, Clock, ArrowLeft, Download, Send 
} from 'lucide-react';
import { LeaseApplication } from '../types';

interface ReviewProps {
  applicationId: string;
  applications: LeaseApplication[];
  onUpdateStatus: (id: string, newStatus: '심사중' | '승인' | '보완요청' | '반려', timelineLog: string) => void;
  onBack: () => void;
}

export default function ApplicationReview({ applicationId, applications, onUpdateStatus, onBack }: ReviewProps) {
  const currentApp = applications.find(a => a.id === applicationId);
  const [inputText, setInputText] = useState('');

  if (!currentApp) {
    return (
      <div className="glass-panel p-8 text-center max-w-2xl mx-auto space-y-4 shadow-xl" id="review_not_found">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
        <h3 className="text-lg font-sans font-black text-gray-950">심사 대상을 찾을 수 없습니다</h3>
        <p className="text-gray-500 text-sm font-medium">해당 접수 서류가 만료되었거나 삭제되었습니다.</p>
        <button 
          onClick={onBack}
          className="btn-premium-luxury text-white font-sans text-xs font-bold px-5 py-3 cursor-pointer"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  const handleAction = (status: '승인' | '보완요청' | '반려') => {
    let logMsg = '';
    if (status === '승인') {
      logMsg = '국유재산 대부 적격성 및 철도안전보호구역 내 행점 적합성 심사를 만점으로 통과하였습니다. 대부 승인이 확정되었습니다.';
    } else if (status === '보완요청') {
      logMsg = inputText.trim() || '첨부 부지 이용 계획서의 차량 진출입 조감도 및 철도방음벽 안전펜스 관련 치수 확인 서류의 보완이 필요합니다.';
    } else {
      logMsg = inputText.trim() || '신청한 사업 목적이 선로보호법에 규정된 위험 임시저장 용도에 해당하므로 대부가 최종 반려 처리되었습니다.';
    }

    onUpdateStatus(currentApp.id, status, logMsg);
    setInputText('');
  };

  const downloadFile = (fileName: string) => {
    const element = document.createElement("a");
    const file = new Blob([`K-Rail Land-Buddy Verification for document ${fileName}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans" id="application_review_root">
      {/* 상단 네비 바 */}
      <div className="flex items-center justify-between" id="review_nav_bar">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-650 hover:text-brand-blue font-extrabold transition-colors cursor-pointer group"
          id="btn_back_to_dashboard"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          신청 목록 대시보드로 돌아가기
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest font-mono">APP ID</span>
          <span className="bg-brand-blue-light/75 border border-brand-blue/15 text-brand-blue-deep font-mono text-xs font-black px-3 py-1 rounded-xl shadow-inner">
            {currentApp.id}
          </span>
          <span className={`text-xs font-bold px-3.5 py-1 rounded-full border shadow-3xs uppercase tracking-wide ${
            currentApp.status === '승인' 
              ? 'bg-brand-green-light text-brand-green-deep border-emerald-250' 
              : currentApp.status === '보완요청' 
              ? 'bg-amber-50 text-amber-800 border-amber-200' 
              : currentApp.status === '반려' 
              ? 'bg-rose-50/80 text-rose-700 border-rose-200' 
              : 'bg-brand-blue-light text-brand-blue-deep border-brand-blue/20'
          }`}>
            {currentApp.status === '승인' ? '심사승인' : currentApp.status === '보완요청' ? '보완요청' : currentApp.status === '반려' ? '심사반려' : '심사 진행 중'}
          </span>
        </div>
      </div>

      {/* 실시간 세부정보 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="review_details_grid">
        {/* 좌측 메인 신청서 내역 */}
        <div className="lg:col-span-8 space-y-6" id="applicantion_main_sheet">
          <div className="glass-card p-6 space-y-6 rounded-3xl" id="sheet_card_top">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">SUBMITTED ON {currentApp.appliedDate} • STATION ZONE</span>
                <h1 className="text-xl font-sans font-black text-gray-950 mt-1 tracking-tight">{currentApp.purpose}</h1>
                <p className="text-xs text-gray-500 font-medium mt-1">{currentApp.address}</p>
              </div>
              
              {/* 월 대부료 우측 배너 */}
              <div className="bg-gradient-to-br from-brand-green-light to-emerald-100/30 border border-brand-green/20 rounded-2xl p-4.5 text-right shadow-xs hover:shadow-sm transition-transform duration-300">
                <span className="text-[10px] font-extrabold text-brand-green tracking-widest block uppercase">ESTIMATED FEE</span>
                <span className="text-lg font-black text-brand-green-deep block font-mono mt-0.5">
                  ₩{currentApp.monthlyFee.toLocaleString()} <span className="text-xs font-semibold">/ mo</span>
                </span>
                <span className="text-[10px] text-brand-green-deep/75 font-semibold">연 환산 약 {currentApp.yearlyFee.toLocaleString()}원</span>
              </div>
            </div>

            {/* 메인 3개 정보 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="essential_params_grid">
              <div className="bg-slate-50/80 border border-slate-150 rounded-2xl p-4 space-y-1.5 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-brand-blue" /> APPLICANT NAME
                </span>
                <div className="text-sm font-sans font-extrabold text-gray-950">{currentApp.applicantName}</div>
                <div className="text-[10.5px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-100 w-fit">{currentApp.entityType || '도시 영농 세대'}</div>
              </div>

              <div className="bg-slate-50/80 border border-slate-150 rounded-2xl p-4 space-y-1.5 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-brand-blue" /> PROPOSED PURPOSE
                </span>
                <div className="text-sm font-sans font-extrabold text-gray-950 truncate" title={currentApp.purpose}>{currentApp.purpose.split('(')[0]}</div>
                <div className="text-[10.5px] text-gray-500 font-semibold">지목: 마스터 DB 연동완료</div>
              </div>

              <div className="bg-slate-50/80 border border-slate-150 rounded-2xl p-4 space-y-1.5 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-blue" /> LEASE PERIOD
                </span>
                <div className="text-xs font-bold text-gray-950 font-mono">
                  {currentApp.startDate} ➡️ {currentApp.endDate}
                </div>
                <div className="text-[10.5px] text-brand-green font-black tracking-tight">
                  총 부지 계약 기간: {currentApp.leasePeriod}개월
                </div>
              </div>
            </div>

            {/* 첨부 서류들 */}
            <div className="space-y-3.5 pt-2" id="supporting_documents_box">
              <h3 className="text-sm font-sans font-black text-gray-950 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-brand-blue" />
                Supporting Documents (공간복지 무단사용 근절 안전 심사 서류)
              </h3>

              {currentApp.documents && currentApp.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="documents_list">
                  {currentApp.documents.map((doc, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-brand-blue/30 hover:bg-slate-50/50 transition duration-200 shadow-2xs group"
                      id={`doc_${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-slate-400 shrink-0 group-hover:text-brand-blue transition-colors" />
                        <div>
                          <div className="text-xs font-bold text-gray-900 truncate max-w-[150px]" title={doc.name}>{doc.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono font-semibold">{doc.size} • {doc.type}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => downloadFile(doc.name)}
                        className="p-1.5 px-3 bg-white border border-slate-200 hover:border-slate-300 text-[10px] font-extrabold text-gray-700 rounded-xl transition-all shadow-3xs active:scale-95 cursor-pointer flex items-center gap-1"
                        id={`btn_down_doc_${idx}`}
                      >
                        <Download className="w-3 h-3 text-slate-500" /> down
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-medium">본 신청 시 첨부된 민간 증빙 서류가 없습니다.</p>
              )}
            </div>
          </div>

          {/* 심사관 행정 처분 조치 */}
          <div className="glass-card p-6 space-y-4 rounded-3xl" id="treatment_action_card">
            <h3 className="font-sans font-black text-gray-950 text-sm flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-brand-blue" />
              행정 심사 처분 이행 지침서 작성
            </h3>

            <div className="space-y-4 text-xs">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="승인/보완요청/반려 기각 시 민원 신청인에게 자동 발송될 국유재산 대부요율 및 철도보호지구 필수 보완 상세 내용이나 회답 소견을 2줄 내외로 작성하세요."
                className="w-full min-h-[90px] bg-slate-50/70 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-brand-blue/80 text-gray-800 font-sans leading-relaxed shadow-inner placeholder:text-gray-400 font-medium"
                id="reviewer_reason_textarea"
              />

              {/* 처분용 버튼 삼총사 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1" id="treatment_buttons">
                <button 
                  onClick={() => handleAction('승인')}
                  className="flex-1 py-3.5 bg-brand-green hover:bg-brand-green-deep text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-97 transition-all duration-150 cursor-pointer btn-premium-jade text-xs"
                  id="btn_admin_approve"
                >
                  <Check className="w-4.5 h-4.5" />
                  신청 최종 승인 (Approve)
                </button>

                <button 
                  onClick={() => handleAction('보완요청')}
                  className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-97 transition-all duration-150 cursor-pointer text-xs"
                  id="btn_admin_request_complement"
                >
                  <Clock className="w-4.5 h-4.5" />
                  안전서류 보완 요청 (Complement)
                </button>

                <button 
                  onClick={() => handleAction('반려')}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-97 transition-all duration-150 cursor-pointer text-xs"
                  id="btn_admin_reject"
                >
                  <XSquare className="w-4.5 h-4.5" />
                  부지대부 부적격 반려 (Reject)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 공공 행정 히스토리 심사 타임라인 */}
        <div className="lg:col-span-4 glass-card p-5 space-y-5 rounded-3xl" id="timeline_sidebar">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-sans font-black text-gray-950 text-base leading-tight tracking-tight">Application Timeline</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">국가철도공단 국유 토지 대부 심사 투명성 로그</p>
          </div>

          <div className="relative border-l-2 border-brand-blue-light ml-3 pl-5 space-y-6 text-xs text-gray-600" id="timeline_steps_scroller">
            {currentApp.timeline && currentApp.timeline.map((step, idx) => (
              <div key={idx} className="relative before:absolute before:-left-[31px] before:top-0.5 before:w-5 before:h-5 before:rounded-full before:bg-brand-blue-light before:border-4 before:border-brand-blue before:flex before:items-center before:justify-center before:shadow-sm" id={`timeline_step_${idx}`}>
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-gray-950 text-[12.5px]">{step.status}</span>
                    <span className="text-[9.5px] text-gray-400 font-mono font-bold">{step.date}</span>
                  </div>
                  <p className="text-gray-500 font-medium leading-relaxed font-sans text-[11px]">{step.description}</p>
                  {step.actor && (
                    <div className="text-[10px] text-brand-blue font-extrabold tracking-wide uppercase mt-0.5">
                      담당: {step.actor}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
