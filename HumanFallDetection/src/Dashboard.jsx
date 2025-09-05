import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  const [status, setStatus] = useState("정상");
  const [alerts, setAlerts] = useState([
    { time: "14:32", text: "낙상 감지", type: "danger", cam: "카메라 #1" },
    { time: "13:10", text: "정상 동작", type: "normal", cam: "카메라 #1" },
    { time: "11:55", text: "의심 행동", type: "warning", cam: "카메라 #1" },
  ]);

  useEffect(() => {
    if (alerts.some((a) => a.type === "danger")) {
      setStatus("이상");
    } else if (alerts.some((a) => a.type === "warning")) {
      setStatus("주의");
    } else {
      setStatus("정상");
    }
  }, [alerts]);

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["시간,내용,카메라"]
        .concat(alerts.map((a) => `${a.time},${a.text},${a.cam}`))
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "alerts.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = () => {
    if (status === "정상") return "green";
    if (status === "주의") return "orange";
    return "red";
  };

  const addRandomAlert = () => {
    const samples = [
      { text: "낙상 감지", type: "danger" },
      { text: "의심 행동", type: "warning" },
      { text: "정상 동작", type: "normal" },
    ];
    const random = samples[Math.floor(Math.random() * samples.length)];
    const newAlert = {
      time: new Date().toLocaleTimeString(),
      text: random.text,
      type: random.type,
      cam: "카메라 #1",
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          📡 DACS 실시간 모니터링
          <span
            style={{
              marginLeft: "1rem",
              padding: "0.3rem 0.6rem",
              borderRadius: "12px",
              background: getStatusColor(),
              color: "white",
              fontSize: "0.85rem",
            }}
          >
            {status}
          </span>
        </h1>
        <button onClick={onLogout} className="topbar-button logout-button">
          로그아웃
        </button>
      </header>

      <main className="dashboard-main">
        {/* 좌측: 실시간 영상 */}
        <section className="video-section">
          <h2 className="section-title">카메라 #1 모니터링</h2>

          {/* 🔹 실시간 영상 미리보기 */}
          <div className="video-box">
            <img
              src="http://127.0.0.1:5000/video_feed"
              alt="실시간 미리보기"
              style={{ width: "100%", borderRadius: "12px" }}
            />
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/video")}
          >
            ▶ 영상 전체 보기
          </button>

          <button
            onClick={addRandomAlert}
            className="secondary-button"
            style={{ marginTop: "1rem" }}
          >
            🔔 랜덤 알림 추가
          </button>
        </section>

        {/* 우측: 알림 */}
        <section className="alert-section">
          <h2 className="section-title">이상행동 알림</h2>
          <ul className="alert-list">
            {alerts.map((a, idx) => (
              <li key={idx} className="alert-item">
                [{a.time}]{" "}
                <span
                  className={
                    a.type === "danger"
                      ? "alert-danger"
                      : a.type === "warning"
                      ? "alert-warning"
                      : ""
                  }
                >
                  {a.text}
                </span>{" "}
                - {a.cam}
              </li>
            ))}
          </ul>

          <div className="share-section mt-4">
            <button onClick={exportCSV} className="secondary-button">
              📥 알림 내보내기 (CSV)
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
