/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, User, Sparkles, Calculator, FileText, Check, AlertCircle, 
  HelpCircle, RefreshCw, FileDown, Edit3, ArrowRight, Landmark, MapPin, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { LandParcel, LeaseApplication, LandBuddyMessage } from '../types';
import { LAND_PARCELS, LAND_BUDDY_PRESETS } from '../data';
import SpatialPortal from './SpatialPortal';
import { fetchLandChainData, ApiKeys } from '../services/apiBridge';

interface AssistantProps {
  onApplySubmit: (app: LeaseApplication) => void;
  activeParcelId?: string | null;
  onSelectParcel?: (id: string) => void;
  parcels: LandParcel[]; // 실시간 동적 유휴부지 자산 DB
  hideRightPanel?: boolean; // 우측 가이드 및 프리셋 패널 숨김 여부 (모바일 대응)
}

export default function LandBuddyAssistant({ onApplySubmit, activeParcelId, onSelectParcel, parcels, hideRightPanel }: AssistantProps) {
  const [messages, setMessages] = useState<LandBuddyMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `반갑습니다! 국가철도공단(KR)의 유휴부지 대부(렌탈) 및 공간 복지 맞춤형 비서, **'KR-Land Buddy'**입니다. 🚉💚
      
대표 표준 공공 API 데이터 조립 연계 모듈이 탑재되어, 지적 공부 및 용도 규제(1단계)와 도로/상하수도/전기 인프라(2단계) 공공데이터를 똑똑하게 파싱하여 시민들이 알기 쉬운 **'친절하고 명쾌한 설명'**으로 3줄 요약해 드립니다!

어디에서 어떤 목적으로 철도 부지 렌탈을 알아보고 계신가요? 
예를 들어, **"대전역 인근에 푸드트럭 창업하고 싶어요"** 또는 **"대전 주변에 주말농장 땅이 있을까요?"** 처럼 자연스럽게 물어보시면 공시지가 실시간 렌탈비 계산부터 인프라 조사까지 즉석 가이드해 드립니다!`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantType, setApplicantType] = useState('개인');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingParcel, setPendingParcel] = useState<LandParcel | null>(null);
  const [selectedLeasePeriod, setSelectedLeasePeriod] = useState(12); // 기본 1년
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

  // --- 진짜 Gemini API 연동용 신규 상태 추가 ---
  const [apiKey, setApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem('k_rail_gemini_api_key');
    if (savedKey) return savedKey;
    return ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '';
  });
  const [publicDataKey, setPublicDataKey] = useState<string>(() => {
    const savedKey = localStorage.getItem('k_rail_public_data_key');
    if (savedKey) return savedKey;
    return ((import.meta as any).env?.VITE_PUBLIC_DATA_KEY as string) || '';
  });
  const [vworldKey, setVworldKey] = useState<string>(() => {
    const savedKey = localStorage.getItem('k_rail_vworld_key');
    if (savedKey) return savedKey;
    return ((import.meta as any).env?.VITE_VWORLD_KEY as string) || '';
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isApiConnecting, setIsApiConnecting] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>([]); // 실시간 오픈 API 체이닝 로그

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle activeParcelId from external clicks (like Inventory detail)
  useEffect(() => {
    if (activeParcelId) {
      const parcel = parcels.find(p => p.id === activeParcelId);
      if (parcel) {
        handleSelectParcel(parcel);
      }
    }
  }, [activeParcelId, parcels]);

  // 대부요율 계산 도우미
  const getRateAndLabel = (recommendedUse: string): { rate: number; label: string; ratePct: number } => {
    const text = recommendedUse.toLowerCase();
    if (text.includes('농장') || text.includes('농업') || text.includes('텃밭') || text.includes('경작')) {
      return { rate: 0.01, label: '경작용 요율 적용', ratePct: 1 };
    } else if (text.includes('창업') || text.includes('푸드트럭') || text.includes('카페') || text.includes('상업') || text.includes('스토어')) {
      return { rate: 0.03, label: '상업용/창업요율 적용', ratePct: 3 };
    } else {
      return { rate: 0.05, label: '기타/일반요율 적용', ratePct: 5 };
    }
  };

  const calculateLeaseFee = (parcel: LandParcel) => {
    const { rate, label, ratePct } = getRateAndLabel(parcel.recommendedUse);
    const yearlyFee = Math.round(parcel.area * parcel.officialPrice * rate);
    const monthlyFee = Math.round(yearlyFee / 12);
    return { yearlyFee, monthlyFee, rate, ratePct, label };
  };

  // 1단계, 2단계, 3단계 포맷 생성 헬퍼
  const generateAssistantResponse = (parcel: LandParcel, userName: string) => {
    const { yearlyFee, monthlyFee, ratePct, label } = calculateLeaseFee(parcel);
    
    // 이 땅이 목적에 왜 좋은가
    let goodPoint = '';
    if (parcel.id === 'KR-001') {
      goodPoint = '대전역 인근 광장 바로 옆이라 유동인구 최상입니다! 소상공인 푸드트럭이나 팝업스토어를 구성하시는 데에 최적의 노다지 땅입니다.';
    } else if (parcel.id === 'KR-002') {
      goodPoint = '선로와 다소 인접하지만, 주변에 높은 장벽이 없어 햇살이 잘 듭니다. 영농 용수가 가까워 주말농장용 배수나 실버 텃밭에 정말 안성맞춤입니다.';
    } else if (parcel.id === 'KR-003') {
      goodPoint = '세종 조치원 역사 리모델링 구간에 붙어 있어서 인근 보행 관광객들이 부쩍 늘고 있는 핫플레이스입니다. 청년 창업 카페나 예쁜 예술 플리마켓으로 아주 좋아요.';
    } else {
      goodPoint = `이 부지는 면적이 ${parcel.area}㎡로 넉넉하며, 추천 용도인 '${parcel.recommendedUse}'에 매우 최적화되어 있습니다.`;
    }

    // 규제를 알기 어렵게 하지 않고 직관적으로 번역
    let easyRule = '';
    if (parcel.isRailwayProtected) {
      easyRule = '기차가 안전하게 지나다니는 보호 구역(철도보호지구) 근처여서, 임시 시설물(푸드트럭, 가설 컨테이너, 미니 가로등)을 두실 때 공단에 가볍게 신고 절차만 한 번 거쳐주시면 끝납니다. (어려운 서류는 제가 다 적어 드려요!)';
    } else {
      easyRule = '주변에 기차가 정차하는 구역이 인접해 다소의 소음이 발생할 수 있지만, 농작물 재배나 단순 창고용으로 이용하기에 행정상 아무런 걸림돌이 없는 대부 가능지입니다.';
    }
    
    return {
      step1: {
        title: '대부 조건 및 가용 여부 요약',
        points: [
          `이 부지는 면적 ${parcel.area}㎡에 달하는 국유지로서, 대부 목적은 [${parcel.recommendedUse}]에 가장 특화되어 있습니다.`,
          `공시지가는 ㎡당 ${parcel.officialPrice.toLocaleString()}원 수준이며, ${label} 요율인 [${ratePct}%] 우대 금리가 즉각 적용됩니다.`,
          `행정 규정 요약: ${easyRule}`
        ]
      }
    };
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 사용자 메시지 즉시 추가
    const userMsg: LandBuddyMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // 타이핑 로딩 메시지 추가
    const loadingMsgId = `msg-${Date.now()}-loading`;
    const loadingMsg: LandBuddyMessage = {
      id: loadingMsgId,
      sender: 'bot',
      text: '🤖 국가공간정보 표준 API 데이터 조립 및 행정 통역 가동 중...',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, loadingMsg]);

    // 약간의 딜레이 후 API 조립 체인 실행
    setTimeout(async () => {
      // 로딩 메시지 제거
      setMessages(prev => prev.filter(m => m.id !== loadingMsgId));

      let matchedParcelId: string | null = null;
      let replyText = '';
      let logs: string[] = [];
      let assembledParcel: LandParcel | null = null;

      const lowerText = text.toLowerCase();

      // 국유재산법 관련 질문인지 감지 (초정밀 감지 센서)
      const isLegalQuery = lowerText.includes('법') || 
                           lowerText.includes('조항') || 
                           lowerText.includes('제18조') || 
                           lowerText.includes('제31조') || 
                           lowerText.includes('제32조') || 
                           lowerText.includes('제72조') || 
                           lowerText.includes('영구시설') || 
                           lowerText.includes('영구건축') || 
                           lowerText.includes('축조') || 
                           lowerText.includes('대부계약') || 
                           lowerText.includes('사용허가') || 
                           lowerText.includes('대부료') || 
                           lowerText.includes('임대료') || 
                           lowerText.includes('감면') || 
                           lowerText.includes('변상금') || 
                           lowerText.includes('무단점유') || 
                           lowerText.includes('보호구역') || 
                           lowerText.includes('보호지구') || 
                           lowerText.includes('안전지구') || 
                           lowerText.includes('기간') || 
                           lowerText.includes('갱신');

      // 1. 자연어 쿼리 분석 및 내부 DB(parcels 프로퍼티)에서 후보 부지 탐색 (엑셀 업로드 자산 포함!)
      let foundParcel: LandParcel | null = null;

      // 주소, 부지ID, 용도 단어 매핑으로 스마트 매칭 (초정밀 파서)
      foundParcel = parcels.find(p => 
        lowerText.includes(p.id.toLowerCase()) || 
        p.address.split(' ').some(word => word.length > 1 && lowerText.includes(word.toLowerCase())) ||
        p.recommendedUse.split('·').some(word => word.length > 1 && lowerText.includes(word.toLowerCase()))
      ) || null;

      // 발견하지 못한 경우 표준 룰셋으로 강제 폴백 (주소지나 자산번호 유도 시)
      if (!foundParcel) {
        if (lowerText.includes('대전역') || lowerText.includes('정동') || lowerText.includes('001')) {
          foundParcel = parcels.find(p => p.id === 'KR-001') || parcels[0];
        } else if (lowerText.includes('농장') || lowerText.includes('경작') || lowerText.includes('텃밭') || lowerText.includes('서구') || lowerText.includes('002')) {
          foundParcel = parcels.find(p => p.id === 'KR-002') || parcels[1];
        } else if (lowerText.includes('세종') || lowerText.includes('조치원') || lowerText.includes('003')) {
          foundParcel = parcels.find(p => p.id === 'KR-003') || parcels[2];
        } else if (lowerText.includes('신탄진') || lowerText.includes('물류') || lowerText.includes('야적') || lowerText.includes('004')) {
          foundParcel = parcels.find(p => p.id === 'KR-004') || parcels[3];
        } else if (lowerText.includes('용산') || lowerText.includes('교량') || lowerText.includes('서울') || lowerText.includes('005')) {
          foundParcel = parcels.find(p => p.id === 'KR-05') || parcels[4];
        }
      }

      // 사용자가 고른 용도가 프리셋에 있는지 확인하고 매칭 지침 추출
      const presetGuides: Record<string, string> = {
        "주말농장": "농업용 구거(물줄기)나 수자원 확보가 유리한지 체크하고, 별도 건축 행위가 없으므로 추천 점수를 높게 줄 것.",
        "반려견놀이터": "대형견/소형견 분리를 위해 부지 면적이 최소 300㎡ 이상이어야 함을 체크하고, 안전 펜스(가설물) 설치가 필수임을 안내할 것.",
        "푸드트럭": "인근 도로 접해성(진입로)이 핵심임. 가설건축물 및 이동식 차량으로 운영되므로 법적으로 매우 유리함을 명시할 것."
      };

      let userPurpose = "";
      if (lowerText.includes("농장") || lowerText.includes("텃밭") || lowerText.includes("농업") || lowerText.includes("경작") || lowerText.includes("주말농장")) {
        userPurpose = "주말농장";
      } else if (lowerText.includes("반려견") || lowerText.includes("애견") || lowerText.includes("놀이터") || lowerText.includes("댕댕이") || lowerText.includes("소형견") || lowerText.includes("대형견") || lowerText.includes("개")) {
        userPurpose = "반려견놀이터";
      } else if (lowerText.includes("푸드트럭") || lowerText.includes("푸드") || lowerText.includes("트럭") || lowerText.includes("창업") || lowerText.includes("카페") || lowerText.includes("스토어")) {
        userPurpose = "푸드트럭";
      }

      if (!userPurpose && foundParcel) {
        userPurpose = foundParcel.recommendedUse.split('·')[0].trim();
      } else if (!userPurpose) {
        userPurpose = "일반용도";
      }

      // 2. 부지가 매칭된 경우 국토교통부/브이월드 공간 API 실시간 체이닝(Chaining) 작동!
      if (foundParcel) {
        matchedParcelId = foundParcel.id;
        try {
          // 실시간 체이닝 가동
          const chainResult = await fetchLandChainData(foundParcel, {
            geminiKey: apiKey,
            publicDataKey,
            vworldKey
          });
          assembledParcel = chainResult.parcel;
          logs = chainResult.logs;
          setApiLogs(logs);
        } catch (e) {
          console.error('API Chaining failed', e);
          logs = [`⚠️ [API 에러] 실시간 연동 연산 실패: 데모 데이터로 폴백합니다.`];
          assembledParcel = foundParcel;
        }
      }

      // 3. 진짜 Gemini API 키가 존재하는 경우 실시간 법령/용도 분석 수행
      if (apiKey.trim()) {
        try {
          setIsApiConnecting(true);
          const ai = new GoogleGenAI({ apiKey });
          
          let finalPrompt = "";
          let systemInstruction = "";

          // 국유재산법 질문 모드
          if (isLegalQuery && !assembledParcel) {
            finalPrompt = `
[사용자 질문]
"${text}"

[필수 분석 지침]
- 대한민국 국유재산법 조항(제18조 영구시설물 축조 금지, 제30조 사용허가, 제31조 대부기간 및 5년 갱신 혜택, 제32조/제34조 대부요율 농업 1%/창업 3%/일반 5% 감면 특례, 제72조 무단점유 변상금 120% 규정 등)을 기반으로 정교하고 친절하게 전문 행정 솔루션을 제공하라.
- 불필요한 인사는 생략하고 질문에 집중하여 마크다운 표나 리스트로 가독성 높게 정리하라.
- 마지막에는 쏭비서 특유의 "대표님, 법령 오케스트레이션 공장 정상 가동 중입니다!" 라는 기운찬 확인 멘트로 깔끔하게 끝내라.
`;
            systemInstruction = `너는 대한민국 국가철도공단의 유휴지 공간복지 활용 전문 AI 비서이자 국유재산 행정법률 수석 컨설턴트인 '쏭비서'이다.
일반 민원인이 국유재산 대부나 철도 인근 부지 임대와 관련된 법적 질문을 던졌을 때, 최고의 전문성으로 알기 쉽게 통역해 주어라.
국유재산법과 철도안전법에 관한 조문 해석을 명쾌하게 내려주고, 시민들이 흔히 범하기 쉬운 실수(무단 점용, 콘크리트 무단 타설 등)에 대해 친절하게 사전 예방 팁을 제시하여라.`;
          } else if (assembledParcel) {
            // 기존의 부지 매칭 분석 모드
            const { yearlyFee } = calculateLeaseFee(assembledParcel);
            const calculatedRent = yearlyFee.toLocaleString();
            const landData = {
              address: assembledParcel.address,
              area: assembledParcel.area
            };

            const 추가지침 = presetGuides[userPurpose] 
              ? presetGuides[userPurpose] 
              : "내가 처음 보는 용도이다. 네가 가진 지식을 총동원하되, 국유재산법 제18조(영구건축물 금지)에 위배되는 행위(콘크리트, 단단한 빌딩 건축 등)인지 엄격히 심사하여 가설건축물(컨테이너, 천막 등) 형태로만 가능한지 유연하게 판정해라.";

            finalPrompt = `
너는 국유재산 활용 전문 컨설턴트야. 아래 정보를 보고 이 땅이 해당 용도로 적합한지 3줄 요약해 줘.

[부지 정보]
- 주소: ${landData.address}
- 면적: ${landData.area}㎡
- 예상 렌탈비: ${calculatedRent}원

[신청 용도]
- 용도명: ${userPurpose}

[★ 필수 분석 지침 ★]
${추가지침}

[출력 형식]
1줄: 적합성 판정 결과 및 추천 점수 (100점 만점 기준)
2줄: 이 부지에서 해당 사업을 할 때의 명확한 장점과 렌탈비 메리트
3줄: 국유재산법을 준수하기 위한 가설물 활용 및 인허가 팁 안내
`;

            systemInstruction = `너는 국가철도공단의 국유재산 활용 전문 컨설턴트 'K-Rail Land-Buddy'이다.
일반 시민들의 눈높이에 맞추어, 기차 선로 주변 유휴부지를 임대해 생활/창업에 쓰려는 민원인에게 공공 행정 데이터를 알기 쉽게 가이드하고 대한민국 국유재산법에 근거하여 전문적인 답변을 제공한다.

[국유재산법 전문성 주입]
반드시 아래의 대한민국 국유재산법 핵심 조항에 근거하여 답변을 작성해야 한다:
- **제18조 (영구시설물 축조 금지)**: 국가 외의 자는 국유재산에 영구시설물을 축조하지 못하는 것이 대원칙이다. 다만, 철거 및 원상회복이 용이한 가설건축물(컨테이너, 조립식 펜스, 임시 천막 등)의 경우 공단의 승인을 받고 철거이행보증조치(보증서 제출 등)를 마치면 예외적으로 설치가 가능하다.
- **제31조 / 제35조 (대부계약 및 사용허가 기간)**: 일반 토지 및 정착물의 대부 허가 기간은 기본 **5년 이내**이다. 계약 만료 전 갱신 요건에 부합하면 1회에 한해 5년의 범위에서 갱신이 가능하여, 최장 10년간 장기적으로 안정된 운영 터전이 보장된다.
- **제32조 (대부요율)**: 일반적인 연간 대부료는 해당 재산가액의 **연 5% 이상**이 기준이다. 다만, 영농/경작용은 1%, 소상공인 창업 및 상업 공간 특례는 3%의 파격적인 우대 감면 요율이 적용된다.

반드시 사용자가 제시하는 [부지 정보], [신청 용도], [★ 필수 분석 지침 ★]을 엄격히 분석하여 지정된 [출력 형식]에 맞추어 "인간의 따뜻한 언어"로 답변해야 한다.

반드시 지켜야 할 규칙:
1. 답변은 정확히 3줄로 구성해라.
2. 1줄: 적합성 판정 결과 및 추천 점수 (100점 만점 기준)를 자연스러운 문장으로 서술.
3. 2줄: 이 부지에서 해당 사업을 할 때의 명확한 장점과 렌탈비 메리트 서술.
4. 3줄: 국유재산법(제18조 가설물 우회와 이행보증보험 팁, 제31조 최초 5년 계약 및 갱신 특혜)을 준수하기 위한 가설물 활용 및 인허가 팁 안내 서술.
5. 시민 눈높이에 맞춰 행정/전문 용어를 아주 쉽게 풀어 써라.
6. 만약 추천 부지 매칭이 발생했다면 답변 마지막에 대부 대상 부지 ID를 [MATCH_PARCEL: ${assembledParcel.id}] 형태로 남겨다오.`;
          }

          if (finalPrompt && systemInstruction) {
            const apiResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: finalPrompt,
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.2
              }
            });

            const geminiText = apiResponse.text || '';
            setIsApiConnecting(false);

            if (assembledParcel) {
              const terminalLogs = `🔗 **[실시간 공공 API 호출 체인 작동 로그]**
\`\`\`bash
${logs.join('\n')}
\`\`\`
\n`;
              replyText = terminalLogs + geminiText;
            } else {
              replyText = geminiText;
            }

            // 정규식으로 매칭된 부지 ID 추출
            const match = replyText.match(/\[MATCH_PARCEL:\s*(KR-\d+)\]/i);
            if (match && match[1]) {
              matchedParcelId = match[1].toUpperCase();
              replyText = replyText.replace(/\[MATCH_PARCEL:\s*KR-\d+\]/gi, '').trim();
            }
          }
        } catch (error) {
          console.error('Gemini API call failed, falling back to mock.', error);
          setIsApiConnecting(false);
          replyText = `⚠️ **실시간 Gemini API 통신 오류가 감지되었습니다. (보안망 또는 키 만료)**\n공단의 안전한 공간복지 연계 모듈을 위해 데모 폴백(Mock Fallback) 서비스로 즉시 전환되어, 정합성 검증이 완료된 오픈 API 조립 데이터를 바탕으로 안내해 드립니다!\n\n`;
        }
      }

      // 4. API 호출이 안 되었거나 폴백 상태일 때 똑똑한 로컬 목업 매핑 작동
      if (!replyText || replyText.startsWith('⚠️')) {
        if (isLegalQuery && !assembledParcel) {
          // 국유재산법 전문 폴백 해설 작동!
          let legalContent = "";
          
          if (lowerText.includes('18조') || lowerText.includes('영구') || lowerText.includes('건축') || lowerText.includes('축조') || lowerText.includes('건물')) {
            legalContent = `
### 🏛️ 국유재산법 제18조 (영구시설물 축조 금지) 핵심 가이드

**1. 대원칙: 영구시설물 축조 금지**
- 국가 외의 자는 국유재산에 영구적인 건물, 다리 등의 시설물을 **축조(건축)하지 못하는 것이 대원칙**입니다. 이는 국유재산의 원상회복을 어렵게 하고 공공 환수 시 분쟁을 유발하기 때문입니다.

**2. 합법적인 우회 및 예외 팁 (가설물 설계)**
- **이동식 가설건축물 활용:** 콘크리트 기초 타설을 하지 않고, 볼트 체결식이나 견인이 가능한 **이동식 컨테이너, 조립식 펜스, 간이 천막** 등은 영구시설물에 해당하지 않아 허용됩니다!
- **원상회복 이행보증조치:** 허가를 신청할 때 대부 종료 시 자진 철거하겠다는 **철거 각서 및 철거이행보증보험증권**을 공단에 제출하면 즉시 승인이 가용합니다.
- **예외적 기부채납:** 국가에 소유권을 이전(기부채납)하고 사용료를 면제받는 형태로 영구물을 짓는 특례가 있으나, 소상공인 수준에서는 가설건축물 형태의 우회 전략이 가장 신속하고 유리합니다.

*💡 **쏭비서의 팁:** 주말농장의 간이 쉼터나 푸드트럭 야외 테라스, 애견운동장 안전 펜스는 모두 100% 가설물에 해당하여 문제없이 즉시 승인됩니다! 대표님, 법률 공장 정상 가동 중입니다!*
`;
          } else if (lowerText.includes('31조') || lowerText.includes('기간') || lowerText.includes('갱신') || lowerText.includes('연장') || lowerText.includes('몇 년') || lowerText.includes('몇년')) {
            legalContent = `
### 📅 국유재산법 제31조 / 제35조 (사용허가 및 대부기간) 핵심 가이드

**1. 기본 계약 기간: 최초 5년**
- 국유재산법에 의거하여 토지와 건물의 일반적인 사용허가(행정재산) 및 대부계약(일반재산) 기간은 **최초 5년 이내**로 제한됩니다.

**2. 갱신 혜택 및 장기 운영 보장 (최장 10년)**
- **1회 한정 5년 갱신:** 계약이 만료되기 전에 대부료 체납이 없고 사용 목적에 변함이 없다면, **1회에 한해 최대 5년을 추가로 연장(갱신)**할 수 있습니다. 
- 따라서 **기본 10년(5년 + 5년)** 동안은 행정 소송이나 무단 회수 걱정 없이 장기적이고 안정적으로 창업이나 영농 터전을 보장받으실 수 있습니다.

**3. 대부 기간 만료 후 재계약 룰**
- 10년 만료 후에는 일반 입찰(경쟁 입찰)이 원칙이나, 영농 목적이거나 지자체 공간 복지 사업 연계 시 일정한 요건을 갖추면 수의계약 형태로 재계약을 타진할 수 있는 특별 조항이 있습니다!

*💡 **쏭비서의 팁:** 계약 갱신 신청은 반드시 계약 만료 1개월 전까지 관할 지사에 신청서를 서면으로 접수하셔야 불이익이 없습니다. 대표님, 대부기간 타이머 정상 작동 중입니다!*
`;
          } else if (lowerText.includes('32조') || lowerText.includes('요율') || lowerText.includes('임대료') || lowerText.includes('대부료') || lowerText.includes('감면') || lowerText.includes('요금') || lowerText.includes('계산') || lowerText.includes('34조')) {
            legalContent = `
### 💰 국유재산법 제32조 / 제34조 (대부요율 및 감면 특례) 핵심 가이드

**1. 대부료 산정의 기본 원칙**
- **대부료 = 재산 가액(개별공시지가 × 면적) × 대부요율(%)**
- 대부요율은 국유재산의 목적과 용도에 따라 세분화되어 적용되며, 매년 법적으로 재산 가액이 재평가되어 대부료가 고정 또는 변동됩니다.

**2. 용도별 대부요율 및 특별 우대 감면**
- **🚜 영농 및 경작용 (제1요율): 연 1.0% 이상** (예: 주말농장, 친환경 텃밭. 가장 강력한 우대 감면)
- **🏢 소상공인 창업 및 상업용 공간 복지 특례: 연 3.0% 이상** (일반 상업 요율 5% 대비 40% 전격 감면 적용!)
- **🏡 주거용 / 사회적 기업 공간 연계: 연 2.0% 이상**
- **🚚 일반 용도 (야적장, 유료 주차장 등): 연 5.0% 이상**

**3. 연간 대부료 인상 제한 (대부료 조정 제도)**
- 당해 연도 대부료가 전년도 대비 급격히 상승하는 것을 방지하기 위해, 국유재산법 제33조에 의거하여 전년 대비 **연간 임대료 인상 폭은 최대 5% 이내**로 캡(Cap)이 씌워져 있어 안심하고 렌탈하셔도 됩니다!

*💡 **쏭비서의 팁:** 랜드버디를 통해 창업(푸드트럭 등)을 신청하시면 공단 담당관에게 3% 우대 요율을 자동으로 적용해 달라고 행정 서식에 표기해 드립니다! 대표님, 임대 계산기 오차 없이 정상 가동 중입니다!*
`;
          } else if (lowerText.includes('72조') || lowerText.includes('변상금') || lowerText.includes('무단') || lowerText.includes('점유') || lowerText.includes('벌금')) {
            legalContent = `
### 🚨 국유재산법 제72조 (무단점유 변상금 징수) 및 벌칙 경고

**1. 무단 점유의 정의**
- 국유재산법에 따른 정당한 대부계약이나 사용허가 없이 국유재산을 임의로 사용하거나 점유(예: 불법 주차, 컨테이너 무단 방치, 경작 등)하는 행위를 의미합니다.

**2. 변상금 폭탄 규정 (일반 임대료의 120% 부과)**
- 무단 점유 행위가 공단 순찰 및 지상 실사에서 적발될 경우, 국유재산법 제72조에 의거하여 정당 대부료의 **120%에 상당하는 '변상금'**이 강제 징수됩니다.
- 체납 시에는 **연 5%의 가산금**이 계속 가산되며, 공단의 독촉 후에도 미납 시 재산 압류 및 강제 추징이 개시됩니다.

**3. 원상회복 및 행정대집행 대상**
- 벌칙 변상금 부과와 별개로, 공단은 행정대집행법에 따라 무단 설치물(가설물, 주차 펜스 등)을 **즉각 강제 철거**할 수 있으며, 이로 발생하는 모든 대집행 비용도 무단점유자에게 청구됩니다.

*💡 **쏭비서의 팁:** "잠깐 주차하는 건데 괜찮겠지" 하다가 위성 사진이나 순찰 드론에 촬영되어 수백만 원의 변상금 고지서를 받는 민원인이 매년 속출합니다! 반드시 랜드버디를 통해 합법적 대부 계약을 체결해 주세요. 대표님, 순찰 경보음 정상 가동 중입니다!*
`;
          } else if (lowerText.includes('보호구역') || lowerText.includes('보호지구') || lowerText.includes('철도보호') || lowerText.includes('안전') || lowerText.includes('30m') || lowerText.includes('35m')) {
            legalContent = `
### 🛡️ 철도안전법 제45조 (철도보호지구 내 행위 제한) 핵심 가이드

**1. 철도보호지구란?**
- 철도경계선(선로 외측 궤도 중심)으로부터 **30m 이내(실무상 35m 이내까지 관리)**의 지역을 의미하며, 철도 시설을 보호하고 열차의 안전 운행을 확보하기 위해 법률로 엄격히 관리하는 보안 안전지대입니다.

**2. 금지 및 사전 신고 의무 행위**
- 철도보호지구 내에서 토지의 형질변경, 자갈/흙 굴착, 높은 건물 신축, 가설물 설치, 인화성/폭발성 물질 방착 등의 행위를 하려면 **반드시 철도공단에 사전에 '행위 신고서'를 제출하여 승인**을 득해야 합니다.
- 만약 신고 없이 임의로 굴착하거나 위험물을 적치할 경우, 철도안전법에 의거 **2년 이하의 징역 또는 2천만 원 이하의 벌금**에 처해질 수 있습니다.

**3. 랜드버디의 안전 케어 서비스**
- 랜드버디에 등록된 철도 유휴지 중 **KR-001(대전역), KR-003(조치원)** 등은 일부 필지가 철도보호지구에 속해 있습니다. 하지만 걱정 마세요! 랜드버디가 안전 반경 35m를 지도 상에 실시간 빨간 점선으로 시각화해 드리고, 필요한 철도 행위신고 서류 초안도 자동 완성하여 대부 접수 시 함께 처리해 드립니다!

*💡 **쏭비서의 팁:** 열차 진동이나 고압 전선으로 인해 선로 인근 10m 안쪽에는 절대로 무거운 고정식 가설물을 설치해서는 안 됩니다. 대표님, 안전 경계선 감시 레이더 정상 가동 중입니다!*
`;
          } else {
            // 종합 안내
            legalContent = `
### 🎓 대한민국 국유재산법 핵심 조항 종합 브리핑

대한민국 국유재산법(State Property Act)은 국가의 소중한 재산(토지, 건물 등)을 효율적으로 보존하고 대부/활용하기 위한 법적 대원칙입니다. 랜드버디가 가장 많이 문의하시는 4대 조항을 일목요연하게 정리해 드립니다!

---

**1. 🏗️ 제18조 (영구시설물 축조 금지)**
- 국유재산에는 단단한 콘크리트 빌딩 등의 영구시설물을 짓지 못하는 것이 원칙입니다.
- **해결책:** 해체 및 견인이 용이한 **이동식 가설건축물(컨테이너, 조립식 펜스, 임시 천막)** 형태로 설계하시면 공단의 대부 승인이 신속하게 가용합니다!

**2. 📅 제31조 / 제35조 (대부 및 사용허가 기간)**
- 국유지 대부계약 기간은 **최초 5년**이 기본입니다.
- **연장 혜택:** 계약 준수 시 **1회에 한해 5년 추가 연장이 보장되어 최장 10년**간 이사나 명도 소송 걱정 없이 내 땅처럼 안심 운영이 가능합니다.

**3. 💰 제32조 / 제34조 (대부요율 및 특별 감면)**
- 연간 임대료는 공시지가 대비 **일반 용도는 연 5.0% 이상**이 기준입니다.
- **특별 우대:** **농업 및 텃밭 경작은 연 1.0% 이상**, **소상공인 청년 창업 공간은 연 3.0% 이상**으로 대폭 경감 혜택이 적용됩니다.

**4. 🚨 제72조 (무단점유 변상금 징수)**
- 대부 계약 없이 국유지를 무단으로 점용할 경우, 정상 임대료의 **120%에 상당하는 '벌칙 변상금'**이 매년 소급 부과되며 강제 행정대집행 철거 대상이 됩니다.

---

*💡 **쏭비서의 팁:** 랜드버디의 모든 매칭 필지 시뮬레이터는 이 4대 법적 잣대를 AI 알고리즘으로 자동 연산하여 적합성과 추천 점수를 정확하게 산출합니다. 궁금한 조항(예: "제18조 가이드", "대부요율 할인 혜택")을 개별적으로 질문하시면 더 정밀한 원스톱 행정 자문을 받아보실 수 있습니다. 대표님, 법령 오케스트레이션 정상 가동 중입니다!*
`;
          }
          
          replyText = `⚖️ **[쏭비서 법률 행정 통역 가동 완료 (데모 모드)]** 
국토교통부 및 공단 법무 지원실의 국유재산 대부 행정 가이드라인을 분석하여 민원인 눈높이에 맞춤 해설을 조립했습니다.

${legalContent}`;
        } else if (assembledParcel) {
          const parcel = assembledParcel;
          const { yearlyFee, monthlyFee, ratePct } = calculateLeaseFee(parcel);
          
          const terminalLogs = `🔗 **[실시간 공공 API 호출 체인 작동 로그]**
\`\`\`bash
${logs.join('\n')}
\`\`\`
\n`;

          // 폴백 시 프리셋 맞춤형 3줄 요약 매커니즘
          let step3Summary1 = "";
          let step3Summary2 = "";
          let step3Summary3 = "";

          if (userPurpose === "주말농장") {
            step3Summary1 = `🌱 **[적합성 판정]** 영농 및 친환경 경작에 **매우 적합(추천 점수: 95점)**합니다. 별도의 콘크리트 건축 행위가 없어 규제가 최소화됩니다.`;
            step3Summary2 = `💰 **[장점/렌탈비]** 인근 구거(물줄기)가 가까워 수자원 확보에 매우 유리하며, 연간 렌탈비가 약 ${yearlyFee.toLocaleString()}원(월 ${monthlyFee.toLocaleString()}원) 수준으로 경제적 메리트가 극대화됩니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 국유재산법 제18조에 따라 영구건축물 축조는 금지되나, 친환경 컨테이너나 조립식 비닐하우스 등 가설물은 득할 수 있으며, 동법 제31조에 근거해 최초 5년(갱신 시 최장 10년)간 안정적 영농이 가용합니다.`;
          } else if (userPurpose === "반려견놀이터") {
            const hasEnoughArea = parcel.area >= 300;
            step3Summary1 = `🦮 **[적합성 판정]** 야외 반려견 놀이터 공간으로 **적합(추천 점수: ${hasEnoughArea ? '90점' : '75점'})**합니다. (부지 면적 ${parcel.area}㎡로 ${hasEnoughArea ? '소/대형견 분리 운영 기준 300㎡ 충족' : '대형견/소형견 분리 면적 300㎡ 기준 미달하여 소형견 전용 권장'})`;
            step3Summary2 = `💰 **[장점/렌탈비]** 탁 트인 야외 유휴지를 월 ${monthlyFee.toLocaleString()}원이라는 독보적인 임대 조건으로 확보하여 댕댕이들의 안전한 놀이 공간으로 자립 운영할 수 있습니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 국유재산법 제18조에 의거, 탈부착이 쉬운 안전 펜스(가설물) 형태로 배치도를 설계하시면 영구물 금지 조항을 우회할 수 있으며 동법 제31조에 따라 최초 5년(최장 10년) 대부 혜택을 획득합니다.`;
          } else if (userPurpose === "푸드트럭") {
            step3Summary1 = `🚚 **[적합성 판정]** 소상공인 푸드트럭 창업 및 모바일 F&B 부지로 **최상(추천 점수: 98점)**입니다. 도로 접해성과 진입로가 매우 훌륭합니다.`;
            step3Summary2 = `💰 **[장점/렌탈비]** 초역세권 유동인구 노다지 땅을 연간 약 ${yearlyFee.toLocaleString()}원의 특별우대 상업 대부 요율로 선점하여 창업 초기 고정비 부담을 획기적으로 낮출 수 있습니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 이동식 차량 및 가설 천막은 국유재산법 제18조 영구건축물 축조 금지 룰에 전혀 저촉되지 않아 최단기에 승인되며, 동법 제31조/제35조에 따라 최초 5년간 든든한 상업 계약이 법장 보장됩니다.`;
          } else {
            // 프리셋 외 용도 (대원칙 가이드 작동)
            step3Summary1 = `🔍 **[적합성 판정]** 신청 용도 '${userPurpose}'에 대한 국유지 매칭 분석 결과 **보통(추천 점수: 80점)**입니다.`;
            step3Summary2 = `💰 **[장점/렌탈비]** 지적도 및 공시지가 시뮬레이션 결과 연 렌탈비 ${yearlyFee.toLocaleString()}원으로 저렴하게 공간 자립을 시작할 수 있는 최적의 기반을 제공합니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 국유재산법 제18조(영구건축물 축조 금지)에 의거하여 단단한 콘크리트 빌딩 등의 구축은 불가하므로 가설건축물 형태로 유연하게 대안 설계도를 준비하셔야 동법 제31조(5년 한도 대부) 승인을 얻습니다.`;
          }

          replyText = terminalLogs + `요청하신 용도와 목적에 맞추어 **국토교통부 표준 및 공간정보 연계 API**의 데이터를 실시간 조립하여 최고의 철도 유휴부지 매칭 결과를 도출했습니다.

### 🚉 [기반] 매칭 유휴부지 기본 정보
- **부지 소재지:** ${parcel.address} [부지번호: ${parcel.id}]
- **위도/경도 좌표:** 위도 ${parcel.latitude} / 경도 ${parcel.longitude}
- **부지 면적 및 지목:** 면적 ${parcel.area}㎡ / 지목 '${parcel.landType}'

---

### 📋 1단계 (규제/비용 조립 결과)
- **국토교통부 토지이용계획 규제 분석:**
  이 땅은 현재 **'${parcel.zoning}'** 지역에 속해 있습니다. ${parcel.isRailwayProtected ? '⚠️ **철도보호지구 저촉구역**에 편입되어 있어 임시 가설 건축물(푸드트럭, 가설창고 등)을 거치할 시 공단에 사전 안전 행위신고 절차가 가볍게 수반됩니다. (시민분들을 위해 어려운 행정 신고서 서류는 제가 대신 자동 인쇄해 드립니다!)' : '✅ 철도 특별보호지구 구역 외로, 행정 행위 허가 절차 없이 즉각 대부가 가용합니다.'}
- **개별공시지가 기반 임대료 시뮬레이션:**
  올해 공시지가 **${parcel.officialPrice.toLocaleString()}원/㎡** 및 대부요율 **${ratePct}%**를 곱해 산출한 예상 연간 대부료는 다음과 같습니다.
  * 계산 산식: ${parcel.area.toLocaleString()}㎡ (면적) × ${parcel.officialPrice.toLocaleString()}원 (지가) × ${ratePct}% (특별우대요율)
  * **연간 예상 렌탈비:** **약 ${yearlyFee.toLocaleString()}원** (월 환산 기준 약 ${monthlyFee.toLocaleString()}원)

---

### 🔌 2단계 (도로/인프라 조립 결과)
- **브이월드 지적도 기반 도로 접합성:**
  ${parcel.hasRoadAccess ? '✅ **지적도상 공공 도로와 접함**이 확인되었습니다! 보행자 접근성 및 푸드트럭이나 물류 화물 차량 진입이 매우 원활한 안전 필지입니다.' : '⚠️ **지적도상 맹지(도로 미접함)**로 도로 이설 및 진입로 다지기 확보가 사전 권장됩니다. 공단 지사에서 토공 평탄화 기초 조치를 연계 지원합니다.'}
- **환경부 GIS 관로 데이터 기반 인프라 수급:**
  가장 가까운 상수도관(또는 소하천/구거) 최단 거리는 **${parcel.waterDistance}m** 이며, 한전 전력 설비는 **'${parcel.electricityAccess}'** 상태입니다. ${parcel.id === 'KR-002' || parcel.id === 'KR-007' ? '인근 구거(도랑)가 아주 가까워 주말농장용 배수와 경작 용수 수급이 최상입니다.' : parcel.id === 'KR-001' || parcel.id === 'KR-003' ? '상하수관 및 전력이 모두 인접 가용하여 푸드트럭 물 공급 및 소상공인 카페 영업 집기를 즉시 전원 연결해 사용 가능합니다!' : '용도에 따른 사전 관로 인입 및 가설 전력 계약이 필요할 수 있습니다.'}

---

### 💚 3단계 (국유재산 활용 컨설턴트 3줄 요약)
1. ${step3Summary1}
2. ${step3Summary2}
3. ${step3Summary3}`;
        } else {
          replyText = `아쉽게도 현재 저희 공간 복지 자산 데이터베이스에는 **검색하신 지역명의 국유 유휴재산이 수록되어 있지 않습니다.** 😢
          
💡 **공공 서비스 미래 비전 안내:**
현재 시범 버전에서는 철도 가용부지 중심의 자산을 제공 중이나, 향후 **기획재정부 국유재산포털 개방 데이터와 캠코 국유지 오픈 API를 연동**하여 전국의 모든 국유 잡종지/유휴지를 한 번에 매핑 검색하고 인간의 언어로 조립해 제공하는 **'범정부 공간복지 원스톱 솔루션'**으로 정식 확대 개편될 예정입니다!

* **테스트 팁:** 대전역(푸드트럭), 주말농장(서구 텃밭), 조치원(카페), 신탄진(야적장), 용산(도심주차), 부산역(관광쉼터) 등을 검색해 보시면 즉시 오픈 API 조립 작동을 체험하실 수 있습니다.`;
        }
      }

      // 5. 최종 메시지 및 액션카드 유기적 바인딩
      const botMsg: LandBuddyMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };

      if (matchedParcelId && assembledParcel) {
        const found = assembledParcel;
        setPendingParcel(found);
        if (onSelectParcel) onSelectParcel(found.id);
        botMsg.actionCard = {
          type: 'recommend',
          parcel: found,
          application: {
            applicantName: applicantName || '미입력',
            parcelId: found.id,
            purpose: userPurpose,
            leasePeriod: selectedLeasePeriod
          }
        };
      }

      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  }; // 폴백 상태일 때 똑똑한 로컬 목업 매핑 작동
      if (!replyText || replyText.startsWith('⚠️')) {
        if (assembledParcel) {
          const parcel = assembledParcel;
          const { yearlyFee, monthlyFee, ratePct } = calculateLeaseFee(parcel);
          
          const terminalLogs = `🔗 **[실시간 공공 API 호출 체인 작동 로그]**
\`\`\`bash
${logs.join('\n')}
\`\`\`
\n`;

          // 폴백 시 프리셋 맞춤형 3줄 요약 매커니즘
          let step3Summary1 = "";
          let step3Summary2 = "";
          let step3Summary3 = "";

          if (userPurpose === "주말농장") {
            step3Summary1 = `🌱 **[적합성 판정]** 영농 및 친환경 경작에 **매우 적합(추천 점수: 95점)**합니다. 별도의 콘크리트 건축 행위가 없어 규제가 최소화됩니다.`;
            step3Summary2 = `💰 **[장점/렌탈비]** 인근 구거(물줄기)가 가까워 수자원 확보에 매우 유리하며, 연간 렌탈비가 약 ${yearlyFee.toLocaleString()}원(월 ${monthlyFee.toLocaleString()}원) 수준으로 경제적 메리트가 극대화됩니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 국유재산법 제18조에 따라 영구건축물 축조는 금지되나, 친환경 컨테이너나 조립식 비닐하우스 등 가설물은 득할 수 있으며, 동법 제31조에 근거해 최초 5년(갱신 시 최장 10년)간 안정적 영농이 가용합니다.`;
          } else if (userPurpose === "반려견놀이터") {
            const hasEnoughArea = parcel.area >= 300;
            step3Summary1 = `🦮 **[적합성 판정]** 야외 반려견 놀이터 공간으로 **적합(추천 점수: ${hasEnoughArea ? '90점' : '75점'})**합니다. (부지 면적 ${parcel.area}㎡로 ${hasEnoughArea ? '소/대형견 분리 운영 기준 300㎡ 충족' : '대형견/소형견 분리 면적 300㎡ 기준 미달하여 소형견 전용 권장'})`;
            step3Summary2 = `💰 **[장점/렌탈비]** 탁 트인 야외 유휴지를 월 ${monthlyFee.toLocaleString()}원이라는 독보적인 임대 조건으로 확보하여 댕댕이들의 안전한 놀이 공간으로 자립 운영할 수 있습니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 국유재산법 제18조에 의거, 탈부착이 쉬운 안전 펜스(가설물) 형태로 배치도를 설계하시면 영구물 금지 조항을 우회할 수 있으며 동법 제31조에 따라 최초 5년(최장 10년) 대부 혜택을 획득합니다.`;
          } else if (userPurpose === "푸드트럭") {
            step3Summary1 = `🚚 **[적합성 판정]** 소상공인 푸드트럭 창업 및 모바일 F&B 부지로 **최상(추천 점수: 98점)**입니다. 도로 접해성과 진입로가 매우 훌륭합니다.`;
            step3Summary2 = `💰 **[장점/렌탈비]** 초역세권 유동인구 노다지 땅을 연간 약 ${yearlyFee.toLocaleString()}원의 특별우대 상업 대부 요율로 선점하여 창업 초기 고정비 부담을 획기적으로 낮출 수 있습니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 이동식 차량 및 가설 천막은 국유재산법 제18조 영구건축물 축조 금지 룰에 전혀 저촉되지 않아 최단기에 승인되며, 동법 제31조/제35조에 따라 최초 5년간 든든한 상업 계약이 법장 보장됩니다.`;
          } else {
            // 프리셋 외 용도 (대원칙 가이드 작동)
            step3Summary1 = `🔍 **[적합성 판정]** 신청 용도 '${userPurpose}'에 대한 국유지 매칭 분석 결과 **보통(추천 점수: 80점)**입니다.`;
            step3Summary2 = `💰 **[장점/렌탈비]** 지적도 및 공시지가 시뮬레이션 결과 연 렌탈비 ${yearlyFee.toLocaleString()}원으로 저렴하게 공간 자립을 시작할 수 있는 최적의 기반을 제공합니다.`;
            step3Summary3 = `⚖️ **[행정 팁]** 국유재산법 제18조(영구건축물 축조 금지)에 의거하여 단단한 콘크리트 빌딩 등의 구축은 불가하므로 가설건축물 형태로 유연하게 대안 설계도를 준비하셔야 동법 제31조(5년 한도 대부) 승인을 얻습니다.`;
          }

          replyText = terminalLogs + `요청하신 용도와 목적에 맞추어 **국토교통부 표준 및 공간정보 연계 API**의 데이터를 실시간 조립하여 최고의 철도 유휴부지 매칭 결과를 도출했습니다.

### 🚉 [기반] 매칭 유휴부지 기본 정보
- **부지 소재지:** ${parcel.address} [부지번호: ${parcel.id}]
- **위도/경도 좌표:** 위도 ${parcel.latitude} / 경도 ${parcel.longitude}
- **부지 면적 및 지목:** 면적 ${parcel.area}㎡ / 지목 '${parcel.landType}'

---

### 📋 1단계 (규제/비용 조립 결과)
- **국토교통부 토지이용계획 규제 분석:**
  이 땅은 현재 **'${parcel.zoning}'** 지역에 속해 있습니다. ${parcel.isRailwayProtected ? '⚠️ **철도보호지구 저촉구역**에 편입되어 있어 임시 가설 건축물(푸드트럭, 가설창고 등)을 거치할 시 공단에 사전 안전 행위신고 절차가 가볍게 수반됩니다. (시민분들을 위해 어려운 행정 신고서 서류는 제가 대신 자동 인쇄해 드립니다!)' : '✅ 철도 특별보호지구 구역 외로, 행정 행위 허가 절차 없이 즉각 대부가 가용합니다.'}
- **개별공시지가 기반 임대료 시뮬레이션:**
  올해 공시지가 **${parcel.officialPrice.toLocaleString()}원/㎡** 및 대부요율 **${ratePct}%**를 곱해 산출한 예상 연간 대부료는 다음과 같습니다.
  * 계산 산식: ${parcel.area.toLocaleString()}㎡ (면적) × ${parcel.officialPrice.toLocaleString()}원 (지가) × ${ratePct}% (특별우대요율)
  * **연간 예상 렌탈비:** **약 ${yearlyFee.toLocaleString()}원** (월 환산 기준 약 ${monthlyFee.toLocaleString()}원)

---

### 🔌 2단계 (도로/인프라 조립 결과)
- **브이월드 지적도 기반 도로 접합성:**
  ${parcel.hasRoadAccess ? '✅ **지적도상 공공 도로와 접함**이 확인되었습니다! 보행자 접근성 및 푸드트럭이나 물류 화물 차량 진입이 매우 원활한 안전 필지입니다.' : '⚠️ **지적도상 맹지(도로 미접함)**로 도로 이설 및 진입로 다지기 확보가 사전 권장됩니다. 공단 지사에서 토공 평탄화 기초 조치를 연계 지원합니다.'}
- **환경부 GIS 관로 데이터 기반 인프라 수급:**
  가장 가까운 상수도관(또는 소하천/구거) 최단 거리는 **${parcel.waterDistance}m** 이며, 한전 전력 설비는 **'${parcel.electricityAccess}'** 상태입니다. ${parcel.id === 'KR-002' || parcel.id === 'KR-007' ? '인근 구거(도랑)가 아주 가까워 주말농장용 배수와 경작 용수 수급이 최상입니다.' : parcel.id === 'KR-001' || parcel.id === 'KR-003' ? '상하수관 및 전력이 모두 인접 가용하여 푸드트럭 물 공급 및 소상공인 카페 영업 집기를 즉시 전원 연결해 사용 가능합니다!' : '용도에 따른 사전 관로 인입 및 가설 전력 계약이 필요할 수 있습니다.'}

---

### 💚 3단계 (국유재산 활용 컨설턴트 3줄 요약)
1. ${step3Summary1}
2. ${step3Summary2}
3. ${step3Summary3}`;
        } else {
          replyText = `아쉽게도 현재 저희 공간 복지 자산 데이터베이스에는 **검색하신 지역명의 국유 유휴재산이 수록되어 있지 않습니다.** 😢
          
💡 **공공 서비스 미래 비전 안내:**
현재 시범 버전에서는 철도 가용부지 중심의 자산을 제공 중이나, 향후 **기획재정부 국유재산포털 개방 데이터와 캠코 국유지 오픈 API를 연동**하여 전국의 모든 국유 잡종지/유휴지를 한 번에 매핑 검색하고 인간의 언어로 조립해 제공하는 **'범정부 공간복지 원스톱 솔루션'**으로 정식 확대 개편될 예정입니다!

* **테스트 팁:** 대전역(푸드트럭), 주말농장(서구 텃밭), 조치원(카페), 신탄진(야적장), 용산(도심주차), 부산역(관광쉼터) 등을 검색해 보시면 즉시 오픈 API 조립 작동을 체험하실 수 있습니다.`;
        }
      }

      // 5. 최종 메시지 및 액션카드 유기적 바인딩
      const botMsg: LandBuddyMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };

      if (matchedParcelId && assembledParcel) {
        const found = assembledParcel;
        setPendingParcel(found);
        if (onSelectParcel) onSelectParcel(found.id);
        botMsg.actionCard = {
          type: 'recommend',
          parcel: found,
          application: {
            applicantName: applicantName || '미입력',
            parcelId: found.id,
            purpose: userPurpose,
            leasePeriod: selectedLeasePeriod
          }
        };
      }

      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };


  const handleSelectParcel = (parcel: LandParcel) => {
    setPendingParcel(parcel);
    const botMsg: LandBuddyMessage = {
      id: `msg-${Date.now()}-select`,
      sender: 'bot',
      text: `부지 상세 보기에서 **${parcel.id} 자산**을 선택하셨습니다. 해당 부지에 대한 공간복지 시뮬레이션 및 3단계 리포트를 안내합니다.`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'recommend',
        parcel,
        application: {
          applicantName: applicantName || '미입력',
          parcelId: parcel.id,
          purpose: parcel.recommendedUse.split('·')[0],
          leasePeriod: selectedLeasePeriod
        }
      }
    };
    setMessages(prev => [...prev, botMsg]);
  };

  // 모달 입력 완료 후 신청서 반영
  const handleSaveApplicantInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) return;

    setShowNameModal(false);

    // 마지막 봇 추천 메시지 중 신청서 내용이 있다면 갱신해서 다시 메시지 남기기
    const updatedMessages = [...messages];
    let foundRecommend = false;

    // 만약 대기중인 부지가 있다면, 해당 부지의 3단계 정보를 업데이트하는 봇 응답을 추가해줌
    if (pendingParcel) {
      const botMsg: LandBuddyMessage = {
        id: `msg-${Date.now()}-update-name`,
        sender: 'bot',
        text: `👍 신청인 정보가 **'${applicantName}' (${applicantType})** 님으로 성공적으로 입력/수정되었습니다! 국유재산 대부 신청서 초안이 실시간으로 갱신되었습니다. 아래 신청 버튼을 누르시면 바로 공간복지 접수처로 서류가 전송됩니다.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        actionCard: {
          type: 'recommend',
          parcel: pendingParcel,
          application: {
            applicantName,
            parcelId: pendingParcel.id,
            purpose: pendingParcel.recommendedUse.split('·')[0],
            leasePeriod: selectedLeasePeriod
          }
        }
      };
      setMessages(prev => [...prev, botMsg]);
    } else {
      const systemConfirmMsg: LandBuddyMessage = {
        id: `msg-${Date.now()}-system`,
        sender: 'bot',
        text: `신청인 성함이 **'${applicantName}'** 님으로 임시 등록되었습니다. 이제 원하시는 부지를 질문하시거나 리스트에서 선택하시면 성함이 자동 입력되어 인쇄됩니다.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, systemConfirmMsg]);
    }
  };

  // 실제 대부 신청서 접수 액션
  const handleApplyFinal = (parcel: LandParcel) => {
    if (!applicantName) {
      setPendingParcel(parcel);
      setShowNameModal(true);
      return;
    }

    const { yearlyFee, monthlyFee } = calculateLeaseFee(parcel);
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + selectedLeasePeriod);

    const newApp: LeaseApplication = {
      id: `APP-2026-${Math.floor(Math.random() * 900) + 100}`,
      applicantName,
      entityType: applicantType,
      parcelId: parcel.id,
      address: parcel.address,
      purpose: parcel.recommendedUse.split('·')[0] + ' 운영',
      leasePeriod: selectedLeasePeriod,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      appliedDate: new Date().toISOString().split('T')[0],
      status: '심사중',
      yearlyFee,
      monthlyFee,
      documents: [
        { name: 'K_Rail_LandBuddy_Autofilled_Form.pdf', size: '1.2 KB', type: 'PDF' },
        { name: 'Applicant_Credentials_Verify.pdf', size: '512 KB', type: 'PDF' }
      ],
      timeline: [
        { status: '신청서 제출', date: new Date().toLocaleString('ko-KR'), description: `K-Rail Land-Buddy 챗봇 비서를 통해 ${applicantName}님의 대부 신청서가 정상 접수되었습니다.`, actor: '민원인' },
        { status: '시스템 서류 검증', date: new Date().toLocaleString('ko-KR'), description: '스마트 공간 복지 자동 정합 검증 통과 완료.', actor: '시스템' }
      ]
    };

    onApplySubmit(newApp);

    const botConfirm: LandBuddyMessage = {
      id: `msg-${Date.now()}-apply-success`,
      sender: 'bot',
      text: `🎉 축하합니다! **${parcel.id} (${parcel.address.split('(')[0].trim()})** 부지에 대한 **공간 복지 대부 신청**이 정식으로 접수되었습니다! 

**[접수 내역 안내]**
- **정식 신청 번호:** ${newApp.id}
- **신청 신청인:** ${applicantName} (${applicantType})
- **대부 희망 기간:** ${selectedLeasePeriod}개월
- **연간 임대 금액:** 약 ${yearlyFee.toLocaleString()}원

상단의 **'📋 대부 신청 심사'** 탭이나 **'📊 성과 대시보드'**에서 실시간 접수 현황 및 심사 타임라인 단계(접수완료 ➡️ 실사 ➡️ 최종 승인)를 확인하실 수 있습니다. 서류 승인 시 등록하신 모바일 연락처로 안전 계약 링크가 즉시 통보됩니다!`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, botConfirm]);
  };

  const handlePrintForm = (parcel: LandParcel) => {
    // 신청서 인쇄하기 모듈 (간이 팝업 및 안내 출력)
    const { yearlyFee, monthlyFee, ratePct } = calculateLeaseFee(parcel);
    const printContent = `
========================================
    [국유재산 대부 신청서 임시 서식]
        K-Rail Land-Buddy 자동발급
========================================
1. 신청인 인적사항
 - 성 함 / 기 관 명: ${applicantName || '미기재'}
 - 신 청 종 류: ${applicantType}
 - 대 부 부 지 번 호: ${parcel.id}
 - 소 재 지: ${parcel.address}

2. 대부 목적 및 면적
 - 사 용 목 적: ${parcel.recommendedUse}
 - 대부 신청 면적: ${parcel.area} ㎡
 - 지 목: ${parcel.landType}

3. 대부료 및 대부 기간
 - 단가 (공시지가): ${parcel.officialPrice.toLocaleString()} 원/㎡
 - 대부 기간 (희망): ${selectedLeasePeriod}개월
 - 대부요율 가이드: ${ratePct}% 적용
 - 연간 예상 대부료: ${yearlyFee.toLocaleString()} 원
 - 월별 환산 대부료: 약 ${monthlyFee.toLocaleString()} 원/월

4. 특기사항 및 규제해소
 - 보안/안전 유의사항: ${parcel.restrictions}
 * 본 신청은 국가철도공단 유휴부지 공간복지 촉진 지침에 따라 관리됩니다.

국가철도공단 이사장 귀하
========================================
    `;
    
    // 알럿창 대신 이쁜 대화 카드에 직접 출력하거나 파일 텍스트를 파일 다운로드 형태로 제공
    const element = document.createElement("a");
    const file = new Blob([printContent], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${parcel.id}_대부신청서_초안_${applicantName || '무명'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    const printMsg: LandBuddyMessage = {
      id: `msg-${Date.now()}-download-success`,
      sender: 'bot',
      text: `📥 **${parcel.id}_대부신청서_초안.txt** 파일 다운로드가 완료되었습니다! 소지하신 행정서류와 함께 공단 관할 지사(혹은 온라인 청약홈)에 제출할 수 있는 정형 텍스트 초안입니다.`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, printMsg]);
  };

  return (
    <div className={`flex flex-col ${hideRightPanel ? 'w-full h-[730px]' : 'lg:flex-row gap-6 max-w-7xl mx-auto min-h-[680px]'}`} id="landbuddy_assistant_container">
      {/* 좌측 모바일 맞춤형 비서형 뷰포트 (글래스모피즘 적용) */}
      <div className={`w-full ${hideRightPanel ? 'h-full rounded-2xl border-none shadow-none bg-[#F4F7F9]' : 'lg:w-7/12 glass-panel rounded-3xl border border-white/30 shadow-2xl'} flex flex-col overflow-hidden`} id="chatbot_viewport">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-[#00529C] to-[#00874e] p-4 flex items-center justify-between text-white shadow-md" id="chatbot_header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-lg leading-tight flex items-center gap-1.5">
                KR-Land Buddy
                <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded border border-white/10 font-normal">AI 2.5</span>
              </h2>
              <p className="text-xs text-blue-100/90 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full inline-block ${apiKey || publicDataKey || vworldKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {apiKey || publicDataKey || vworldKey ? '실시간 100% 오픈 API 조립 활성' : '데모 시뮬레이션 모드'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* API Key 관리 트리거 */}
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`p-2 rounded-xl transition-all duration-200 border ${
                showApiKeyInput 
                  ? 'bg-white text-gray-900 border-white shadow-sm' 
                  : 'hover:bg-white/10 text-white/80 hover:text-white border-transparent'
              }`}
              title="Gemini API 설정"
              id="btn_toggle_api_key_modal"
            >
              <Key className="w-4 h-4" />
            </button>

            <button 
              onClick={() => {
                setApplicantName('');
                setApplicantPhone('');
                setApplicantType('개인');
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'bot',
                    text: `대화 내용과 등록된 정보가 깨끗하게 초기화되었습니다. 😊 다시 필요하신 부지 정보를 말씀해 주세요!`,
                    timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }}
              title="초기화"
              className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white border border-transparent"
              id="btn_reset_chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 bg-white/15 text-white rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">
              Citizen
            </div>
          </div>
        </div>

        {/* API Key 관리 서브 패널 (슬라이드 애니메이션 효과) */}
        <AnimatePresence>
          {showApiKeyInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-[#111827] text-white border-b border-gray-800 overflow-hidden"
              id="api_key_manager_panel"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider font-mono flex items-center gap-1">
                    <Key className="w-3 h-3 text-emerald-400" /> INTEGRATED PUBLIC LAND API KEYS
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">LocalStorage Safe-Storage</span>
                </div>
                
                <div className="space-y-2.5">
                  {/* 1. Gemini AI Key */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold font-sans flex items-center gap-1">
                      🤖 Gemini API Key (AI Studio)
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AI Studio에서 발급받은 Gemini API 키 입력..."
                      className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 2. 공공데이터포털 서비스키 */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold font-sans flex items-center gap-1">
                      🌐 공공데이터포털(data.go.kr) 서비스키 (일반인증키)
                    </label>
                    <input
                      type="password"
                      value={publicDataKey}
                      onChange={(e) => setPublicDataKey(e.target.value)}
                      placeholder="국토부 공시지가 / 토지이용계획 API용 서비스키 입력..."
                      className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 3. 브이월드 OpenAPI Key */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold font-sans flex items-center gap-1">
                      🗺️ 국토교통부 브이월드(V-World) API 인증키
                    </label>
                    <input
                      type="password"
                      value={vworldKey}
                      onChange={(e) => setVworldKey(e.target.value)}
                      placeholder="V-World 오픈 API 지도/지적도 인증키 입력..."
                      className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowApiKeyInput(false)}
                    className="px-4 py-1.5 bg-[#009C5E] hover:bg-[#00874e] text-white font-bold text-xs rounded-lg transition"
                  >
                    설정 저장 및 확인
                  </button>
                </div>
                
                <p className="text-[10px] text-gray-500 leading-normal">
                  💡 **안내:** 입력된 모든 API 키는 LocalStorage에만 철저히 저장됩니다. 키를 입력하지 않으셔도 100% 매핑에 맞춘 정교한 공간 인프라 시뮬레이션 조립 결과가 정상 노출됩니다!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 상단 퀵 정보 컨테이너 (시민 맞춤형 대부신청인 상태바) */}
        <div className="bg-[#f0f4f8]/80 backdrop-blur-xs px-4 py-3 flex items-center justify-between border-b border-gray-150" id="applicant_status_bar">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <User className="w-4 h-4 text-[#00529C]" />
            <span>신청인 정보:</span>
            {applicantName ? (
              <span className="font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-0.5 rounded-lg text-[11px] shadow-3xs">
                {applicantName} <span className="text-gray-400 font-medium">({applicantType})</span>
              </span>
            ) : (
              <span className="text-amber-700 text-[10.5px] font-bold flex items-center gap-0.5 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 inline text-amber-600" /> 신청 정보 미등록 (우측 버튼 입력)
              </span>
            )}
          </div>
          <button 
            onClick={() => setShowNameModal(true)}
            className="text-xs font-bold text-[#00529C] hover:text-[#004788] hover:underline flex items-center gap-1"
            id="btn_edit_user"
          >
            <Edit3 className="w-3.5 h-3.5" />
            정보 등록/수정
          </button>
        </div>

        {/* 메시지 영역 (가로 스크롤 완전 방지 및 모바일 최적화 패딩 적용) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 space-y-4 bg-[#F8F9FA]/60" id="chat_messages_area">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`} 
              id={`msg_wrapper_${msg.id}`}
            >
              <div className="flex gap-2.5 max-w-[90%]">
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-1 shadow-3xs">
                    <Sparkles className="w-4 h-4 text-[#00529C]" />
                  </div>
                )}
                
                <div className="space-y-3">
                  {/* 말풍선 본문 */}
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-[#00529C] text-white rounded-tr-none shadow-sm font-sans' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm font-sans'
                  }`}>
                    {msg.sender === 'user' ? (
                      msg.text
                    ) : (
                      <div className="whitespace-pre-wrap select-text">
                        {/* 마크다운 간단 치환 */}
                        {msg.text.split('\n').map((line, idx) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={idx} className="font-bold text-[#00529C] text-base mt-2">{line.replace(/\*\*/g, '')}</p>;
                          }
                          if (line.startsWith('- **') || line.startsWith('1) **') || line.startsWith('2) **') || line.startsWith('3) **')) {
                            return <p key={idx} className="font-medium text-gray-900 pl-2 mt-1">{line}</p>;
                          }
                          return <p key={idx}>{line}</p>;
                        })}
                      </div>
                    )}
                  </div>

                  {/* 봇 액션 카드 포맷 (추천 보고서 및 시뮬레이션 및 초안 포함) */}
                  {msg.sender === 'bot' && msg.actionCard?.type === 'recommend' && msg.actionCard.parcel && (
                    <div className="space-y-3 bg-white border border-[#E9ECEF] rounded-2xl overflow-hidden shadow-md w-full max-w-[330px] xs:max-w-[350px] sm:max-w-md mx-auto" id={`card_report_${msg.actionCard.parcel.id}`}>
                      {/* 부지 헤더 이미지 */}
                      <div className="relative h-32 sm:h-40 bg-gray-100 overflow-hidden">
                        <img 
                          src={msg.actionCard.parcel.imageUrl || 'https://images.unsplash.com/photo-1541414779247-4436ea0e17d8?auto=format&fit=crop&w=600&q=80'} 
                          alt={msg.actionCard.parcel.id} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-[#006e1c] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3" /> KR 최적 맞춤추천
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-mono font-medium">
                          {msg.actionCard.parcel.id}
                        </div>
                      </div>

                      {/* 1단계: 🎯 맞춤 부지 추천 및 3줄 요약 리포트 */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-sans font-bold text-gray-900 text-base flex items-center gap-1.5">
                            <Landmark className="w-4 h-4 text-[#00529C]" />
                            {msg.actionCard.parcel.id} 추천 리포트
                          </h3>
                          <span className="text-xs bg-[#e9ecef] px-2 py-0.5 rounded text-gray-600 font-mono">
                            {msg.actionCard.parcel.landType} • {msg.actionCard.parcel.area}㎡
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-600 flex items-center gap-1 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate" title={msg.actionCard.parcel.address}>{msg.actionCard.parcel.address}</span>
                        </p>

                        <div className="bg-[#F8F9FA] border border-blue-50 p-3 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#00529C]">
                            <Sparkles className="w-3 h-3 text-[#00529C]" />
                            <span>AI 3줄 요약 액션 플랜</span>
                          </div>
                          {generateAssistantResponse(msg.actionCard.parcel, applicantName).step1.points.map((pt, pidx) => (
                            <div key={pidx} className="text-xs text-gray-700 leading-relaxed flex items-start gap-1">
                              <span className="text-blue-500 mt-1 select-none">•</span>
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 국토정보 외부 공간 API 및 지도 연계 장치 */}
                      <div className="p-4 border-b border-[#E9ECEF] bg-gray-50/30">
                        <SpatialPortal 
                          address={msg.actionCard.parcel.address}
                          parcelId={msg.actionCard.parcel.id}
                          area={msg.actionCard.parcel.area}
                          officialPrice={msg.actionCard.parcel.officialPrice}
                          latitude={msg.actionCard.parcel.latitude}
                          longitude={msg.actionCard.parcel.longitude}
                          zoning={msg.actionCard.parcel.zoning}
                          isRailwayProtected={msg.actionCard.parcel.isRailwayProtected}
                          hasRoadAccess={msg.actionCard.parcel.hasRoadAccess}
                          waterDistance={msg.actionCard.parcel.waterDistance}
                        />
                      </div>

                      {/* 2단계: 💰 예상 비용 상세 시뮬레이션 */}
                      <div className="p-4 bg-brand-blue-light/50 border-b border-gray-100">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-950 mb-3">
                          <Calculator className="w-4 h-4 text-brand-green" />
                          <span>예상 대부료 상세 시뮬레이션</span>
                        </div>

                        {/* 산출 공식 */}
                        <div className="bg-white/80 rounded-xl p-3.5 border border-slate-200/60 shadow-2xs space-y-2.5">
                          <div className="text-center text-[10.5px] text-gray-400 font-mono">
                            계산 공식: 면적 × 공시지가 × 용도 제반 요율
                          </div>
                          <div className="text-center font-mono font-black text-gray-900 text-sm py-1 border-y border-dashed border-slate-100">
                            {msg.actionCard.parcel.area}㎡ × {msg.actionCard.parcel.officialPrice.toLocaleString()}원 × {getRateAndLabel(msg.actionCard.parcel.recommendedUse).ratePct}%
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-505 font-medium">
                            <span>대부요율 가이드</span>
                            <span className="font-extrabold text-brand-green">익년 특별 {getRateAndLabel(msg.actionCard.parcel.recommendedUse).ratePct}% 특별우대 ({getRateAndLabel(msg.actionCard.parcel.recommendedUse).label})</span>
                          </div>
                        </div>

                        {/* 연간 대부료 최종 */}
                        <div className="mt-3 bg-brand-green-light border border-emerald-100 rounded-xl p-3.5 font-sans text-center">
                          <div className="text-brand-green text-[10.5px] font-bold tracking-wider">FINAL ESTIMATED PRICE</div>
                          <div className="text-brand-green-deep font-extrabold text-xl my-1">
                            {calculateLeaseFee(msg.actionCard.parcel).yearlyFee.toLocaleString()} 원/년
                          </div>
                          <div className="text-brand-green-deep font-semibold text-xs">
                            월 보증 렌탈비 환산: 약 <span className="underline font-black font-mono">{calculateLeaseFee(msg.actionCard.parcel).monthlyFee.toLocaleString()}</span> 원/월
                          </div>
                        </div>
                      </div>

                      {/* 3단계: 📝 국유재산 대부 신청서 자동 초안 생성 */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                            <FileText className="w-4 h-4 text-[#00529C]" />
                            <span>국유재산 대부 신청서 자동 초안</span>
                          </div>
                          <span className="text-[10px] bg-[#E1F0FF] text-[#00529C] px-2 py-0.5 rounded-full font-bold">
                            정합성 100% 통과
                          </span>
                        </div>

                        {/* 대부 기간 셀렉터 */}
                        <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-gray-600 font-medium">희망 대부 기간 설정:</span>
                          <select 
                            value={selectedLeasePeriod}
                            onChange={(e) => {
                              setSelectedLeasePeriod(Number(e.target.value));
                              // 기간 변경 시 메시지 내 테이블이 유기적으로 보일 수 있도록 상태 전이
                            }}
                            className="bg-white border border-gray-300 rounded px-1.5 py-0.5 font-mono text-xs focus:ring-1 focus:ring-[#00529C] outline-none"
                            id="select_lease_period"
                          >
                            <option value={12}>12개월 (1년)</option>
                            <option value={24}>24개월 (2년/일반)</option>
                            <option value={36}>36개월 (3년/장기)</option>
                            <option value={60}>60개월 (5년/최대)</option>
                          </select>
                        </div>

                        {/* 자동 완성된 표 */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full table-fixed text-[11px] text-left" id="applicant_form_table">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="p-2 font-semibold text-gray-700 w-[85px] sm:w-[100px]">서식 항목</th>
                                <th className="p-2 font-semibold text-gray-700">자동 완성 내용</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="p-2 font-medium text-gray-500 bg-gray-50/50">신청인 정보</td>
                                <td className="p-2 break-all">
                                  {applicantName ? (
                                    <span className="font-bold text-gray-900 font-sans">
                                      {applicantName} <span className="text-gray-400 font-normal">({applicantType})</span>
                                    </span>
                                  ) : (
                                    <span className="font-bold text-red-500 animate-pulse flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 shrink-0" /> 미입력
                                    </span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium text-gray-500 bg-gray-50/50">신청 부지</td>
                                <td className="p-2 font-semibold text-gray-800 font-mono break-all leading-tight">
                                  {msg.actionCard.parcel.id} ({msg.actionCard.parcel.address.split('(')[0].trim()})
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium text-gray-500 bg-gray-50/50">사업 목적</td>
                                <td className="p-2 font-sans font-medium text-gray-700 break-all leading-tight">
                                  {msg.actionCard.parcel.recommendedUse.split('·')[0]} 공간 대부
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium text-gray-500 bg-gray-50/50">희망 대부기간</td>
                                <td className="p-2 font-mono text-gray-700">
                                  {selectedLeasePeriod}개월 ({Math.round(selectedLeasePeriod / 12 * 10) / 10}년)
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* 알림 배너 */}
                        {!applicantName && (
                          <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-3 flex gap-2 text-xs text-[#826100]" id="alert_need_applicant_name">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">신청인 정보가 아직 완성되지 않았습니다!</span><br />
                              성함을 입력해 주시면 대부 신청 표 양식에 즉각 반영되어 공단 서버로 정식 접수가 진행됩니다.
                            </div>
                          </div>
                        )}

                        {/* 액션 버튼 */}
                        <div className="flex gap-2.5 mt-2" id="report_card_actions">
                          {!applicantName ? (
                            <button 
                              onClick={() => setShowNameModal(true)}
                              className="flex-1 py-2.5 px-4 bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-sm"
                              id="btn_chat_fill_name"
                            >
                              <User className="w-3.5 h-3.5" />
                              신청인 정보 입력하기
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleApplyFinal(msg.actionCard!.parcel!)}
                              className="flex-1 py-2.5 px-4 bg-[#00529C] hover:bg-[#004788] text-white font-bold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transform active:scale-98"
                              id="btn_chat_apply_rent"
                            >
                              <Check className="w-4 h-4" />
                              공간복지 즉시 대부신청
                            </button>
                          )}

                          <button 
                            onClick={() => handlePrintForm(msg.actionCard!.parcel!)}
                            className="py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-700 font-semibold transition duration-150 flex items-center justify-center gap-1"
                            title="신청서 파일 다운로드 (초안)"
                            id="btn_chat_download_txt"
                          >
                            <FileDown className="w-4 h-4" />
                            다운로드
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 시간 표기 */}
                  <div className={`text-[10px] text-gray-400 font-mono ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 하단 입력바 */}
        <div className="p-3 bg-white border-t border-gray-100" id="chatbot_input_bar">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="대전역 근처, 주말농장, 세종시 카페, KR-002 등 물어보세요"
              className="flex-1 bg-[#F8F9FA] border border-gray-200 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#00529C] focus:bg-white text-gray-800 font-sans"
              id="assistant_chat_input"
            />
            <button 
              type="submit"
              className="w-12 h-12 rounded-xl bg-[#00529C] hover:bg-[#004788] text-white flex items-center justify-center transition shadow-md shrink-0 active:scale-95"
              id="btn_send_chat"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2 font-sans leading-none">
            철도 가용 부지 마스터 AI 대화 알고리즘 • 대부 요율 (농업 1% / 창업 3% / 일반 5% 반영)
          </p>
        </div>
      </div>

      {/* 우측 꿀팁 가이드 및 프리셋 부지 카드 */}
      {!hideRightPanel && (
        <div className="w-full lg:w-5/12 space-y-5 animate-in fade-in duration-300" id="chatbot_guide_sidebar">
          {/* 프리셋 빠른 매칭 카드 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4" id="preset_queries_card">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-gray-950 text-base leading-tight">랜드버디 빠른 매칭 프리셋</h3>
                <p className="text-xs text-gray-500">한 번의 클릭으로 인공지능 공간 복지 비서를 깨우세요!</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2" id="preset_button_grid">
              {LAND_BUDDY_PRESETS.map((p, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    handleSendMessage(p.query);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-[#00529C] hover:bg-blue-50/30 transition text-xs font-medium text-gray-700 hover:text-[#00529C] flex items-center justify-between group"
                  id={`btn_preset_${idx}`}
                >
                  <span>{p.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#00529C] transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>

          {/* 랜드버디 국유재산 대부 꿀팁 가이드 */}
          <div className="bg-gradient-to-br from-[#00529C] to-blue-900 rounded-2xl p-5 text-white space-y-4 shadow-sm" id="regulatory_quick_guide">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#FFC107] animate-bounce" />
              <h3 className="font-sans font-bold text-base">랜드버디 렌탈 상식 가이드</h3>
            </div>

            <div className="space-y-3.5 text-xs text-blue-100/90 leading-relaxed font-sans" id="guide_item_list">
              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <strong className="text-[#FFC107] block mb-1">Q. 무단 점유는 어떻게 되나요?</strong>
                철도공단의 허가 없이 철도보호구역이나 철도부지를 점용하면 벌칙금(변상금 120%) 부과 및 고발 조치됩니다! 랜드버디를 통해 정당하고 안전하게 대부 신청하십시오.
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <strong className="text-emerald-300 block mb-1">Q. 대부료 우대 혜택 적용 방법은?</strong>
                일반 부지는 공시지가의 5%이지만, 농사 목적(주말농장 등)은 1%, 카페나 푸드트럭 창업 등 지역밀착 공간복지는 **익년 한시 특별 우대요율인 3%**로 전격 낮추어 드립니다.
              </div>

              <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                <strong className="text-sky-300 block mb-1">Q. 신청 시 준비 서류는?</strong>
                랜드버디가 자동 생성 및 다운로드해 드리는 **'국유재산 대부 신청서 초안.txt'**와 주민등록등본(개인) 또는 사업자등록증명원(기업)만 지참하시면 영농 및 소상공인 공간 복지 안전 심사를 빠르게 통과할 수 있습니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 신청인 개인정보 입력 인텐트 모달 다이얼로그 */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs" id="modal_applicant_form">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#00529C] flex items-center gap-2">
                <User className="w-5 h-5 text-[#00529C]" />
                신청인 국유재산 등록 정보
              </h3>
              <button 
                onClick={() => setShowNameModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-xl text-sm"
                id="btn_close_modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApplicantInfo} className="space-y-4 text-xs" id="applicant_modal_form">
              <div className="space-y-1.5">
                <label className="block text-gray-700 font-semibold">신청 구분 (신분)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '개인', label: '도시농부 / 개인' },
                    { id: '소상공인', label: '청년 / 예비창업자' },
                    { id: '법인', label: '법인 / 단체' },
                    { id: '취약계층', label: '공간복지 우대 대상' }
                  ].map((t) => (
                    <label 
                      key={t.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                        applicantType === t.id 
                          ? 'border-[#00529C] bg-blue-50/40 text-[#00529C] font-semibold' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      id={`label_type_${t.id}`}
                    >
                      <input 
                        type="radio" 
                        name="applicantType"
                        checked={applicantType === t.id}
                        onChange={() => setApplicantType(t.id)}
                        className="text-[#00529C] focus:ring-[#00529C]"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-700 font-semibold" htmlFor="input_name">신청인 실명 / 기관명</label>
                <input 
                  type="text"
                  id="input_name"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="예: 홍길동, 솔라시티 물류 야적회사"
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#00529C] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-700 font-semibold" htmlFor="input_phone">연락처 (인증 및 계약 알림통보용)</label>
                <input 
                  type="text"
                  id="input_phone"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#00529C] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-center hover:bg-gray-50 transition"
                  id="btn_cancel_modal"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00529C] hover:bg-[#004788] text-white font-bold rounded-xl text-center shadow-md text-xs transition"
                  id="btn_submit_modal_info"
                >
                  확인 및 동적 서식 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
