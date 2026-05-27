/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Smile, Send, Trash2, MailOpen, Calendar, Compass, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DiaryEntry } from "../types";

const EMOTION_MAP = {
  peace: { icon: "🌱", label: "평온함", desc: "오늘은 평온 무탈한 교직 일상이었어요.", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  tired: { icon: "☕", label: "지침/피로", desc: "학급 지도와 수업, 고된 행정에 완전히 에너지가 방전됐어요.", color: "bg-amber-50 text-amber-800 border-amber-200" },
  angry: { icon: "🌧️", label: "속상함/억울함", desc: "학부모 항의나 비위 어긋나는 아이 때문에 화나고 눈물나요.", color: "bg-red-50 text-red-800 border-red-200" },
  happy: { icon: "☀️", label: "기쁨/보람", desc: "교실 속 아이들의 작은 미소와 성장에 한 줄기 빛을 보았어요.", color: "bg-orange-50 text-orange-800 border-orange-200" },
  anxious: { icon: "☁️", label: "막막함/불안", desc: "내년도 업무 조율이나 갑작스런 상황 때문에 눈앞이 어두워요.", color: "bg-stone-100 text-stone-800 border-stone-200" },
};

export default function ThankYouDiary() {
  const [diaryList, setDiaryList] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem("classtodac_diaries");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState<keyof typeof EMOTION_MAP>("peace");
  const [isLoading, setIsLoading] = useState(false);
  const [activeReplyEntry, setActiveReplyEntry] = useState<string | null>(null);

  // Fetch all diary entries from server backend on mount
  useEffect(() => {
    const fetchDiariesFromBackend = async () => {
      try {
        const res = await fetch("/api/diaries");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setDiaryList(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch diary list from server:", err);
      }
    };
    fetchDiariesFromBackend();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("classtodac_diaries", JSON.stringify(diaryList));
  }, [diaryList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Call server side diary creation (creates, replies, saves to database)
      const res = await fetch("/api/diaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, emotion }),
      });

      if (!res.ok) {
        throw new Error("서버에서 위로의 편지가 배송되는 도중 문제가 발생했습니다.");
      }

      const newEntry: DiaryEntry = await res.json();

      setDiaryList((prev) => [newEntry, ...prev]);
      setText("");
      setActiveReplyEntry(newEntry.id); // open newly created reply
    } catch (err: any) {
      alert(err.message || "답장 전송에 문제가 발생했습니다. 마음을 담아 찬찬히 다시 써 주시겠어요?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("정말 이 소중한 교무 수첩에서 일기를 지울까요?")) {
      try {
        await fetch(`/api/diaries/${id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete diary from backend:", e);
      }
      
      const updatedList = diaryList.filter((d) => d.id !== id);
      setDiaryList(updatedList);
      
      if (activeReplyEntry === id) {
        setActiveReplyEntry(null);
      }
    }
  };

  return (
    <div id="thank-you-diary-section" className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
      {/* Header */}
      <div className="w-full border-b border-stone-100 pb-3 mb-6 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-amber-700 w-5 h-5" />
          마음의 뜰: 감사 & 감정 기록 수첩
        </h3>
        <span className="text-xs text-stone-500">교실 한 칸, 일기 한 줄로 털어내는 마음방</span>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Left 2 cols: Write entry */}
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-100 p-5 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold text-stone-800 flex items-center gap-1">
              ✏️ 오늘의 시기 넘기기 명상 일지 작성
            </h4>

            {/* Emotion select */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 block mb-2">오늘 선생님의 마음을 스쳐 간 감정:</label>
              <div className="grid grid-cols-5 gap-1.5">
                {(Object.keys(EMOTION_MAP) as Array<keyof typeof EMOTION_MAP>).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEmotion(opt)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      emotion === opt
                        ? "bg-amber-800 border-amber-800 text-white shadow-xs"
                        : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
                    }`}
                    title={EMOTION_MAP[opt].desc}
                  >
                    <div className="text-lg mb-0.5">{EMOTION_MAP[opt].icon}</div>
                    <div className="text-[10px] font-medium leading-none truncate">{EMOTION_MAP[opt].label}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-500 mt-2 italic leading-relaxed">
                👉 {EMOTION_MAP[emotion].desc}
              </p>
            </div>

            {/* Input content */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 block mb-2">오늘 수첩에 남기는 조용한 마음의 소리:</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="오늘 어떤 서운함이나 학부모와의 고된 일, 혹은 아주 사소하게 웃었던 일이 있었나요? 일기로 붓을 가벼이 적어보세요..."
                disabled={isLoading}
                rows={5}
                required
                className="w-full text-xs font-sans px-3 py-2 border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white rounded-lg text-gray-800 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 border border-emerald-800 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> '은빛 배달원'이 답장을 꼼꼼히 적고 있어요...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 fill-white" /> 마음 일기 쓰고 밤하늘의 힐링 편지 수령하기
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 3 cols: History card catalog and Letter open modal */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-100">
            <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1">
              📂 지난 호흡 및 다이어리 수첩 ({diaryList.length}통)
            </h4>
            <span className="text-[10px] text-stone-500">기록을 클릭하면 수신된 위로의 답신을 다시 읽을 수 있습니다.</span>
          </div>

          {diaryList.length === 0 ? (
            <div className="py-20 text-center text-gray-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
              <Compass className="w-10 h-10 mx-auto text-stone-300 mb-2 animate-bounce" />
              <p className="text-xs">선생님이 오늘 적어내리실 첫 번째 마음 일기를 기다립니다.</p>
              <p className="text-[10px] text-stone-400 mt-1">답장을 함께 전달해 줄게요.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {diaryList.map((entry) => {
                const emoData = EMOTION_MAP[entry.emotion];
                const isOpened = activeReplyEntry === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isOpened ? "bg-amber-50/30 border-amber-250 shadow-xs" : "bg-white hover:bg-stone-50 border-stone-150"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg bg-white p-1 rounded-sm border border-stone-200/50 shadow-2xs leading-none">
                          {emoData.icon}
                        </span>
                        <div>
                          <p className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-500" />
                            {entry.date}
                          </p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-semibold inline-block mt-0.5 ${emoData.color}`}>
                            {emoData.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-1.5">
                        {entry.reply && (
                          <button
                            onClick={() => setActiveReplyEntry(isOpened ? null : entry.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-sm border border-emerald-200 flex items-center gap-1 transition-all"
                          >
                            <MailOpen className="w-3 h-3" />
                            {isOpened ? "답장 닫기" : "은빛 답장 읽기"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-sm transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-wrap pl-1 bg-stone-50/40 p-2.5 rounded-md border border-stone-100">
                      {entry.content}
                    </div>

                    {/* Expandable AI Letter box */}
                    <AnimatePresence>
                      {isOpened && entry.reply && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50/40 to-amber-50/40 border-l-4 border-emerald-700 rounded-r-md">
                            <h5 className="text-[11px] font-bold text-emerald-900 flex items-center gap-1 mb-2">
                              💌 밤하늘 은빛 배달원의 힐링 답신
                            </h5>
                            <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-sans">
                              {entry.reply}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
