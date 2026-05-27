/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Heart, Sparkles, Wind, BookOpen, ClipboardCheck, Coffee } from "lucide-react";
import AICounselor from "./components/AICounselor";
import BreathingGuide from "./components/BreathingGuide";
import StressCheck from "./components/StressCheck";
import ThankYouDiary from "./components/ThankYouDiary";
import ComfortCards from "./components/ComfortCards";

type ActiveTab = "counsel" | "breath" | "diary" | "cards" | "stress";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("counsel");

  const tabMeta = {
    counsel: {
      label: "위로 상담소",
      icon: <Heart className="w-4 h-4 fill-amber-700 text-amber-800" />,
      desc: "다정한 동반자 '따스미'가 전하는 1:1 무조건적 교사 경청 상담소",
      bgClass: "from-amber-100/40 to-emerald-100/40",
    },
    breath: {
      label: "마음챙김 호흡",
      icon: <Wind className="w-4 h-4 text-emerald-800" />,
      desc: "교단 위 어질러진 머리를 차분한 4-7-8 유도 호흡과 5분 쉼터로 충전",
      bgClass: "from-emerald-150/40 to-teal-100/40",
    },
    diary: {
      label: "감정기록 수첩",
      icon: <BookOpen className="w-4 h-4 text-amber-800" />,
      desc: "선생님의 감정 일기를 귀담아 읽고 밤하늘 우체부와 소통하는 수첩",
      bgClass: "from-sky-100/30 to-amber-100/30",
    },
    cards: {
      label: "위로 포춘카드",
      icon: <Coffee className="w-4 h-4 text-orange-800" />,
      desc: "지쳐 비어있을 땐 따뜻한 티(Tea) 타임 포춘 카드 한 모금",
      bgClass: "from-amber-100/40 to-orange-100/30",
    },
    stress: {
      label: "번아웃 자가진단",
      icon: <ClipboardCheck className="w-4 h-4 text-amber-900" />,
      desc: "지친 교직 생활에 녹아 버린 피로가 없는지 솔직하게 내면 검진",
      bgClass: "from-stone-100 to-amber-50/30",
    },
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-gray-800 flex flex-col justify-between selection:bg-amber-100">
      {/* Top ambient notification bar */}
      <div className="bg-amber-800 text-white text-[11px] font-medium py-1.5 px-6 text-center tracking-wide flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
        <span>전국 초·중·고등학교 선생님들, 오늘도 귀한 걸음 해주셔서 감사합니다. 이 공간은 선생님의 완전한 치유와 휴식을 위한 안전기지입니다.</span>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Main Branding Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center justify-center gap-2">
            🌱 토닥토닥 교실
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            출근길 긴 한숨을 따뜻한 위안으로 채워줄 지친 교사용 고민 상담 및 마음챙김 안전처
          </p>
        </div>

        {/* Dynamic single view framework selectors */}
        <div className="bg-white rounded-2xl border border-stone-200 p-2.5 shadow-2xs mb-6 grid grid-cols-2 sm:grid-cols-5 gap-1.5 max-w-3xl mx-auto w-full transition-all">
          {(Object.keys(tabMeta) as ActiveTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                id={`tab-btn-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 px-3 rounded-xl text-center border transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? "bg-amber-800 border-amber-800 text-white shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 border-stone-150 text-gray-700"
                }`}
              >
                <div className={`p-1.5 rounded-lg mb-1 leading-none ${isSelected ? "bg-white" : "bg-stone-200/50"}`}>
                  {tabMeta[tab].icon}
                </div>
                <span className="text-[12px] font-bold tracking-tight">{tabMeta[tab].label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Descriptor sub-bar */}
        <div className={`max-w-3xl mx-auto w-full mb-6 p-4 rounded-xl border border-amber-100/40 bg-gradient-to-r ${tabMeta[activeTab].bgClass} text-center shadow-3xs transition-all duration-300`}>
          <span className="text-xs font-semibold text-amber-900 tracking-tight block">
            🌌 [ {tabMeta[activeTab].label} ] : {tabMeta[activeTab].desc}
          </span>
        </div>

        {/* Dynamic Hub Stage (Render selected component cleanly with absolute scale bounds) */}
        <div className="max-w-4xl w-full mx-auto transition-all duration-300 min-h-[500px]">
          {activeTab === "counsel" && <AICounselor />}
          {activeTab === "breath" && <BreathingGuide />}
          {activeTab === "diary" && <ThankYouDiary />}
          {activeTab === "cards" && <ComfortCards />}
          {activeTab === "stress" && <StressCheck />}
        </div>
      </main>

      {/* Gentle supportive Footer fitting the mood */}
      <footer className="w-full bg-stone-100 border-t border-stone-200 py-6 text-center text-[11px] text-stone-500 leading-relaxed font-medium mt-12 bg-linear-to-b from-stone-50 to-stone-100">
        <div className="max-w-xl mx-auto px-6 space-y-1">
          <p className="text-amber-900 font-semibold mb-1">“선생님이 온전히 아프지 않고 행복해야, 교실의 가을이 비로소 피어납니다.”</p>
          <p>이곳에서는 온전히 업무, 학부모, 공문서를 잊고 아이처럼 사랑 받으세요.</p>
          <p className="text-[10px] text-stone-400 mt-2 font-mono">© {new Date().getFullYear()} CLASSTODAC SANCTUARY. ALL HEALING SECURED SENSITIVELY.</p>
        </div>
      </footer>
    </div>
  );
}

