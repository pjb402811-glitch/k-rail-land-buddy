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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-8 text-center max-w-2xl mx-auto space-y-4" id="review_not_found">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">심사 대상을 찾을 수 없습니다</h3>
        <p className="text-gray-500 text-sm">해당 접수 서류가 만료되었거나 삭제되었습니다.</p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#00529C] text-white rounded-xl text-xs font-bold"
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
    // 가상의 다운로드
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
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#00529C] font-semibold"
          id="btn_back_to_dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          신청 목록 대시보드로 돌아가기
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">신청서 번호</span>
          <span className="bg-[#f0f4f8] border border-gray-200 text-[#00529C] font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
            {currentApp.id}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            currentApp.status === '승인' 
              ? 'bg-emerald-50 text-[#006e1c] border-emerald-200' 
              : currentApp.status === '보완요청' 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : currentApp.status === '반려' 
              ? 'bg-red-50 text-red-600 border-red-200' 
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {currentApp.status === '승인' ? '심사승인' : currentApp.status === '보완요청' ? '보완요청' : currentApp.status === '반려' ? '심사반려' : '심사 진행 중'}
          </span>
        </div>
      </div>

      {/* 실시간 세부정보 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="review_details_grid">
        {/* 좌측 메인 신청서 내역 */}
        <div className="lg:col-span-8 space-y-6" id="applicantion_main_sheet">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6" id="sheet_card_top">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div>
                <span className="text-xs font-mono font-bold text-gray-400">SUBMITTED ON {currentApp.appliedDate} • STATION ZONE</span>
                <h1 className="text-xl font-bold text-gray-900 mt-1">{currentApp.purpose}</h1>
                <p className="text-xs text-gray-500 mt-1">{currentApp.address}</p>
              </div>
              
              {/* 월 대부료 우측 배너 */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-100/50 border border-emerald-200 rounded-2xl p-4 text-right transform hover:scale-102 transition duration-300">
                <span className="text-[10px] font-bold text-[#006e1c] tracking-wider block">ESTIMATED FEE</span>
                <span className="text-lg font-bold text-emerald-800 block font-mono">
                  ₩{currentApp.monthlyFee.toLocaleString()} <span className="text-xs font-medium">/ mo</span>
                </span>
                <span className="text-[10px] text-emerald-600">연 환산 약 {currentApp.yearlyFee.toLocaleString()}원</span>
              </div>
            </div>

            {/* 메인 4개 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="essential_params_grid">
              {/* 항목 1 */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-[#00529C]" /> APPLICANT NAME
                </span>
                <div className="text-sm font-bold text-gray-900">{currentApp.applicantName}</div>
                <div className="text-[10px] text-gray-500">{currentApp.entityType || '도시 영농 세대'}</div>
              </div>

              {/* 항목 2 */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3 h-3 text-[#00529C]" /> PROPOSED PURPOSE
                </span>
                <div className="text-sm font-bold text-gray-900 truncate" title={currentApp.purpose}>{currentApp.purpose.split('(')[0]}</div>
                <div className="text-[10px] text-gray-500">지목: 마스터 DB 연동완료</div>
              </div>

              {/* 항목 3 */}
              <div className="bg-[#f8f9fa] rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#00529C]" /> LEASE PERIOD
                </span>
                <div className="text-sm font-bold text-gray-950 font-mono">
                  {currentApp.startDate} ➡️ {currentApp.endDate}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  총 부지 계약 기간: {currentApp.leasePeriod}개월
                </div>
              </div>
            </div>

            {/* 첨부 서류들 */}
            <div className="space-y-3 pt-2" id="supporting_documents_box">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#00529C]" />
                Supporting Documents (공간복지 무단사용 근절 안전 심사 서류)
              </h3>

              {currentApp.documents && currentApp.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="documents_list">
                  {currentApp.documents.map((doc, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-400 transition"
                      id={`doc_${idx}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-gray-800 truncate max-w-[150px]" title={doc.name}>{doc.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{doc.size} • {doc.type}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => downloadFile(doc.name)}
                        className="p-1 px-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-[10px] font-bold text-gray-700 rounded-lg transition flex items-center gap-1"
                        id={`btn_down_doc_${idx}`}
                      >
                        <Download className="w-3 h-3" /> down
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">본 신청 시 첨부된 민간 증빙 서류가 없습니다.</p>
              )}
            </div>
          </div>

          {/* 심사관 행정 처분 조치 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4" id="treatment_action_card">
            <h3 className="font-sans font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[#00529C]" />
              행정 심사 처분 이행 지침서 작성
            </h3>

            <div className="space-y-3 text-xs">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="승인/보완요청/반려 기각 시 민원 신청인에게 자동 발송될 국유재산 대부요율 및 철도보호지구 필수 보완 상세 내용이나 회답 소견을 2줄 내외로 작성하세요."
                className="w-full min-h-[90px] bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#00529C] text-gray-700 font-sans leading-relaxed"
                id="reviewer_reason_textarea"
              />

              {/* 처분용 버튼 삼총사 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1" id="treatment_buttons">
                <button 
                  onClick={() => handleAction('승인')}
                  className="flex-1 py-3 bg-[#006e1c] hover:bg-green-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition duration-150"
                  id="btn_admin_approve"
                >
                  <Check className="w-4 h-4" />
                  신청 최종 승인 (Approve)
                </button>

                <button 
                  onClick={() => handleAction('보완요청')}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition duration-150"
                  id="btn_admin_request_complement"
                >
                  <Clock className="w-4 h-4" />
                  안전서류 보완 요청 (Complement)
                </button>

                <button 
                  onClick={() => handleAction('반려')}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition duration-150"
                  id="btn_admin_reject"
                >
                  <XSquare className="w-4 h-4" />
                  부지대부 부적격 반려 (Reject)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 공공 행정 히스토리 심사 타임라인 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-5" id="timeline_sidebar">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-sans font-bold text-gray-900 text-base leading-tight">Application Timeline</h3>
            <p className="text-xs text-gray-500 mt-1">국가철도공단 국유 토지 대부 심사 투명성 로그</p>
          </div>

          <div className="relative border-l border-blue-100 ml-2.5 pl-5 space-y-6 text-xs text-gray-600" id="timeline_steps_scroller">
            {currentApp.timeline && currentApp.timeline.map((step, idx) => (
              <div key={idx} className="relative before:absolute before:-left-[31px] before:top-0.5 before:w-5 before:h-5 before:rounded-full before:bg-blue-50 before:border-2 before:border-[#00529C] before:flex before:items-center before:justify-center" id={`timeline_step_${idx}`}>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-gray-900">{step.status}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{step.date}</span>
                  </div>
                  <p className="text-gray-500 leading-relaxed font-sans">{step.description}</p>
                  {step.actor && (
                    <div className="text-[10px] text-[#00529C] font-semibold">
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
