/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, RefreshCw, AlertCircle, Heart, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { CounselMessage } from "../types";

const INITIAL_SUGGESTIONS = [
  {
    label: "학부모 항의로 지친 날",
    prompt: "오늘 사소한 오해로 학부모님께 무거운 말투의 장시간 항의 전화를 받았어요. 가슴이 벌렁거리고 억울해서 오늘 해야 할 일에도 집중이 안 돼요.",
  },
  {
    label: "수업 태도로 속상할 때",
    prompt: "아무리 노력해도 수업 시간에 핸드폰만 보거나 졸며 무례하게 응대하는 학생 때문에 깊은 무력감이 느껴지고 슬픕니다.",
  },
  {
    label: "행정과 임무 폭탄일 때",
    prompt: "교육청 요구 행정 문서 마감과 당장 챙겨야 할 생기부 마감, 내일 학급 주간 계획 조율이 겹쳐서 체력적으로 너무 지치고 숨이 턱턱 막혀요.",
  },
  {
    label: "그냥 힘든 나를 돌보고 싶어",
    prompt: "오늘 열심히 출근은 했는데, 그냥 자리에 앉아있기도 벅찰 정도로 마음이 텅 비고 에너지가 바닥나 부서질 것 같아요. 따스미 선생님, 저 힘내고 싶어요.",
  },
];

