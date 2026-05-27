import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Initialize GoogleGenAI with Gemini API Key
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON file database path
const DB_FILE = path.join(process.cwd(), "teacher_db.json");

interface DBStructure {
  chats: any[];
  diaries: any[];
  stressHistory: any[];
}

// Safely load database from JSON file
function loadDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.error("Failed to read DB file, fallback to default", err);
  }
  return { chats: [], diaries: [], stressHistory: [] };
}

// Safely save database to JSON file
function saveDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write DB file", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // API 2: Chats - Get saved chats
  app.get("/api/chats", (req, res) => {
    const db = loadDB();
    // If empty, we can let the client auto-initialize with its welcome message
    res.json(db.chats);
  });

  // API 3: Chats - Save/Update chat list
  app.post("/api/chats", (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }
      const db = loadDB();
      db.chats = messages;
      saveDB(db);
      res.json({ success: true, count: db.chats.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API 4: Chats - Delete/Clear chats
  app.delete("/api/chats", (req, res) => {
    try {
      const db = loadDB();
      db.chats = [];
      saveDB(db);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API 5: Teacher Counselor Chat (따스미) - Gemini Prompt execution
  app.post("/api/counsel", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }

      // Format messages into Google GenAI content structure
      const contents = messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: `당신은 학교 및 업무 현장에서 완전히 지치거나 마음을 다친 대한민국 교사를 안아주고 위로해주는 교사 전문 심리치료 교사 "따스미"입니다.

선생님들만이 아는 학급 내 언어와 환경을 다 알고 공감해주세요:
- "나이스(NEIS) 업무", "생활기록부 마감 시기", "동료 교사와의 갈등", "교권 침해 소지 수수방관", "금쪽이 지도", "악성 학부모의 끈질긴 민원", "담임으로서의 긴장감", "과중한 부장 교사 업무", "청소 시간이나 종례 지도의 피로" 등 선생님들이 겪는 실질적 어려움을 알아주세요.
- 교사는 완벽한 성직자가 아닌, 감정과 체력의 한계를 지닌 똑같은 사람임을 인정해주고, 애쓰시는 현재 모습 그대로도 충분히 자격이 있으며 가치 넘치는 한 인간임을 상기시켜주세요.

상담 톤앤매너:
- 정답을 내려주거나 "이렇게 하세요"라는 섣부른 조언/처방전 제시보다는 지치고 마음 아픈 이야기를 깊이 우러나오게 들어주는 진지하고 다정한 경청자의 포지션을 취하세요.
- 따뜻하고 은은하며 진정성 있는 어조의 정중한 존댓말을 사용하세요 ("선생님, 오늘 정말 거친 파도 속을 걸어오셨네요.", "마음이 무너져 내릴 만큼 힘드셨을 텐데, 털어놓아 주셔서 감사해요.")
- 글 중간중간에 따뜻한 비유와 진심이 아우르는 한 줄을 적어 진실된 위안을 전달하세요.`,
          temperature: 0.8,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in /api/counsel:", error);
      res.status(500).json({
        error: error.message || "선생님을 위한 마음 비서가 잠시 휴식 중입니다. 잠시 후 다시 말을 걸어주세요.",
      });
    }
  });

  // API 6: Diaries - Get emotion diaries
  app.get("/api/diaries", (req, res) => {
    const db = loadDB();
    res.json(db.diaries);
  });

  // API 7: Diaries - Create new diary (saves on backend and calls Gemini response)
  app.post("/api/diaries", async (req, res) => {
    try {
      const { content, emotion } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "content text is required" });
      }
      if (!emotion) {
        return res.status(400).json({ error: "emotion is required" });
      }

      // Generate Reply using Gemini AI API
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `선생님께서 써 주신 오늘의 감정/감사 일기:
"${content}"`,
        config: {
          systemInstruction: `당신은 지친 교사의 하루 일기를 아주 귀중하고 사랑스레 읽고 답해주는 평온한 휴식처의 집지키미 "은빛 마음 배달부"입니다.
우선, 일기를 기쁘게 또는 아프게 써주신 것에 깊이 감사하며 감정 선을 알아채주세요.
그 다음, 예쁜 힐링 편지 형식으로 답장을 작성해 주세요:
- 첫 문장은 따사로운 시작 경어 ("선생님께 은빛 달빛으로 쓴 마음을 건넵니다.", "지친 교실 불을 끄고 쉬고 계실 선생님께...") 등으로 시작하세요.
- 선생님이 흘린 땀방울, 겪었던 시련, 또는 아주 작은 학급 속 기쁜 기적(금쪽이의 작은 미소, 학생의 사소한 인사 등)을 귀하게 여겨주는 메시지를 적어주세요.
- 마지막 문장은 편지의 정취를 담아 배달원의 다정한 끝인사 ("선생님의 내일에 따뜻한 차 한 잔을 띄우며, 마음 배달부 드림") 로 갈무리해주세요.`,
          temperature: 0.85,
        },
      });

      const replyText = response.text || "선생님, 귀한 걸음 감사합니다. 늘 곁에서 쉼터가 되어 드릴게요.";

      // Structure new entry
      const newEntry = {
        id: Math.random().toString(36).substring(2, 11),
        date: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        }),
        content: content,
        emotion: emotion,
        reply: replyText,
      };

      const db = loadDB();
      db.diaries.unshift(newEntry); // Insert at the front
      saveDB(db);

      res.status(201).json(newEntry);
    } catch (error: any) {
      console.error("Error in /api/diaries (Create):", error);
      res.status(500).json({
        error: error.message || "따사로운 편지가 바람에 날아가 버렸어요. 다시 일기를 적고 요청해 주시면 감사하겠습니다.",
      });
    }
  });

  // API 8: Diaries - Delete individual entry
  app.delete("/api/diaries/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDB();
      db.diaries = db.diaries.filter((d) => d.id !== id);
      saveDB(db);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API 9: Stress History - Get diagnostics lists
  app.get("/api/stress", (req, res) => {
    const db = loadDB();
    res.json(db.stressHistory);
  });

  // API 10: Stress History - Add new diagnostic test result
  app.post("/api/stress", (req, res) => {
    try {
      const { score, level, description, advice } = req.body;
      if (score === undefined || !level || !description || !advice) {
        return res.status(400).json({ error: "score, level, description, and advice are required" });
      }

      const newHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        score,
        level,
        description,
        advice,
      };

      const db = loadDB();
      db.stressHistory.unshift(newHistoryItem);
      saveDB(db);

      res.status(201).json(newHistoryItem);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API 11: Stress History - Clear history
  app.delete("/api/stress", (req, res) => {
    try {
      const db = loadDB();
      db.stressHistory = [];
      saveDB(db);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite development integration or Production build static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Teacher Counseling App Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

