// /server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ CORS 허용 (5173번 포트에서 오는 요청 허용)
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],  // 허용할 메서드
  allowedHeaders: ["Content-Type"] // 허용할 헤더
}));

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Slack 알림 API
app.post("/api/notify", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "메시지가 필요합니다." });
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      throw new Error(`Slack 전송 실패: ${response.statusText}`);
    }

    res.json({ success: true, message: "Slack 알림 전송 완료" });
  } catch (error) {
    console.error("Slack Error:", error);
    res.status(500).json({ error: "Slack 전송 중 오류 발생" });
  }
});

// 서버 실행
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
