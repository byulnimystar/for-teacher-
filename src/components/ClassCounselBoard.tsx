import React, { useState, useEffect, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { 
  Database, Sparkles, Send, User, ChevronRight, AlertCircle, 
  Settings, CheckCircle, Code, Copy, Trash2, ShieldCheck, ArrowRight, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CounselItem {
  id: string | number;
  created_at: string;
  student_name: string;
  content: string;
}

export default function ClassCounselBoard() {
  // Mode selection: "student" or "teacher"
  const [activeMode, setActiveMode] = useState<"student" | "teacher">("student");
  
  // Credentials & Configuration
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem("counsel_supabase_url") || "");
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem("counsel_supabase_key") || "");
  const [showConfig, setShowConfig] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Student inputs
  const [studentName, setStudentName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Board Data
  const [counsels, setCounsels] = useState<CounselItem[]>([]);
  const [selectedCounsel, setSelectedCounsel] = useState<CounselItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Recommendation
  const [aiReply, setAiReply] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Teacher Replies (saved locally to protect user's strict 4-column schema requirement in Supabase)
  const [localReplies, setLocalReplies] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("counsel_local_replies");
    return saved ? JSON.parse(saved) : {};
  });

  const [currentReplyText, setCurrentReplyText] = useState("");

  // Check if supabase environment variables or local credentials are set
  const envUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
  const envKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";
  const isEnvConfigured = !!(envUrl && envKey);
  const isConfigured = isEnvConfigured || !!(supabaseUrl && supabaseKey);

  // Initialize Supabase Client
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const url = envUrl || supabaseUrl;
    const key = envKey || supabaseKey;
    if (url && key) {
      try {
        const client = createClient(url, key);
        setSupabaseClient(client);
      } catch (err) {
        console.error("Supabase client init error:", err);
      }
    } else {
      setSupabaseClient(null);
    }
  }, [supabaseUrl, supabaseKey, envUrl, envKey]);

  // Load councils list
  const loadCounsels = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("counsels")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCounsels(data || []);
      } catch (err: any) {
        console.error("Failed to fetch from Supabase:", err);
        setErrorMsg("Supabase 연동 오류가 발생했습니다. 아래 SQL 가이드를 확인하여 테이블을 생성했는지 확인해보세요.");
        // Fallback to local storage
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to local storage if not configured
      loadFromLocalStorage();
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem("counsel_board_local_data");
    if (saved) {
      setCounsels(JSON.parse(saved));
    } else {
      // Seed initial dummy data if empty
      const initialDummy: CounselItem[] = [
        {
          id: "dummy-1",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          student_name: "익명의 금쪽이",
          content: "선생님, 요즘 공부도 어렵고 짝꿍이랑 사소한 오해로 다퉜는데 어떻게 화해해야 할지 모르겠어서 밤마다 잠이 안 와요..."
        }
      ];
      setCounsels(initialDummy);
      localStorage.setItem("counsel_board_local_data", JSON.stringify(initialDummy));
    }
  };

  useEffect(() => {
    loadCounsels();
  }, [supabaseClient]);

  // Handle student form submission
  const handleSubmitCounsel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const nameToSubmit = studentName.trim() || "익명의 학생";
    const contentToSubmit = content.trim();

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from("counsels")
          .insert([
            { student_name: nameToSubmit, content: contentToSubmit }
          ]);

        if (error) throw error;

        setSubmitSuccess(true);
        setStudentName("");
        setContent("");
        loadCounsels();
      } catch (err: any) {
        console.error("Supabase insert error:", err);
        setErrorMsg("Supabase 데이터 삽입 실패: " + err.message);
        // Fallback save locally
        saveToLocalStorage(nameToSubmit, contentToSubmit);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Local storage fallback
      saveToLocalStorage(nameToSubmit, contentToSubmit);
      setIsSubmitting(false);
    }
  };

  const saveToLocalStorage = (name: string, text: string) => {
    const newCounsel: CounselItem = {
      id: "local-" + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      student_name: name,
      content: text
    };
    const updated = [newCounsel, ...counsels];
    setCounsels(updated);
    localStorage.setItem("counsel_board_local_data", JSON.stringify(updated));
    setSubmitSuccess(true);
    setStudentName("");
    setContent("");
  };

  // Get AI recommended reply using server-side Gemini
  const handleGetAiRecommendation = async (counsel: CounselItem) => {
    setIsGeneratingAI(true);
    setAiReply("");
    try {
      const res = await fetch("/api/class-counsel/reply-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: counsel.student_name,
          content: counsel.content
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiReply(data.text);
        setCurrentReplyText(data.text);
      } else {
        throw new Error("AI 생성 오류");
      }
    } catch (err) {
      console.error(err);
      setAiReply("선생님, 따뜻한 마음의 편지가 날아가 버렸어요. 다시 시도해 주세요.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save the teacher's final reply locally
  const handleSaveReply = (counselId: string | number) => {
    if (!currentReplyText.trim()) return;
    
    const updated = {
      ...localReplies,
      [String(counselId)]: currentReplyText.trim()
    };
    setLocalReplies(updated);
    localStorage.setItem("counsel_local_replies", JSON.stringify(updated));
    
    // Refresh selected item
    if (selectedCounsel && selectedCounsel.id === counselId) {
      setSelectedCounsel({ ...selectedCounsel });
    }
    
    // Play subtle chimes audio (preloaded)
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleDeleteCounsel = async (id: string | number) => {
    if (!window.confirm("이 고민 글을 목록에서 지울까요?")) return;

    if (supabaseClient && typeof id === "number") {
      try {
        const { error } = await supabaseClient
          .from("counsels")
          .delete()
          .eq("id", id);
        if (error) throw error;
        loadCounsels();
        setSelectedCounsel(null);
      } catch (err: any) {
        alert("Supabase 삭제 오류: " + err.message);
      }
    } else {
      // Local delete
      const updated = counsels.filter(c => c.id !== id);
      setCounsels(updated);
      localStorage.setItem("counsel_board_local_data", JSON.stringify(updated));
      setSelectedCounsel(null);
    }
  };

  // Save custom Supabase credentials in local state for testing
  const handleSaveConfig = () => {
    localStorage.setItem("counsel_supabase_url", supabaseUrl.trim());
    localStorage.setItem("counsel_supabase_key", supabaseKey.trim());
    setShowConfig(false);
    loadCounsels();
  };

  // Clear credentials
  const handleClearConfig = () => {
    localStorage.removeItem("counsel_supabase_url");
    localStorage.removeItem("counsel_supabase_key");
    setSupabaseUrl("");
    setSupabaseKey("");
    setSupabaseClient(null);
    setShowConfig(false);
    setTimeout(() => loadCounsels(), 100);
  };

  // Copy SQL setup script to clipboard
  const copySQLToClipboard = () => {
    const sqlText = `-- 1. counsels 테이블 생성 쿼리문
CREATE TABLE IF NOT EXISTS counsels (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  student_name TEXT NOT NULL,
  content TEXT NOT NULL
);

-- (선택) RLS 보안 설정 활성화
ALTER TABLE counsels ENABLE ROW LEVEL SECURITY;

-- 안전하게 정책 생성 (DROP 문 없이 익명 블록을 사용하여 Supabase 경고창 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'counsels' AND policyname = '누구나 조회 가능'
  ) THEN
    CREATE POLICY "누구나 조회 가능" ON counsels FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'counsels' AND policyname = '누구나 작성 가능'
  ) THEN
    CREATE POLICY "누구나 작성 가능" ON counsels FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- 2. 테스트용 1건 가짜 데이터 삽입
INSERT INTO counsels (student_name, content)
VALUES ('익명의 금쪽이', '선생님, 요즘 공부도 어렵고 짝꿍이랑 사소한 오해로 다퉜는데 어떻게 화해해야 할지 모르겠어요...');`;

    navigator.clipboard.writeText(sqlText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div id="class-counsel-section" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col gap-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-stone-100 pb-4 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-800">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              우리 반 익명 고민 상담소
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Supabase 연동 지원
              </span>
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">우리 반 아이들의 속 깊은 이야기와 고민을 익명으로 수렴하고 공감해주는 치유의 게시판</p>
          </div>
        </div>

        {/* Mode Selector + Config Gear */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="bg-stone-100 p-1 rounded-full flex border border-stone-200 shadow-2xs text-[12px] font-bold">
            <button
              onClick={() => {
                setActiveMode("student");
                setSelectedCounsel(null);
                setSubmitSuccess(false);
              }}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeMode === "student"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              학생 모드 (글쓰기)
            </button>
            <button
              onClick={() => {
                setActiveMode("teacher");
                setSubmitSuccess(false);
                loadCounsels();
              }}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeMode === "teacher"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              선생님 모드 (목록)
            </button>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showConfig || isConfigured 
                ? "bg-amber-50 border-amber-200 text-amber-800" 
                : "bg-white border-stone-200 text-stone-500 hover:text-stone-800"
            }`}
            title="Supabase 연동 설정"
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
          </button>
        </div>
      </div>

      {/* Connection Indicator Alert */}
      {!isConfigured && !showConfig && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start gap-2.5 text-stone-600 text-[11px] font-medium">
            <AlertCircle className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-stone-800">Supabase가 아직 연동되지 않았습니다.</span> 지금은 브라우저 안전 캐시(로컬 모드)에 글이 저장됩니다.
              <p className="text-[10px] text-stone-400 mt-0.5">상단 설정 아이콘(⚙️)을 누르면 사용 중이신 Supabase 계정과 즉시 연동하여 실시간 데이터베이스를 구축할 수 있습니다.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowConfig(true)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 hover:underline shrink-0 cursor-pointer flex items-center gap-1"
          >
            연동 시작하기 <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Supabase Connection Setup Box */}
      {showConfig && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-800" /> Supabase 실시간 DB 연동 설정
            </h3>
            <span className="text-[10px] font-mono text-stone-400">Environment Config Helper</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600">Supabase URL</label>
              <input
                type="text"
                placeholder="https://your-project-ref.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-800"
              />
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3.5 text-[11px] text-stone-600 space-y-2">
            <p className="font-bold text-amber-900 flex items-center gap-1">
              <Code className="w-3.5 h-3.5" /> 1단계: Supabase SQL 에디터에 테이블 구축하기
            </p>
            <p>익명 고민 상담소를 위해 지정해주신 4개의 컬럼(<strong className="text-amber-950 font-bold">id, created_at, student_name, content</strong>)을 가진 테이블 생성 쿼리입니다. 아래 코드를 복사해서 Supabase SQL Editor에서 실행해주세요.</p>
            
            <div className="bg-stone-900 text-stone-200 p-3 rounded-lg font-mono text-[10px] leading-relaxed relative max-h-40 overflow-y-auto">
              <button 
                onClick={copySQLToClipboard}
                className="absolute top-2 right-2 p-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md transition-colors cursor-pointer border border-stone-700 flex items-center gap-1 text-[9px]"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> 복사 완료!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> 복사하기
                  </>
                )}
              </button>
              <pre className="whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS counsels (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  student_name TEXT NOT NULL,
  content TEXT NOT NULL
);`}</pre>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleClearConfig}
              className="px-3 py-1.5 border border-stone-200 hover:bg-stone-100 text-stone-500 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            >
              연동 초기화
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfig(false)}
                className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
              >
                연동 정보 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT MODE VIEW */}
      {activeMode === "student" && (
        <div className="max-w-2xl mx-auto w-full space-y-6">
          <div className="text-center space-y-1.5 py-4">
            <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-800 text-[10px] font-bold tracking-tight">
              🤫 완전한 비밀이 보장됩니다
            </div>
            <h3 className="text-lg font-bold text-stone-900">우리 반 친구를 위한 마음 우체통</h3>
            <p className="text-[12px] text-stone-500 font-medium">선생님께 털어놓고 싶은 고민이나 속상한 이야기를 남겨주세요. 익명이라 안전해요!</p>
          </div>

          {submitSuccess ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-50/50 border border-amber-100 rounded-2xl p-8 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-amber-800 text-white rounded-full flex items-center justify-center mx-auto text-lg">
                💌
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-950">고민이 소중하게 전달되었어요</h4>
                <p className="text-[11px] text-stone-500">선생님이 조만간 따뜻한 답변을 고민 수첩에 적어주실 거야. 조금만 기다려 줘!</p>
              </div>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
              >
                다른 고민도 남기기
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitCounsel} className="bg-stone-50 border border-stone-150 rounded-2xl p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> 학생 이름 (비워두면 '익명'으로 접수됩니다)
                </label>
                <input
                  type="text"
                  placeholder="예: 익명 금쪽이, 귀여운 병아리, 비밀 요원"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  maxLength={15}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-amber-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600">
                  고민 내용 (선생님께 나누고 싶은 속마음)
                </label>
                <textarea
                  placeholder="요즘 어떤 일로 마음이 힘든가요? 짝꿍이랑 투닥투닥했거나, 성적 걱정이 되거나, 부모님께 말하지 못하는 속사정을 편하게 적어보세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={5}
                  maxLength={2000}
                  className="w-full text-xs px-3.5 py-3 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-amber-800 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full py-3 bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>우체통으로 날아가는 중...</>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> 고민 보내기 (선생님께 전송)
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TEACHER MODE VIEW */}
      {activeMode === "teacher" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Counsel list */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-stone-500">
                접수된 고민 총 <strong className="text-amber-800">{counsels.length}</strong>건
              </span>
              <button 
                onClick={loadCounsels}
                className="text-[10px] text-amber-800 hover:underline font-bold cursor-pointer"
              >
                새로고침
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-16 w-full bg-stone-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : counsels.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-200 rounded-2xl bg-stone-50">
                <p className="text-xs text-stone-400 font-medium">아직 접수된 아이들의 고민이 없습니다.</p>
                <p className="text-[10px] text-stone-400 mt-1">학생 모드에서 임의로 고민 글을 작성해 보세요.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                {counsels.map((item) => {
                  const isSelected = selectedCounsel?.id === item.id;
                  const hasLocalReply = !!localReplies[String(item.id)];
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedCounsel(item);
                        setAiReply("");
                        setCurrentReplyText(localReplies[String(item.id)] || "");
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${
                        isSelected
                          ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-100"
                          : "bg-stone-50/50 hover:bg-stone-50 border-stone-200"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-stone-400" /> {item.student_name}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400">
                          {new Date(item.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                      
                      <div className="mt-2.5 flex justify-between items-center">
                        {hasLocalReply ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            답변 작성완료
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                            답변 대기중
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Detailed View & AI Assistant */}
          <div className="md:col-span-7">
            {selectedCounsel ? (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-stone-200 pb-3 gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-800" /> {selectedCounsel.student_name} 학생의 고민
                    </h4>
                    <span className="text-[10px] font-mono text-stone-400">
                      작성 일시: {new Date(selectedCounsel.created_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCounsel(selectedCounsel.id)}
                    className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="글 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Content Card */}
                <div className="bg-white border border-stone-150 rounded-xl p-4 shadow-3xs">
                  <p className="text-[12px] text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                    "{selectedCounsel.content}"
                  </p>
                </div>

                {/* AI Helper Banner */}
                <div className="bg-amber-100/40 border border-amber-200/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-800 animate-pulse" /> 담임 선생님을 위한 AI 위로 답장 비서
                    </span>
                    <button
                      onClick={() => handleGetAiRecommendation(selectedCounsel)}
                      disabled={isGeneratingAI}
                      className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-[10px] font-bold cursor-pointer disabled:bg-stone-300 transition-colors flex items-center gap-1"
                    >
                      {isGeneratingAI ? "AI 작성 중..." : "AI 답장 추천받기"}
                    </button>
                  </div>

                  {aiReply ? (
                    <div className="bg-white border border-amber-100 rounded-lg p-3 text-[11px] text-stone-600 leading-relaxed relative">
                      <span className="absolute top-2 right-2 text-[9px] font-bold text-amber-800/60 font-mono">Gemini-3.5-Flash</span>
                      <p className="whitespace-pre-wrap font-medium text-stone-700">{aiReply}</p>
                      <button
                        onClick={() => {
                          setCurrentReplyText(aiReply);
                        }}
                        className="mt-2 text-[9px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                      >
                        답장 수첩에 채워넣기 <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-stone-500">
                      아이에게 들려줄 다정한 공감 한마디가 떠오르지 않을 땐 AI 비서의 추천 답장 문안을 받아보세요.
                    </p>
                  )}
                </div>

                {/* Final Teacher Response Entry */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-600 block">
                    선생님이 남겨주는 한마디 답장 수첩 (학생 열람용)
                  </label>
                  <textarea
                    placeholder="아이에게 사랑과 용기가 가득한 답글을 입력해 주세요. (위 AI 추천 내용을 붙여넣어 편집하셔도 좋습니다)"
                    value={currentReplyText}
                    onChange={(e) => setCurrentReplyText(e.target.value)}
                    rows={4}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-amber-800 leading-relaxed text-stone-700"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-stone-400">
                      * 답변은 안전하게 브라우저 캐시에 수렴 및 보존됩니다.
                    </span>
                    <button
                      onClick={() => handleSaveReply(selectedCounsel.id)}
                      disabled={!currentReplyText.trim()}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-300 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      답변 저장하기 (영롱한 소리🔔)
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-[400px] border border-dashed border-stone-200 rounded-2xl bg-stone-50 flex flex-col items-center justify-center text-center p-6">
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-lg text-stone-400 mb-2">
                  👀
                </div>
                <h4 className="text-xs font-bold text-stone-800">선택된 고민이 없습니다</h4>
                <p className="text-[11px] text-stone-400 mt-0.5">왼쪽 고민 목록에서 학생의 이야기를 선택해서 읽고 소통해 주세요.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