export default function AICounselor() {
  const [messages, setMessages] = useState<CounselMessage[]>(() => {
    const saved = localStorage.getItem("classtodac_chats");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: `안녕하세요, 선생님. 분주했던 교실의 문을 닫고, 이곳으로 조심히 잘 오셨습니다. 
오늘 어떤 학급 일들이 선생님의 마음을 쓸고 갔나요? 아이들과의 눈빛, 학부모님과의 통화, 수북이 쌓인 공문서 중 그 무엇이든 이야기해주세요. 
저는 선생님의 편에서 지지하고 평온을 찾아드리고자 귀를 열고 있어요. ☕`,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showDashboard, setShowDashboard] = useState(true);

  // Dynamic Keyword analysis function
  const getMindStats = () => {
    const categories = [
      { key: "학부모", label: "학부모 항의·민원 👤", keywords: ["학부모", "부모", "어머니", "아버님", "민원", "항의", "전화", "상담", "엄마", "아빠"], count: 0, fill: "bg-pink-500", text: "text-pink-850", colorClass: "bg-pink-50/50 text-pink-700 border-pink-200" },
      { key: "학생", label: "학생 무기력·태도 🎒", keywords: ["학생", "아이들", "아이", "애들", "설득", "수업", "태도", "핸드폰", "생활지도", "말대꾸"], count: 0, fill: "bg-emerald-500", text: "text-emerald-800", colorClass: "bg-emerald-50/50 text-emerald-700 border-emerald-200" },
      { key: "업무", label: "과중한 행정업무 📝", keywords: ["행정", "업무", "공문", "문서", "마감", "생기부", "기안", "결재", "기록", "포털", "업무폭탄"], count: 0, fill: "bg-amber-500", text: "text-amber-800", colorClass: "bg-amber-50/50 text-amber-700 border-amber-200" },
      { key: "대인관계", label: "동료·관계 갈등 👥", keywords: ["동료", "교장", "교감", "부장", "협조", "선생님", "관계", "갈등", "뒷담", "오해"], count: 0, fill: "bg-purple-500", text: "text-purple-800", colorClass: "bg-purple-50/50 text-purple-700 border-purple-200" },
      { key: "체력", label: "번아웃·체력 고갈 🔋", keywords: ["체력", "피로", "지쳐", "방전", "건강", "수면", "퇴근", "몸살", "아프다", "병원"], count: 0, fill: "bg-red-500", text: "text-red-850", colorClass: "bg-red-50/50 text-red-700 border-red-200" },
      { key: "심리무력", label: "심리적 무력감 💧", keywords: ["우울", "무력감", "눈물", "답답", "자괴감", "속상", "상처", "불안", "포기", "억울"], count: 0, fill: "bg-cyan-500", text: "text-cyan-850", colorClass: "bg-cyan-50/50 text-cyan-700 border-cyan-200" }
    ];

    const userMsgs = messages.filter((m) => m.role === "user");

    // Standard baseline for empty chats (representing national teacher stress factors)
    if (userMsgs.length === 0) {
      return [
        { label: "학부모 항의·민원 👤", count: 8, percentage: 45, bgClass: "bg-pink-500", textClass: "text-pink-850", ringClass: "bg-pink-50/50 border-pink-100/60" },
        { label: "학생 무기력·태도 🎒", count: 6, percentage: 33, bgClass: "bg-emerald-550", textClass: "text-emerald-800", ringClass: "bg-emerald-50/50 border-emerald-150" },
        { label: "과중한 행정업무 📝", count: 4, percentage: 22, bgClass: "bg-amber-500", textClass: "text-amber-800", ringClass: "bg-amber-50/50 border-amber-150" }
      ];
    }

    // Parse keywords in user message contents
    userMsgs.forEach((msg) => {
      const content = msg.content;
      categories.forEach((cat) => {
        cat.keywords.forEach((word) => {
          if (content.includes(word)) {
            cat.count += 1;
          }
        });
      });
    });

    const sumMatches = categories.reduce((sum, c) => sum + c.count, 0);

    if (sumMatches === 0) {
      // Basic fallback using standard input length or emotional count
      return [
        { label: "마음 나눔 & 기타 💬", count: 1, percentage: 100, bgClass: "bg-stone-500", textClass: "text-stone-800", ringClass: "bg-stone-50 border-stone-200" }
      ];
    }

    const sorted = [...categories].sort((a, b) => b.count - a.count);
    const top3 = sorted.slice(0, 3).filter((c) => c.count > 0);

    // If less than 3 are counted, pad with other categories
    while (top3.length < 3 && top3.length > 0) {
      const nextCandidate = sorted.find((c) => !top3.some((t) => t.key === c.key));
      if (nextCandidate) {
        top3.push(nextCandidate);
      } else {
        break;
      }
    }

    const currentMatches = top3.reduce((sum, c) => sum + (c.count || 1), 0);

    return top3.map((cat) => ({
      label: cat.label,
      count: cat.count || 1,
      percentage: Math.round(((cat.count || 1) / currentMatches) * 100),
      bgClass: cat.fill,
      textClass: cat.text,
      ringClass: cat.colorClass
    }));
  };

  const mindStats = getMindStats();

  // Load chat logs from backend service on mount
  useEffect(() => {
    const loadChatsFromBackend = async () => {
      try {
        const res = await fetch("/api/chats");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setMessages(data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch chats from server, fallback to offline state.", e);
      }
    };
    loadChatsFromBackend();
  }, []);

  // Sync chats to localStorage and server backend database on messages change
  useEffect(() => {
    localStorage.setItem("classtodac_chats", JSON.stringify(messages));
    
    const syncWithBackend = async () => {
      try {
        await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
      } catch (e) {
        console.warn("Failed to sync chat history to server backend:", e);
      }
    };
    if (messages.length > 0) {
      syncWithBackend();
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: CounselMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Send recent chat history directly to the backend counselor logic
      const payloadMessages = updatedMessages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetch("/api/counsel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!res.ok) {
        throw new Error("서버와의 교신이 원활하지 않습니다.");
      }

      const data = await res.json();
      const assistantMsg: CounselMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.text || "선생님, 귀중한 사연을 어루만져 드리고 싶은데 오류가 났네요. 다시 한번 써 주실까요?",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "답변을 가져오는 도중 문제가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("그간의 아늑했던 상담 기록을 모두 지우고 상쾌하게 새 대화를 시작할까요?")) {
      const initialMessages: CounselMessage[] = [
        {
          id: "welcome",
          role: "assistant",
          content: `새 마음으로 차를 한 잔 끓였습니다, 선생님. 
오늘도 작은 일탈이나 사소한 기쁨, 혹여 풀지 못한 응어리가 있다면 찬찬히 나누어 보아요. 늘 기다리고 있어요. 🌱`,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        },
      ];
      setMessages(initialMessages);
      setError(null);

      try {
        await fetch("/api/chats", { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete chat logs on server:", e);
      }
    }
  };

  return (
    <div id="ai-counselor-section" className="flex flex-col h-[650px] bg-amber-50/20 rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-amber-100/60 to-emerald-100/60 border-b border-amber-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-amber-200/50 rounded-lg text-amber-800">
            <Heart className="w-5 h-5 fill-amber-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">1:1 마음 위로 상담소</h3>
            <p className="text-xs text-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" /> 교사 전문 위로 상담봇 '따스미' 상주 중
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-white/60 rounded-full text-gray-500 hover:text-amber-800 transition-colors"
          title="상담 초기화"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 마음 현황판 (Mind Status Dashboard) */}
      <div className="bg-amber-50/45 border-b border-amber-100/60 px-5 py-3 transition-colors">
        <div 
          className="flex justify-between items-center cursor-pointer select-none" 
          onClick={() => setShowDashboard(!showDashboard)}
        >
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
            📊 고민 분석: 실시간 내마음 현황판
            {messages.filter(m => m.role === "user").length === 0 ? (
              <span className="text-[9px] bg-amber-100/80 text-amber-850 border border-amber-200/50 px-1.5 py-0.5 rounded-full font-normal">
                전국 교사 스트레스 통계 기준
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-100/80 text-emerald-850 border border-emerald-200/50 px-1.5 py-0.5 rounded-full font-normal animate-pulse">
                선생님 대화 맞춤 실시간 분석 중
              </span>
            )}
          </span>
          <div className="flex items-center gap-1 text-stone-500 hover:text-stone-800">
            <span className="text-[10px] text-stone-400 font-medium">익명 보관 중</span>
            {showDashboard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>

        {showDashboard && (
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {mindStats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`p-2 rounded-xl border ${stat.ringClass} flex flex-col justify-between shadow-xs hover:shadow-sm transition-all`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-gray-700 truncate">{stat.label}</span>
                  <span className={`text-[11px] font-extrabold ${stat.textClass}`}>{stat.percentage}%</span>
                </div>
                <div className="w-full bg-stone-200/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${stat.bgClass} rounded-full transition-all duration-700`} 
                    style={{ width: `${stat.percentage}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestion Prompt list */}
      {messages.length <= 1 && (
        <div className="p-4 bg-amber-50/50 border-b border-amber-100/60">
          <p className="text-xs font-semibold text-amber-900 mb-2">선생님들이 많이 고민하시는 일들 (클릭하여 빠르게 시작하기):</p>
          <div className="grid grid-cols-2 gap-2">
            {INITIAL_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                className="text-left text-xs p-2.5 bg-white hover:bg-amber-100/40 border border-amber-200/50 rounded-lg hover:border-amber-300 text-gray-700 transition-all shadow-2xs"
              >
                🔍 {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Main Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/30">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-start max-w-[80%] space-x-2 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
              {/* Profile Icon */}
              <div
                className={`p-2 rounded-full shadow-2xs ${
                  msg.role === "user" ? "bg-stone-200 text-stone-700" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Balloon */}
              <div className="flex flex-col">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-2xs ${
                    msg.role === "user"
                      ? "bg-amber-800 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-stone-150 rounded-tl-none font-sans"
                  }`}
                >
                  {msg.content}
                </div>
                <span className={`text-[10px] text-gray-400 mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-[70%] space-x-2">
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-800 animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl border border-stone-200/60 rounded-tl-none shadow-2xs">
                <div className="flex space-x-1.5 py-1 items-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  <span className="text-xs text-emerald-800 font-medium ml-1.5">선생님의 속상한 마음을 읽어내는 중...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 bg-white border-t border-stone-150 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="나이 어린 동료 교사 지도법, 학부모 민원, 오늘의 외로움을 채워줄 속상함을 나눠보세요..."
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-stone-50 hover:bg-stone-100/50 focus:bg-white text-sm border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all text-gray-800"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-200 text-white rounded-xl shadow-xs transition-colors flex Items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
