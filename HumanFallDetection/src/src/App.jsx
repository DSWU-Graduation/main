import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./Dashboard.jsx";
import VideoPage from "./VideoPage.jsx";   // 🔹 새 페이지 import

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(false);

  const kakaoRestApiKey = "3ad4b7c5dd711284281f28e4b844a208";
  const kakaoRedirectUri = "http://localhost:5173/oauth";
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${kakaoRestApiKey}&redirect_uri=${kakaoRedirectUri}`;

  // 로그인 폼 제출
  const handleSubmit = (event) => {
    event.preventDefault();
    const validUsername = "admin";
    const validPassword = "qwer1234";

    if (username === validUsername && password === validPassword) {
      setIsLoggedIn(true);
    } else {
      setMessageContent("로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.");
      setShowMessage(true);
    }
  };

  // 카카오 로그인 처리
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      setLoading(true);
      setMessageContent("카카오 계정으로 로그인 중...");
      setShowMessage(true);

      setTimeout(() => {
        setIsLoggedIn(true);
        setLoading(false);
        setShowMessage(false);
      }, 1000);

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 카카오 공유 버튼
  useEffect(() => {
    const checkKakaoReady = setInterval(() => {
      if (
        window.Kakao &&
        typeof window.Kakao.isInitialized === "function" &&
        window.Kakao.isInitialized()
      ) {
        clearInterval(checkKakaoReady);
        const kakaoShareBtn = document.getElementById("kakaotalk-share-btn");
        if (kakaoShareBtn) {
          try {
            window.Kakao.Share.createCustomButton({
              container: "#kakaotalk-share-btn",
              templateId: 1292208,
              templateArgs: {
                title: "DACS 알림",
                description: "객체의 이상행동이 감지되었습니다!",
              },
            });
          } catch (error) {
            console.error("카카오톡 공유 버튼 오류:", error);
            setMessageContent("카카오톡 공유 버튼 로드 실패");
            setShowMessage(true);
          }
        }
      }
    }, 100);
    return () => clearInterval(checkKakaoReady);
  }, []);

  return (
    <Router>
      <div className="main-container">
        {isLoggedIn ? (
          <Routes>
            <Route
              path="/"
              element={<Dashboard onLogout={() => setIsLoggedIn(false)} />}
            />
            <Route path="/video" element={<VideoPage />} />
          </Routes>
        ) : (
          <div className="login-card">
            <h1 className="title">DACS</h1>
            <p className="subtitle">
              <b className="font-semibold">Duksung AI CCTV Service</b>
              <br />
              객체의 이상행동을 감지합니다.
            </p>
            <div className="form-section">
              <h2 className="section-title">로그인</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="input-group">
                  <label htmlFor="username" className="input-label">
                    아이디
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="password" className="input-label">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="form-password-input"
                  />
                </div>
                <button type="submit" className="primary-button">
                  로그인
                </button>
              </form>
              {/* <div className="mt-4 text-center">
                <p className="separator-text">또는</p>
                <button
                  onClick={() => (window.location.href = kakaoAuthUrl)}
                  className="kakao-button"
                >
                  카카오 로그인
                </button>
              </div> */}
              {/* <div className="share-section">
                <p className="share-text">카카오톡으로 알림 공유하기</p>
                <div id="kakaotalk-share-btn" className="inline-block"></div>
              </div> */}
            </div>
            {showMessage && (
              <div className="modal-container">
                <div className="modal-content">
                  <p className="modal-text">{messageContent}</p>
                  <button
                    onClick={() => setShowMessage(false)}
                    className="modal-button"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
