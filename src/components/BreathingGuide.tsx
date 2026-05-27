/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Play, Square, Timer, Wind, Sparkles } from "lucide-react";
import { motion } from "motion/react";

type BreathPhase = "idle" | "inhale" | "hold" | "exhale";

export default function BreathingGuide() {
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [breathType, setBreathType] = useState<"relax" | "box">("relax"); // relax: 4-7-8, box: 4-4-4
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [guideText, setGuideText] = useState("아래 시작 버튼을 눌러 교무실에서의 흐트러진 호흡을 정리해 보세요.");

  // Minute Rest Timer
  const [timerSeconds, setTimerSeconds] = useState(300); // Default 5 mins
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let tInterval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      tInterval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      alert("은은한 5분의 교사 휴식 시간이 종료되었습니다. 다시 일상으로 건강하게 돌아갈 준비가 되셨나요?");
      setTimerSeconds(300);
    }
    return () => clearInterval(tInterval);
  }, [timerRunning, timerSeconds]);

  // Breathing Loop
  useEffect(() => {
    if (phase === "idle") return;

    let totalDuration = 0;
    let text = "";
    let nextPhase: BreathPhase = "idle";

    if (breathType === "relax") {
      // 4-7-8 Relax breath
      if (phase === "inhale") {
        totalDuration = 4;
        text = "천천히 배부르게 숨을 들이마십니다 (4초)";
        nextPhase = "hold";
      } else if (phase === "hold") {
        totalDuration = 7;
        text = "아랫배에 힘을 살짝 두고 숨을 조용히 머금습니다 (7초)";
        nextPhase = "exhale";
      } else if (phase === "exhale") {
        totalDuration = 8;
        text = "입으로 바람 소리를 내며 긴장을 길게 다 쏟아냅니다 (8초)";
        nextPhase = "inhale";
      }
    } else {
      // 4-4-4 Box breath
      if (phase === "inhale") {
        totalDuration = 4;
        text = "눈을 감고 맑은 우주 에너지를 들이마십니다 (4초)";
        nextPhase = "hold";
      } else if (phase === "hold") {
        totalDuration = 4;
        text = "잠깐만 온 누리의 침묵 속에서 숨을 정돈합니다 (4초)";
        nextPhase = "exhale";
      } else if (phase === "exhale") {
        totalDuration = 4;
        text = "오늘 마음속 응어리와 번민을 아주 부드럽게 비워냅니다 (4초)";
        nextPhase = "inhale";
      }
    }

    setGuideText(text);
    setSecondsLeft(totalDuration);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase(nextPhase);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, breathType]);

  const handleStartBreath = () => {
    setPhase("inhale");
  };

  const handleStopBreath = () => {
    setPhase("idle");
    setGuideText("호흡이 조용히 멈추었습니다. 언제든 필요할 때 들이마셔주세요.");
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Visual breathing attributes depending on state
  const circleVariants = {
    idle: { scale: 1, backgroundColor: "#e2e8f0" }, // gray-200
    inhale: { scale: 1.8, backgroundColor: "#a7f3d0", transition: { duration: breathType === "relax" ? 4 : 4, ease: "easeInOut" } }, // emerald-200
    hold: { scale: 1.8, backgroundColor: "#fef08a", transition: { duration: 0.2 } }, // yellow-200 (stay scaled up)
    exhale: { scale: 1.0, backgroundColor: "#fbcfe8", transition: { duration: breathType === "relax" ? 8 : 4, ease: "easeInOut" } }, // pink-200
  };

  return (
    <div id="breathing-guide-section" className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm flex flex-col items-center">
      <div className="w-full border-b border-stone-100 pb-3 mb-6 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Wind className="w-5 h-5 text-emerald-700 animate-pulse" />
          마음챙김 어슬렁 호흡과 쉼터
        </h3>
        <span className="text-xs text-stone-500">교실의 스트레스, 온화한 호흡으로 날리기</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full">
        {/* Left Side: Breathing animation and control */}
        <div className="flex flex-col items-center justify-between bg-stone-50/50 rounded-xl p-6 border border-stone-100">
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => {
                setBreathType("relax");
                handleStopBreath();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                breathType === "relax" ? "bg-emerald-800 text-white shadow-xs" : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              🧘 4-7-8 긴장 해소 호흡
            </button>
            <button
              onClick={() => {
                setBreathType("box");
                handleStopBreath();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                breathType === "box" ? "bg-emerald-800 text-white shadow-xs" : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              📦 4-4-4 정위 마인드 호흡
            </button>
          </div>

          {/* Breathing Circle Stage */}
          <div className="h-56 flex items-center justify-center relative w-full">
            {/* Outer aura circles */}
            {phase !== "idle" && (
              <>
                <div className="absolute w-44 h-44 rounded-full border border-emerald-300/30 animate-ping" />
                <div className="absolute w-56 h-56 rounded-full border border-pink-300/20 animate-pulse" />
              </>
            )}

            <motion.div
              variants={circleVariants}
              animate={phase}
              className="w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-lg relative z-10"
            >
              <span className="text-xl font-bold text-slate-800">
                {phase === "idle" && "쉼"}
                {phase === "inhale" && "들숨"}
                {phase === "hold" && "머금음"}
                {phase === "exhale" && "날숨"}
              </span>
              {phase !== "idle" && <span className="text-xs font-semibold text-slate-600 mt-1">{secondsLeft}초</span>}
            </motion.div>
          </div>

          <div className="text-center mt-6 w-full px-4">
            <p className="text-xs text-orange-850 font-medium mb-1">
              [ {breathType === "relax" ? "4-7-8 이완호흡 기법" : "4-4-4 박스 정밀 기법"} ]
            </p>
            <p className="text-sm font-semibold text-gray-700 h-12 flex items-center justify-center leading-relaxed">
              {guideText}
            </p>

            <div className="flex justify-center space-x-3 mt-4">
              {phase === "idle" ? (
                <button
                  onClick={handleStartBreath}
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> 호흡 시작하기
                </button>
              ) : (
                <button
                  onClick={handleStopBreath}
                  className="px-6 py-2 bg-pink-850 hover:bg-pink-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-white" /> 정지하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: 5 Minute Silent rest Room */}
        <div className="flex flex-col items-center justify-between bg-amber-550/5 border border-amber-100 rounded-xl p-6">
          <div className="text-center w-full">
            <h4 className="font-semibold text-stone-800 text-sm flex items-center justify-center gap-1.5 mb-1">
              <Timer className="w-4 h-4 text-amber-700" />
              나를 위한 은밀한 5분 침묵 쉼터
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              점심 급식 지도 후, 또는 수업 가기 직전 5분간 온전히 책상의 불을 끄고 안대를 하고 이 오로지 비워진 시간 속에서 침묵해 보세요.
            </p>

            {/* Timer Circle */}
            <div className="bg-amber-100/40 border border-amber-250 w-44 h-44 rounded-full flex flex-col items-center justify-center mx-auto my-4 shadow-2xs">
              <span className="text-xs text-stone-400 font-semibold mb-1">잔여 침묵 시간</span>
              <span className="text-3xl font-bold font-mono text-gray-800">{formatTime(timerSeconds)}</span>
              {timerRunning && (
                <span className="text-[10px] text-amber-700 animate-pulse font-medium mt-1">차분히 머리 비우는 중...</span>
              )}
            </div>
          </div>

          <div className="flex space-x-2 mt-4 w-full justify-center">
            <button
              onClick={() => {
                setTimerRunning(!timerRunning);
              }}
              className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs ${
                timerRunning ? "bg-stone-500 text-white" : "bg-amber-800 hover:bg-amber-900 text-white"
              }`}
            >
              {timerRunning ? "일시정지" : "조용히 쉼 시작"}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(300);
              }}
              className="px-3 py-2 bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200 text-xs font-medium rounded-lg transition-all"
            >
              리셋
            </button>
            <button
              onClick={() => {
                setTimerSeconds(180); // 3 mins fast break
              }}
              className="px-3 py-2 bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 text-xs font-medium rounded-lg transition-all"
            >
              숨 고르기 (3분)
            </button>
          </div>
          <div className="text-[10px] text-stone-400 mt-4 text-center">
            * 3분 / 5분 뒤에 다정한 종소리(알림창)가 울릴 때까지 눈을 감아보세요.
          </div>
        </div>
      </div>
    </div>
  );
}
