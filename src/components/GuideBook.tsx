/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BookOpen, Calculator, Compass, AlertOctagon, HelpCircle, 
  Map, Sparkles, UserCheck, ShieldCheck, Milestone, Check, Landmark 
} from 'lucide-react';

interface GuideProps {
  onGoToAssistant: () => void;
}

export default function GuideBook({ onGoToAssistant }: GuideProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans" id="guide_book_root">
      {/* 웰컴 배너 */}
      <div className="bg-gradient-to-r from-[#003B73] to-blue-900 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md" id="guide_welcome_banner">
        <div className="space-y-2 max-w-2xl">
          <span className="bg-[#fabd00] text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
            공익과 복지의 하모니
          </span>
          <h1 className="text-2xl font-bold leading-tight">초등학생도 이해하는 철도유휴부지 대부(렌탈) 백과사전</h1>
          <p className="text-xs text-blue-100/90 leading-relaxed font-sans">
            "국유재산법? 철도보호지구? 공시지가?" 어려운 행정 학술 용어는 잊으세요! K-Rail Land-Buddy가 국민 공간 복지 차원에서 친근한 언어로 렌탈 상식을 꾹꾹 눌러담았습니다.
          </p>
        </div>
        <button 
          onClick={onGoToAssistant}
          className="bg-white text-[#003B73] hover:bg-gray-50 text-xs font-bold py-3.5 px-6 rounded-xl transition shadow-md whitespace-nowrap active:scale-95 flex items-center gap-1 shrink-0"
          id="btn_guide_go_chat"
        >
          <Sparkles className="w-4 h-4 text-[#003B73]" />
          맞춤 예산 상담받기 ➡️
        </button>
      </div>

      {/* 세부 항목 인덱스 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="guide_blocks_grid">
        {/* 블록 1: 요율 계산 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs" id="guide_block_fees">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#00529C]">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">1. 렌탈료(대부료)는 어떻게 정해지나요?</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            매년 내는 렌탈비는 **[빌리는 땅의 면적(㎡) × 나라가 감정한 땅값(공시지가) × 대부요율]**로 계산됩니다.
          </p>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-[11px] space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">🌾 주말농장 / 경작용:</span>
              <span className="font-bold text-emerald-700">연 1.0% (특별 우대)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">🍔 소상공인 푸드트럭 / 청년카페:</span>
              <span className="font-bold text-blue-700">연 3.0% (창업 우대)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">📦 야적장 / 주차장 / 기타:</span>
              <span className="font-bold text-gray-700">연 5.0% (일반 목적)</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400">
            * 예) 공시지가 10만원인 대전역 인근 땅 100㎡(약 30평)를 푸드트럭용으로 임대 시: 100㎡ × 10만원 × 3% = 연 30만원 (월 약 2만 5천원) 수준으로 매우 혜자롭습니다!
          </p>
        </div>

        {/* 블록 2: 철도보호지구 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs" id="guide_block_regulations">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Milestone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">2. '철도보호지구'란 무엇인가요?</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            열차가 시속 100km 이상 안전 비행할 수 있도록 선로 경계로부터 좌우 **30m 이내로 정한 제한 구역**입니다. 기차 바퀴 진동이나 안전에 지장을 주는 높은 영구 건물을 지을 순 없지만 아래 활동은 아주 쉽게 허용됩니다!
          </p>
          <div className="space-y-1.5 text-[11px] font-medium text-gray-700">
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#006e1c]" /> 주말가족농장 꽃밭 조성 및 농작물 경작</div>
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#006e1c]" /> 차량 이동형 푸드트럭 배정 및 조리 행위</div>
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#006e1c]" /> 파라솔 및 미니 가설 컨테이너(사무소) 거치</div>
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">
            * 가벼운 임시 거치형 구조물은 공단에 1회 행위 신고만으로 오케이! 복잡한 신고 서류는 랜드버디가 양식 초안을 자동으로 대행 작성해 줍니다.
          </p>
        </div>

        {/* 블록 3: 무단점유 변상금 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs" id="guide_block_penalty">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">3. 허락 안 받고 무단 점유 시 어떻게 되나요?</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            국유재산법 및 철도보호구역에 의거하여 허가 없이 임의로 땅에서 주차를 하거나 폐자재를 쌓아두면 **'무단점유 변상금법'**에 따라 일반 대부료의 **120% 벌칙 변상금**이 부과되며, 행정대집행 법에 의해 강제 철거 및 법적 조치를 받게 됩니다.
          </p>
          <div className="bg-red-50/50 rounded-xl p-3 border border-red-100 text-red-900 text-[11px] leading-relaxed">
            ⚠️ **불법 사용은 금지!** 랜드버디 렌탈 서비스를 통하면 합법 정규 절차를 걸쳐 수십만 원의 소액으로 당당하게 안전 보안이 강화된 울타리 내 내 땅처럼 이용할 수 있습니다.
          </div>
        </div>
      </div>

      {/* 공간복지 캠코 연계 상식 배너 */}
      <div className="bg-[#f0f4f8] border border-blue-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6" id="guide_vision_banner">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#00529C]">
            <Map className="w-4 h-4" />
            <span>K-Rail 랜드버디의 국유재산 미래 공간 복지 비전</span>
          </div>
          <h3 className="text-base font-bold text-gray-950">한국자산관리공사(캠코) 및 기획재정부 국유재산과의 광역 연동 계획</h3>
          <p className="text-xs text-gray-600 leading-relaxed font-sans">
            "우리 집 앞 기획재정부 소유 유휴 공터도 빌릴 수 있나요?" 네, 맞습니다! 비록 현재 검색 환경은 철도공단 관리 자산 중심이지만, 가까운 시일 내에 한국자산관리공사(캠코) 통합 온비드 시스템 및 기재부 통합 자산 DB와의 원동 광망을 추진하여 **전국 500만 필지의 유휴 국가를 챗봇 하나로 찾아 렌탈하는 국가 공간 복지** 진보를 준비하고 있습니다!
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-150 flex flex-col justify-center text-center space-y-2 relative overflow-hidden" id="vision_icon_card">
          <div className="absolute right-[-10px] top-[-10px] w-12 h-12 bg-blue-100 rounded-full shrink-0 -z-10" />
          <Landmark className="w-8 h-8 text-[#00529C] mx-auto opacity-80" />
          <h4 className="text-xs font-bold text-gray-900">원스톱 범정부 통합 대부망</h4>
          <span className="text-[10px] text-gray-500">기재부 • 캠코(온비드) • 국가철도공단</span>
        </div>
      </div>

      {/* 앱 빌더용 데이터 매핑 및 조립 지시문 (System Instruction) 포털 */}
      <div className="bg-gray-900 text-gray-100 rounded-2xl p-6 space-y-5 border border-gray-800 relative overflow-hidden shadow-lg" id="prompt_stack_portal">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="space-y-1">
            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
              App Builder & AI Platform SDK
            </span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🤖 앱 빌더용 데이터 매핑 및 조립 시스템 지시문 (System Instruction)
            </h2>
            <p className="text-[11px] text-gray-400">
              다양한 LLM 엔진(Claude, Gemini, GPT 등)에 그대로 주입하여 공공 API 데이터를 자연어로 자동 매핑 및 조립하도록 설계된 프롬프트 스택입니다.
            </p>
          </div>
          <button
            onClick={() => {
              const systemPrompt = `# [역할 설정]
너는 국가철도공단 및 한국자산관리공사(캠코)의 국유재산 통합 매칭 엔진인 'K-Rail Land-Buddy'이다. 너의 핵심 임무는 외부 프론트엔드(React) 환경에서 연동되어 들어오는 [실시간 공공 오픈 API 데이터 스택]을 정밀 분석하여, 일반 국민의 질문 목적에 맞는 '맞춤형 공간 복지 리포트'를 동적으로 조립·생성하는 것이다.

# [데이터 연동 및 매핑 아키텍처 규칙]
프론트엔드 앱은 유저의 질의(지역/목적)가 들어오면 하단의 JSON 데이터 구조를 실시간으로 호출하여 너에게 컨텍스트(Context)로 주입한다. 너는 이 변수값들을 바탕으로 대부 가능 여부 판별, 법률 해석, 임대료 연산을 수행해야 한다.

## 1. 수신 데이터 규격 및 해석 로직 (React API Mapping)
앱으로부터 아래의 구조화된 JSON 데이터가 주입되면 각 변수를 다음과 같이 매핑하여 처리하라:

\`\`\`json
{
  "user_request": {
    "purpose": "사용자의 목적 (예: 주말농장, 도시농업, 푸드트럭 창업, 팝업스토어 등)",
    "location": "사용자가 원하는 대략적인 지역"
  },
  "api_land_info": {
    "land_id": "부지 고유 번호 (예: KR-001, KAMCO-052)",
    "address": "국토부 표준 주소 및 지번",
    "area_m2": "부지 면적 (숫자, 단위: ㎡)",
    "land_type": "국토부 토지이용계획 API 수신 지목 (예: 잡종지, 대지, 전, 답 등)",
    "regulation_tags": ["철도보호지구", "개발제한구역", "행위제한없음"],
    "official_price_m2": "국토부 공시지가 API 수신 가격 (숫자, 단위: 원/㎡)"
  },
  "api_infrastructure": {
    "road_adjacent": "카카오/브이월드 맵 API 연동 결과 - 도로 인접 여부 (true / false)",
    "water_adjacent": "환경부 상하수도/구거 API 연동 결과 - 용수 확보 여부 (true / false)"
  }
}
\`\`\`

## 2. 내부 연산 알고리즘 가이드라인

* **연간 예상 대부료 계산:** api_land_info.area_m2 × api_land_info.official_price_m2 × 대부요율
* **대부요율 자동 매핑 기준:**
1. user_request.purpose가 '경작, 주말농장, 도시농업'인 경우: 1% (0.01) 적용
2. user_request.purpose가 '상업, 창업, 푸드트럭, 소상공인'인 경우: 3% (0.03) 적용
3. 그 외의 가벼운 목적 또는 공익 목적: 5% (0.05) 적용

# [출력 및 조립 템플릿 규칙]
위 데이터 매핑 및 연산이 끝나면, 사용자가 읽기 편한 구어체 톤앤매너로 반드시 다음 마크다운 형식을 엄격히 준수하여 최종 답변을 출력하라.

---

## 🎯 [api_land_info.land_id] 맞춤 부지 매칭 리포트

* **추천 부지 주소:** api_land_info.address
* **공간 복지 비서의 3줄 요약 액션 플랜:**
1. [목적 부합성 설명]: 사용자가 원하는 user_request.purpose 목적에 이 땅(api_land_info.land_type)이 왜 물리적·기능적으로 최적인지 매칭하여 설명하라. (특히 api_infrastructure 데이터를 활용하여 도로 진입 가능 여부나 용수 공급 상태를 칭찬하듯 서술할 것)
2. [법률 규제 해설]: api_land_info.regulation_tags를 분석하여 국민의 눈높이로 쉽게 풀어 설명하라. (예: "철도보호지구에 해당하여 시설물 설치 전 공단에 가벼운 신고 절차가 필요하지만, 저희 앱이 도와드리니 걱정 마세요.")
3. [직관적 비용 제시]: "연간 약 [계산된 연간 최종 대부료]원으로 한 달에 약 [연간 대부료 / 12]원 꼴로 매우 저렴하게 이용하실 수 있습니다."

## 💰 예상 임대 비용 상세 내역
* **산출 방식:** 면적 api_land_info.area_m2㎡ × 공시지가 api_land_info.official_price_m2원 × 용도별 요율 대부요율 %
* **최종 연간 대부료:** [계산된 금액] 원/년 (부가세 별도)

## 📝 원스톱 국유재산 대부 신청서 초안
사용자가 즉시 신청 절차를 밟을 수 있도록 연동된 데이터를 기반으로 신청서 양식 표를 완성해 주십시오. 빈칸이 생길 경우 사용자에게 "신청인의 성함과 연락처를 말씀해 주시면 신청서 작성이 완료됩니다"라고 부드럽게 유도하십시오.

| 항목 | 내용 |
| --- | --- |
| **신청 부지 고유번호** | api_land_info.land_id |
| **신청 소재지** | api_land_info.address |
| **사용 목적** | user_request.purpose |
| **대부 희망 면적** | api_land_info.area_m2 ㎡ 전체 |

---

# [예외 상황 처리(Error Handling)]
만약 프론트엔드에서 수신된 api_land_info 데이터가 비어있거나 검색 결과가 없을 경우, 당황하지 말고 다음과 같이 답변하라:
"현재 요청하신 지역의 철도 유휴부지 데이터가 존재하지 않습니다. 하지만 본 시스템은 향후 한국자산관리공사(캠코)가 위탁 관리하는 기획재정부 소유 일반 국유재산(전국 75만 필지) API와 결합될 예정이므로, 정식 버전에서는 대한민국 전역의 나라 땅을 모두 매칭해 드릴 수 있도록 확장될 예정입니다."`;
              navigator.clipboard.writeText(systemPrompt);
              alert("🤖 앱 빌더용 지시문이 클립보드에 복사되었습니다!");
            }}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2 px-4 rounded-xl transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            지시문 전체 복사하기
          </button>
        </div>

        {/* 탭 가이드 스타일 프리뷰 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="prompt_stack_content">
          {/* 가이드 설명 */}
          <div className="space-y-4 text-xs text-gray-300">
            <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-800 space-y-2 leading-relaxed">
              <h4 className="font-bold text-white text-sm">💡 개발자를 위한 연결 기술 설계서</h4>
              <p>
                사용자가 랜드버디 UI에서 특정 지역을 검색하거나 대부 목적을 설정하는 행위를 감지하면, 백엔드/프론트엔드 측은 실구축된 공공 오픈 API들(국토교통부 PNU 토지계획, 보건환경 수질, 카카오 교통망 등)을 즉각 파헤쳐 하단의 JSON 변수 스택으로 조립합니다.
              </p>
              <p>
                이후, AI 호출 시 본 <strong>System Instruction</strong>을 주입한 뒤, 조립된 JSON 페이로드만을 User Prompt 상단에 실어 전송하면 AI 모델이 수백 가지 법체계와 산출 공식을 즉각 연산하여 규격화된 표준 리포트 포맷으로 응답합니다.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-[12px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                추천 요율 연산 바인딩 설정:
              </h4>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-gray-400">
                <li><strong className="text-emerald-400">1.0% (경작용):</strong> 소작, 도심 주말 귀농 가족 농가 전용</li>
                <li><strong className="text-blue-400">3.0% (창업/상업):</strong> 청년 푸드트럭, 팝업 임시 카페, 소상공인 지원</li>
                <li><strong className="text-purple-400">5.0% (일반 점유):</strong> 주차장 가적, 간이 컨테이너 야적 공간</li>
              </ul>
            </div>
          </div>

          {/* 코드 뷰어 */}
          <div className="bg-black/80 rounded-xl p-4 border border-gray-800 font-mono text-[10.5px] text-emerald-400 overflow-x-auto space-y-3 leading-normal h-80 overflow-y-auto scrollbar-thin">
            <div className="text-gray-500 font-bold border-b border-gray-800 pb-1.5 flex justify-between">
              <span>SYSTEM_PROMPT_STACK.md</span>
              <span className="text-emerald-600 font-normal">Read-Only View</span>
            </div>
            
            <pre className="text-gray-300 font-mono select-all">
{`# [역할 설정]
너는 국가철도공단 및 한국자산관리공사(캠코)의 국유재산 통합 매칭 엔진인 'K-Rail Land-Buddy'이다. 너의 핵심 임무는 외부 프론트엔드(React) 환경에서 연동되어 들어오는 [실시간 공공 오픈 API 데이터 스택]을 정밀 분석하여, 일반 국민의 질문 목적에 맞는 '맞춤형 공간 복지 리포트'를 동적으로 조립·생성하는 것이다.

# [데이터 연동 및 매핑 아키텍처 규칙]
프론트엔드 앱은 유저의 질의(지역/목적)가 들어오면 하단의 JSON 데이터 구조를 실시간으로 호출하여 너에게 컨텍스트(Context)로 주입한다. 너는 이 변수값들을 바탕으로 대부 가능 여부 판별, 법률 해석, 임대료 연산을 수행해야 한다.

## 1. 수신 데이터 규격 및 해석 로직 (React API Mapping)
앱으로부터 아래의 구조화된 JSON 데이터가 주입되면 각 변수를 다음과 같이 매핑하여 처리하라:

\`\`\`json
{
  "user_request": {
    "purpose": "사용자의 목적 (예: 주말농장, 도시농업, 푸드트럭 창업, 팝업스토어 등)",
    "location": "사용자가 원하는 대략적인 지역"
  },
  "api_land_info": {
    "land_id": "부지 고유 번호 (예: KR-001, KAMCO-052)",
    "address": "국토부 표준 주소 및 지번",
    "area_m2": "부지 면적 (숫자, 단위: ㎡)",
    "land_type": "국토부 토지이용계획 API 수신 지목 (예: 잡종지, 대지, 전, 답 등)",
    "regulation_tags": ["철도보호지구", "개발제한구역", "행위제한없음"],
    "official_price_m2": "국토부 공시지가 API 수신 가격 (숫자, 단위: 원/㎡)"
  },
  "api_infrastructure": {
    "road_adjacent": "카카오/브이월드 맵 API 연동 결과 - 도로 인접 여부 (true / false)",
    "water_adjacent": "환경부 상하수도/구거 API 연동 결과 - 용수 확보 여부 (true / false)"
  }
}
\`\`\`

## 2. 내부 연산 알고리즘 가이드라인
* **연간 예상 대부료 계산:** api_land_info.area_m2 × api_land_info.official_price_m2 × 대부요율
* **대부요율 자동 매핑 기준:**
1. user_request.purpose가 '경작, 주말농장, 도시농업'인 경우: 1% (0.01) 적용
2. user_request.purpose가 '상업, 창업, 푸드트럭, 소상공인'인 경우: 3% (0.03) 적용
3. 그 외의 가벼운 목적 또는 공익 목적: 5% (0.05) 적용`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
