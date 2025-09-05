import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const VideoPage = () => {
  const navigate = useNavigate();

  // 🔹 Slack 알림 보내기 함수
  const sendSlackAlert = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "🚨 [DACS] 이상행동이 감지되었습니다! 실시간 확인 필요!",
        }),
      });

      if (response.ok) {
        alert("✅ Slack 알림이 전송되었습니다.");
      } else {
        alert("❌ Slack 알림 전송 실패.");
      }
    } catch (error) {
      console.error("Slack 전송 에러:", error);
      alert("⚠️ 서버 연결 실패.");
    }
  };

  return (
    <div className="video-fullscreen">
      {/* 상단 바 */}
      <header className="video-topbar">
        <h1 className="video-title">📡 실시간 영상 모니터링</h1>
      </header>

      {/* 영상 */}
      <main className="video-main-full">
        {/* Flask MJPEG 스트림을 img 태그로 표시 */}
        <img
          src="http://127.0.0.1:5000/video_feed"
          alt="실시간 모니터링"
          className="video-screen"
        />
      </main>

      {/* 🔹 Slack 알림 버튼 */}
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button onClick={sendSlackAlert} className="primary-button">
          🚨 Slack 알림 보내기
        </button>
      </div>
    </div>
  );
};

export default VideoPage;
