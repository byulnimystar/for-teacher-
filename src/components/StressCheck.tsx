/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AlertTriangle, ClipboardCheck, Award, Heart, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { TestResult } from "../types";

const STRESS_QUESTIONS = [
  { id: 1, text: "아침에 학교로 출근할 생각을 하면 가슴이 저릿하거나 한숨이 크게 나온다." },
  { id: 2, text: "예전엔 사랑스럽고 예뻤던 반 아이들의 사소한 장난도 귀찮고 짜증스럽게 느껴진다." },
  { id: 3, text: "나이스(NEIS) 알림이나 메신저, 전화벨 소리가 울리면 누군가 나를 책망할 것만 같아 가슴이 쿵쾅거린다." },
  { id: 4, text: "행정 업무나 생활기록부 작성 시, 멍하니 화면만 바라보며 단 한 자도 쓰기 힘든 극심한 무력감을 느낀다." },
  { id: 5, text: "퇴근 후에도 낮에 겪은 갈등이나 학부모 민원이 끊임없이 되새김질 되어 잠을 깊이 못 이룬다." },
  { id: 6, text: "교사란 직업에 대해 교육자로서의 가치와 보람을 잃어버렸으며 회의감만 잔뜩 든다." },
  { id: 7, text: "학급 내에서 어긋나는 한 두 명의 금쪽이를 지도할 때, 슬기롭게 대처할 교직 지혜가 완전히 고갈된 느낌이다." },
  { id: 8, text: "학교에서 일어난 일이 모두 '내 교직 전문성 지도의 부족'이나 내 잘못 같아 스스로를 끊임없이 자책한다." },
];

