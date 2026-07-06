import React, { useState, useEffect, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { 
  Heart, Sparkles, Send, Award, Trash2, Settings, CheckCircle, 
  Code, Copy, RefreshCw, AlertCircle, Calendar, Plus, Smile, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CheerItem {
  id: string | number;
  created_at: string;
  category: string;
  content: string;
  emoji: string;
  bg_color: string;
}

const CATEGORY_MAP = [
  { id: "cheer", label: "응원", emoji: "💖", bg: "bg-rose-50 border-rose-200 text-rose-800", hoverBg: "hover:bg-rose-100/30" },
  { id: "luck", label: "행운/응원", emoji: "🍀", bg: "bg-emerald-50 border-emerald-200 text-emerald-800", hoverBg: "hover:bg-emerald-100/30" },
  { id: "thanks", label: "감사", emoji: "🤝", bg: "bg-amber-50 border-amber-200 text-amber-800", hoverBg: "hover:bg-amber-100/30" },
  { id: "can-do", label: "격려/극복", emoji: "💪", bg: "bg-sky-50 border-sky-200 text-sky-800", hoverBg: "hover:bg-sky-100/30" },
  { id: "happy", label: "미소/행복", emoji: "🌸", bg: "bg-purple-50 border-purple-200 text-purple-800", hoverBg: "hover:bg-purple-100/30" },
];

const COLOR_THEMES = [
  { id: "rose", bg: "bg-rose-50 border-rose-150 text-rose-800 shadow-rose-100/40", selectBg: "bg-rose-100" },
  { id: "emerald", bg: "bg-emerald-50 border-emerald-150 text-emerald-800 shadow-emerald-100/40", selectBg: "bg-emerald-100" },
  { id: "amber", bg: "bg-amber-50 border-amber-150 text-amber-800 shadow-amber-100/40", selectBg: "bg-amber-100" },
  { id: "sky", bg: "bg-sky-50 border-sky-150 text-sky-800 shadow-sky-100/40", selectBg: "bg-sky-100" },
  { id: "purple", bg: "bg-purple-50 border-purple-150 text-purple-800 shadow-purple-100/40", selectBg: "bg-purple-100" },
];

export default function ClassCheerBoard() {
  // Credentials & Configuration
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem("counsel_supabase_url") || "");
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem("counsel_supabase_key") || "");
  const [showConfig, setShowConfig] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // New cheer card form
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("cheer");
  const [selectedColor, setSelectedColor] = useState("rose");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Board Data
  const [cheers, setCheers] = useState<CheerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sound ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload beautiful soft chimes sound
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    audioRef.current.load();
    audioRef.current.volume = 0.25;
  }, []);

  const playSparkleSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser policy:", e));
    }
  };

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

  // Load cheers from Supabase
  const loadCheers = async () => {
    setLoading(true);
    setErrorMsg(null);

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("cheers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCheers(data || []);
      } catch (err: any) {
        console.error("Failed to fetch cheers from Supabase:", err);
        setErrorMsg("Supabase 연동에 실패했습니다. 아래 연동 설명에 따라 SQL Editor를 통해 cheers 테이블을 생성하셨는지 확인해 주세요.");
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    } else {
      loadFromLocalStorage();
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem("counsel_cheers_local_data");
    if (saved) {
      setCheers(JSON.parse(saved));
    } else {
      // Seed initial dummy cheers
      const initialDummy: CheerItem[] = [
        {
          id: "dummy-cheer-1",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          category: "cheer",
          content: "선생님 항상 건강하세요! 늘 다정하게 말씀해 주셔서 감사합니다.",
          emoji: "💖",
          bg_color: "rose"
        },
        {
          id: "dummy-cheer-2",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          category: "luck",
          content: "우리 반 친구들아! 오늘 시험 다들 힘내서 잘 치자! 홧팅!",
          emoji: "🍀",
          bg_color: "emerald"
        },
        {
          id: "dummy-cheer-3",
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          category: "thanks",
          content: "급식 먹을 때 제 식판 닦아주는 거 도와준 짝꿍 고마워~",
          emoji: "🤝",
          bg_color: "amber"
        }
      ];
      setCheers(initialDummy);
      localStorage.setItem("counsel_cheers_local_data", JSON.stringify(initialDummy));
    }
  };

  useEffect(() => {
    loadCheers();
  }, [supabaseClient]);

  // Handle post submit
  const handleSubmitCheer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    playSparkleSound();

    const catObj = CATEGORY_MAP.find(c => c.id === selectedCategory) || CATEGORY_MAP[0];
    const newCheerPayload = {
      category: selectedCategory,
      content: content.trim(),
      emoji: catObj.emoji,
      bg_color: selectedColor
    };

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from("cheers")
          .insert([newCheerPayload]);

        if (error) throw error;

        setContent("");
        loadCheers();
      } catch (err: any) {
        console.error("Supabase insert error:", err);
        setErrorMsg("Supabase 연동 저장 실패: " + err.message);
        saveToLocalStorage(newCheerPayload);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      saveToLocalStorage(newCheerPayload);
      setIsSubmitting(false);
    }
  };

  const saveToLocalStorage = (payload: Omit<CheerItem, "id" | "created_at">) => {
    const newCheer: CheerItem = {
      id: "local-cheer-" + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      ...payload
    };
    const updated = [newCheer, ...cheers];
    setCheers(updated);
    localStorage.setItem("counsel_cheers_local_data", JSON.stringify(updated));
    setContent("");
  };

  // Delete cheer
  const handleDeleteCheer = async (id: string | number) => {
    if (!window.confirm("이 소중한 응원 카드를 지울까요?")) return;

    if (supabaseClient && typeof id === "number") {
      try {
        const { error } = await supabaseClient
          .from("cheers")
          .delete()
          .eq("id", id);

        if (error) throw error;
        loadCheers();
      } catch (err: any) {
        alert("Supabase 삭제 오류: " + err.message);
      }
    } else {
      const updated = cheers.filter(c => c.id !== id);
      setCheers(updated);
      localStorage.setItem("counsel_cheers_local_data", JSON.stringify(updated));
    }
  };

  // Save customized config
  const handleSaveConfig = () => {
    localStorage.setItem("counsel_supabase_url", supabaseUrl.trim());
    localStorage.setItem("counsel_supabase_key", supabaseKey.trim());
    setShowConfig(false);
    loadCheers();
  };

  // Clear credentials
  const handleClearConfig = () => {
    localStorage.removeItem("counsel_supabase_url");
    localStorage.removeItem("counsel_supabase_key");
    setSupabaseUrl("");
    setSupabaseKey("");
    setSupabaseClient(null);
    setShowConfig(false);
    setTimeout(() => loadCheers(), 100);
  };

  // Copy SQL script to clipboard
  const copySQLToClipboard = () => {
    const sqlText = `-- 1. cheers 테이블 생성 쿼리문
CREATE TABLE IF NOT EXISTS cheers (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  emoji TEXT NOT NULL,
  bg_color TEXT NOT NULL
);

-- (선택) RLS 보안 설정 활성화
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

-- 안전하게 정책 생성 (DROP 문 없이 익명 블록을 사용하여 Supabase 경고창 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cheers' AND policyname = '누구나 응원글 조회 가능'
  ) THEN
    CREATE POLICY "누구나 응원글 조회 가능" ON cheers FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cheers' AND policyname = '누구나 응원글 작성 가능'
  ) THEN
    CREATE POLICY "누구나 응원글 작성 가능" ON cheers FOR INSERT WITH CHECK (true);
  END IF;
END
$$;`;

    navigator.clipboard.writeText(sqlText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const filteredCheers = filterCategory === "all" 
    ? cheers 
    : cheers.filter(c => c.category === filterCategory);

  return (
    <div id="class-cheerboard-section" className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col gap-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-stone-100 pb-4 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-50 rounded-xl text-rose-800">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              우리 반 따뜻한 응원 한 줄 보드
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-0.5">
                🔔 리얼타임 연동 가능
              </span>
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">선생님과 아이들 모두가 서로에게 비타민 같은 응원과 격려, 행운을 선물하는 칭찬 게시판</p>
          </div>
        </div>

        {/* Action Controls & Settings */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              showConfig || isConfigured 
                ? "bg-rose-50 border-rose-200 text-rose-800" 
                : "bg-white border-stone-200 text-stone-500 hover:text-stone-800"
            }`}
            title="Supabase 연동 설정"
          >
            <Settings className="w-4 h-4" />
            Supabase 연동설정
          </button>
        </div>
      </div>

      {/* Supabase Config Container */}
      {showConfig && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-rose-800" /> Supabase 실시간 응원 보드 연동
            </h3>
            <span className="text-[10px] font-mono text-stone-400">Cheers Table Creator</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600">Supabase URL</label>
              <input
                type="text"
                placeholder="https://your-project-ref.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-rose-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:border-rose-800"
              />
            </div>
          </div>

          <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3.5 text-[11px] text-stone-600 space-y-2">
            <p className="font-bold text-rose-900 flex items-center gap-1">
              <Code className="w-3.5 h-3.5" /> Supabase SQL Editor용 응원 게시판 테이블 생성 코드
            </p>
            <p>익명 고민 상담소용 테이블 외에, 응원 카드 저장을 위해 아래의 <strong className="text-rose-950 font-bold">cheers</strong> 테이블 쿼리를 복사하여 동일하게 실행해주세요.</p>
            
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
              <pre className="whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS cheers (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  emoji TEXT NOT NULL,
  bg_color TEXT NOT NULL
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
                className="px-4 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
              >
                연동 정보 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Create section (Left) and Stickyboard corkboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Writing and Selecting card options */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-stone-50 border border-stone-150 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <Plus className="w-4 h-4 text-rose-700" /> 새 응원 카드 쓰기
            </h3>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600">카테고리 선택</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-1.5">
                {CATEGORY_MAP.map(cat => {
                  const isSel = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSel 
                          ? "bg-rose-800 border-rose-800 text-white shadow-xs" 
                          : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
                      }`}
                    >
                      <span className="text-lg block leading-none mb-1">{cat.emoji}</span>
                      <span className="text-[10px] font-bold block truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600">스티커 색상 테마</label>
              <div className="flex gap-2">
                {COLOR_THEMES.map(theme => {
                  const isSel = selectedColor === theme.id;
                  const colMap = CATEGORY_MAP.find(c => c.id === selectedCategory) || CATEGORY_MAP[0];
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedColor(theme.id)}
                      className={`w-7 h-7 rounded-full border transition-transform flex items-center justify-center cursor-pointer ${
                        isSel ? "scale-110 ring-2 ring-rose-800/40 border-rose-800" : "border-stone-200 hover:scale-105"
                      } ${theme.selectBg}`}
                      title={`${theme.id} 스티커`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Content Textarea */}
            <form onSubmit={handleSubmitCheer} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600">따뜻한 응원 글귀 (최대 100자)</label>
                <textarea
                  placeholder="아이들이나 동료 선생님께 건네고 싶은 기분 좋은 한마디를 마음껏 채워보세요. 긍정의 에너지는 기적을 만들어요 ✨"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={100}
                  required
                  rows={4}
                  className="w-full text-xs px-3.5 py-3 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-rose-800 leading-relaxed text-stone-700"
                />
                <div className="text-right text-[10px] text-stone-400 font-medium">
                  {content.length}/100자
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full py-2.5 bg-rose-800 hover:bg-rose-950 disabled:bg-stone-300 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>전송 중...</>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> 따끈한 응원 스티커 붙이기 (🔔 Chime!)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Healing Statistics Mini Card */}
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1">
                <Award className="w-4 h-4 text-rose-800" /> 교실의 마음 온도 지표
              </h4>
              <p className="text-[10px] text-stone-500 font-medium">칭찬과 온정이 가득한 행복한 우리 교실</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-rose-800">{cheers.length}</span>
              <span className="text-[10px] font-bold text-rose-950 block">도달한 온기 ℃</span>
            </div>
          </div>
        </div>

        {/* Right column: Sticky note board corkboard! */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap justify-between items-center gap-3 bg-stone-50 border border-stone-200/60 p-3 rounded-2xl">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterCategory === "all"
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:bg-stone-200"
                }`}
              >
                전체보기
              </button>
              {CATEGORY_MAP.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    filterCategory === cat.id
                      ? "bg-stone-800 text-white"
                      : "text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={loadCheers}
              className="p-1.5 hover:bg-stone-200 rounded-lg text-stone-500 transition-colors cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Corkboard Layout */}
          <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-6 min-h-[420px] relative shadow-inner overflow-hidden">
            {/* Soft corkboard visual grid pattern background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
              backgroundImage: "radial-gradient(#d97706 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px"
            }} />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-12">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="h-32 bg-stone-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredCheers.length === 0 ? (
              <div className="h-full py-24 text-center space-y-2 relative z-10">
                <p className="text-sm font-bold text-amber-900/60 flex items-center justify-center gap-1">
                  📌 아직 부착된 칭찬 카드가 없습니다
                </p>
                <p className="text-xs text-stone-400">왼쪽의 마음 입력 칸을 이용해서 첫 번째 따뜻함을 선물해 보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
                <AnimatePresence>
                  {filteredCheers.map((item, index) => {
                    // Generate subtle rotations and offsets for authentic sticky note looks
                    const rotation = [
                      "rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-1.5", "-rotate-1.5"
                    ][index % 6];
                    
                    const themeObj = COLOR_THEMES.find(t => t.id === item.bg_color) || COLOR_THEMES[0];
                    const categoryObj = CATEGORY_MAP.find(c => c.id === item.category) || CATEGORY_MAP[0];

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ scale: 0.9, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.03, rotate: index % 2 === 0 ? 1 : -1, zIndex: 10 }}
                        onClick={playSparkleSound}
                        className={`p-4 rounded-md border shadow-xs aspect-square flex flex-col justify-between transition-all duration-200 cursor-pointer text-left relative ${themeObj.bg} ${rotation}`}
                      >
                        {/* Pin aesthetic button */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-rose-500 rounded-full shadow-xs border border-rose-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                        </div>

                        {/* Top Metadata */}
                        <div className="flex justify-between items-center pb-2 border-b border-dashed border-stone-200 mb-2">
                          <span className="text-[10px] font-bold flex items-center gap-1 opacity-75">
                            {item.emoji} {categoryObj.label}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCheer(item.id);
                            }}
                            className="p-1 rounded-sm text-stone-400 hover:text-red-600 hover:bg-stone-100/40 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Card Content Text */}
                        <div className="flex-1 overflow-y-auto pr-1">
                          <p className="text-xs font-sans leading-relaxed break-all font-semibold">
                            {item.content}
                          </p>
                        </div>

                        {/* Footer date */}
                        <div className="pt-2 text-right border-t border-dashed border-stone-200 mt-2 flex justify-between items-center">
                          <span className="text-[9px] text-stone-400 font-bold block">
                            🍀 행운의 전령
                          </span>
                          <span className="text-[9px] text-stone-400 block font-mono">
                            {new Date(item.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