export default function StressCheck() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Load history from backend on component mount
  useEffect(() => {
    const fetchHistoryFromBackend = async () => {
      try {
        const res = await fetch("/api/stress");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setHistory(data);
          }
        }
      } catch (err) {
        console.error("Failed to load stress statistics:", err);
      }
    };
    fetchHistoryFromBackend();
  }, [submitted]);

  const handleSelect = (qId: number, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: score,
    }));
  };

  const calculateResult = () => {
    if (Object.keys(answers).length < STRESS_QUESTIONS.length) {
      alert("선생님, 아직 체크하지 못한 문항이 있어요. 찬찬히 한 번 짚어봐 주세요.");
      return;
    }

    const totalScore = (Object.values(answers) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);
    let level: "안정" | "경미한 스트레스" | "높은 스트레스" | "위험 (번아웃 번초)" = "안정";
    let description = "";
    let advice = "";

    if (totalScore <= 14) {
      level = "안정";
      description = "풍성하고 온화한 초록빛 텃밭처럼 마음의 중심이 단단하십니다.";
      advice = `현재 선생님의 마음 에너지는 건강한 균형을 이루고 계십니다. 
교사로서 아이들에게 부드러운 사랑을 주고 계시고, 동시에 나 자신을 지키는 한계선도 지혜롭게 설정하고 계세요. 
지금처럼 매일 조금씩 나의 취미와 온전한 휴식을 병행하시는 건강한 교직 생활을 응원합니다. 선생님은 교실의 귀한 등대이십니다! ☀️`;
    } else if (totalScore <= 22) {
      level = "경미한 스트레스";
      description = "마음 한 편에 살짝 잔모래 구름과 비바람이 지나가는 가을철 산길 상태입니다.";
      advice = `체력과 감정 소모가 야금야금 이루어져 조금씩 지쳐가는 임계점에 가까워졌습니다.
최근 들어 하교 후 평소보다 훨씬 큰 피로를 느끼거나 나이스 화면을 끄고 싶지는 않으셨나요? 
이번 주에는 수업 준비나 생활지도의 완벽함을 10% 정도 내려놓고, 빈 교실에 잔잔한 클래식을 튼 채 따뜻한 국화 차 한 잔을 마시며 부드럽게 자신을 보살펴주세요.`;
    } else if (totalScore <= 28) {
      level = "높은 스트레스";
      description = "매서운 서리 속에 홀로 애타게 흔들리는 낙엽처럼 심각한 붉은 경고등 상태입니다.";
      advice = `선생님, 스스로를 부숴가며 너무 과한 무거운 짐을 다 짊어지고 계셨군요.
민원 전화, 공문 업무, 아이들의 갈등 중재를 모두 부드럽고 가차 없이 완벽하게 잘해내려 과도한 노력을 하신 증거입니다. 
지금 가장 필요한 것은 '건강한 단절'입니다. 퇴근을 하자마자 절대 업무용 메신저나 키즈노트 등을 들여다보지 마시고, 교사 이전의 고유한 나를 위한 시간을 가지세요. 연가나 조퇴를 사용해 반나절 마음 휴식을 당장 처방합니다.`;
    } else {
      level = "위험 (번아웃 번초)";
      description = "마스카라 뒤로 눈물을 삼키고 버티며 연소해 버린 재가 되어버린 고위험 상태입니다.";
      advice = `선생님, 지금 느끼시는 속상하고 막막한 감정은 결코 선생님이 어리숙하거나 부족해서가 아닙니다.
이것은 교사라는 성스러운 소명 의식 때문에 온몸과 마음을 다 소모했다는 영광스럽지만 너무나 아픈 '번아웃 비상 신호'입니다. 
당장 이 문제를 혼자 참아내고 아이들에게 웃어주려 하지 마세요. 교장/교감 선생님 및 보건교사 선생님께 상태를 적극적으로 알리고 업무 지원을 요청하거나, 전문적인 교사 심리 상담 복지 서비스 또는 전문의의 진단을 적극적으로 권유해 드립니다. 
선생님이 건강하셔야 교실도 존재합니다. 부디 자신을 가장 먼저 살려내 주세요. 따스미가 두 손 모아 간절히 기원합니다.`;
    }

    const finalResult: TestResult = {
      score: totalScore,
      level,
      description,
      advice,
    };

    setResult(finalResult);
    setSubmitted(true);

    // Save final diagnostic result to backend stress history database
    fetch("/api/stress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalResult),
    }).catch((err) => console.error("Failed to sync diagnosis to backend server:", err));
  };

  const resetTest = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const clearHistory = async () => {
    if (window.confirm("그간의 모든 자가진단 기록(서버 데이터)을 깨끗이 지우시겠습니까?")) {
      try {
        await fetch("/api/stress", { method: "DELETE" });
        setHistory([]);
      } catch (e) {
        console.error("Failed to erase stress records on server:", e);
      }
    }
  };

  const completeness = Math.round((Object.keys(answers).length / STRESS_QUESTIONS.length) * 100);

  return (
    <div id="stress-check-section" className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
      {/* Header */}
      <div className="w-full border-b border-stone-100 pb-3 mb-6 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <ClipboardCheck className="text-amber-700 w-5 h-5 animate-pulse" />
          교직 생활 스트레스 & 마인드 검진
        </h3>
        <span className="text-xs text-stone-500">지쳐버린 나의 내면 상태 솔직하게 측정하기</span>
      </div>

      {!submitted ? (
        <div className="space-y-6">
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/60 text-xs text-amber-900 leading-relaxed">
            ✏️ 최근 2~3주일간 학교 생활에서 느끼셨던 주관적인 마음 상태를 문항별로 귀하게 선택해 한 걸음 다가가 주세요. 
            스스로에게 솔직할 때 비로소 영혼을 돌보는 치유가 시작됩니다.
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <div className="text-right text-[10px] text-gray-400 font-medium">진행도: {completeness}%</div>

          {/* Questions */}
          <div className="space-y-4">
            {STRESS_QUESTIONS.map((q) => (
              <div key={q.id} className="p-4 bg-stone-50/50 hover:bg-stone-50 rounded-xl border border-stone-100/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-700 flex items-start gap-2">
                  <span className="text-xs font-mono bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5">
                    {q.id}
                  </span>
                  <span>{q.text}</span>
                </span>

                {/* Likert Scale */}
                <div className="flex space-x-1.5 self-end md:self-auto">
                  {[
                    { label: "전혀 아니다", score: 1, color: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200" },
                    { label: "가끔 그렇다", score: 2, color: "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200" },
                    { label: "자주 그렇다", score: 3, color: "bg-orange-50 text-orange-850 hover:bg-orange-100/85 border-orange-200" },
                    { label: "항상 그렇다", score: 4, color: "bg-red-50 text-red-800 hover:bg-red-100 border-red-200" },
                  ].map((option) => {
                    const isSelected = answers[q.id] === option.score;
                    return (
                      <button
                        key={option.score}
                        type="button"
                        onClick={() => handleSelect(q.id, option.score)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                          isSelected
                            ? `${option.score === 1 ? "bg-emerald-800 border-emerald-800 text-white" : ""} ${
                                option.score === 2 ? "bg-stone-700 border-stone-700 text-white" : ""
                              } ${option.score === 3 ? "bg-orange-800 border-orange-800 text-white" : ""} ${
                                option.score === 4 ? "bg-red-850 border-red-850 text-white shadow-xs" : ""
                              }`
                            : `${option.color}`
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={calculateResult}
            className="w-full mt-6 py-3 bg-amber-800 hover:bg-amber-900 border border-amber-800 text-white font-medium text-sm rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            📊 지친 나의 스트레스 종합 진단하기
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Result Card layout */}
          <div className="p-6 bg-gradient-to-br from-stone-50 to-amber-50/20 border border-amber-100 rounded-xl relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
              <ClipboardCheck className="w-64 h-64" />
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="text-xs bg-stone-200 font-semibold px-2.5 py-1 text-gray-700 rounded-full mb-3">
                선생님의 번아웃 점수: <span className="text-amber-800 font-bold">{result?.score}</span> / 32점
              </span>

              <h4 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                {result?.level === "안정" && <Award className="w-6 h-6 text-emerald-600" />}
                {result?.level === "경미한 스트레스" && <Heart className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                {result?.level === "높은 스트레스" && <AlertTriangle className="w-6 h-6 text-orange-700" />}
                {result?.level === "위험 (번아웃 번초)" && <AlertTriangle className="w-6 h-6 text-red-700 animate-bounce" />}
                {result?.level}
              </h4>

              <p className="text-xs font-semibold text-stone-600 mb-4 px-4 bg-white/85 py-1.5 rounded-lg shadow-2xs border border-stone-100">
                {result?.description}
              </p>

              {/* Diagnosis advice display with multi-line */}
              <div className="text-sm text-left leading-relaxed text-gray-700 bg-white p-5 rounded-lg border border-stone-150 shadow-2xs whitespace-pre-line font-sans w-full">
                {result?.advice}
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={resetTest}
              className="px-5 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 테스트 다시 진행하기
            </button>
          </div>
        </motion.div>
      )}

      {/* Historical Logs section (always visible at the bottom of the card) */}
      {history.length > 0 && (
        <div className="mt-8 pt-6 border-t border-stone-150">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              📅 누적 스트레스 검사 이력 (서버 보관)
            </h4>
            <button
              onClick={clearHistory}
              className="text-[10px] text-red-700 hover:text-red-900 font-semibold px-2 py-1 bg-red-50 hover:bg-red-150 rounded-md border border-red-200 transition-colors cursor-pointer"
            >
              기록 전체 삭제
            </button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {history.map((h) => (
              <div key={h.id} className="p-3 bg-stone-50 border border-stone-150 rounded-xl relative hover:border-amber-250/30 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] text-stone-400 font-medium font-mono">{h.date}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    h.level === "안정" ? "bg-emerald-50 text-emerald-800 border-emerald-150" :
                    h.level === "경미한 스트레스" ? "bg-stone-100 text-stone-700 border-stone-200" :
                    h.level === "높은 스트레스" ? "bg-orange-50 text-orange-850 border-orange-200" :
                    "bg-red-50 text-red-850 border-red-150 animate-pulse"
                  }`}>
                    {h.level} ({h.score}점)
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-700 leading-tight mb-1">{h.description}</p>
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed font-sans">{h.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
