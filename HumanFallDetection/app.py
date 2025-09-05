# app.py
from flask import Flask, Response, jsonify, request
import cv2
import torch
import multiprocessing as mp
import threading
import copy
import time

from .fall_detector import FallDetector
from .algorithms import extract_keypoints_parallel, alg2_sequential

app = Flask(__name__)

fall_detector = FallDetector()
latest_frame = None   # 최종 overlay 프레임 저장


def run_inference(video_source=0):
    """추론 실행 → latest_frame 에 최종 overlay 저장"""
    global latest_frame
    stop_event = mp.Event()

    # 큐 2개: (1) raw keypoints (2) 최종 overlay
    raw_queue = mp.Queue()
    overlay_queue = mp.Queue()

    counter1 = mp.Value("i", 0)
    counter2 = mp.Value("i", 0)

    argss = [copy.deepcopy(fall_detector.args)]
    argss[0].video = video_source

    # 프로세스1: keypoint 추출
    p1 = mp.Process(
        target=extract_keypoints_parallel,
        args=(raw_queue, argss[0], counter1, counter2, fall_detector.consecutive_frames, stop_event)
    )
    p1.start()

    # 프로세스2: skeleton+pred overlay
    p2 = mp.Process(
        target=alg2_sequential,
        args=([raw_queue], argss, fall_detector.consecutive_frames, stop_event)
    )
    p2.start()

    # overlay 큐에서 프레임 가져오기 (스레드)
    def process_output():
        global latest_frame
        while not stop_event.is_set():
            if not raw_queue.empty():
                data = raw_queue.get()
                if data is None:
                    break
                # overlay가 있으면 그걸 사용
                frame = data.get("overlay", data.get("img"))
                latest_frame = frame
        p1.join()
        p2.join()

    threading.Thread(target=process_output, daemon=True).start()


@app.route("/")
def index():
    return "Fall Detection Server is running!<br>Go to <a href='/video_feed'>/video_feed</a>"


def generate():
    """latest_frame → JPEG 변환 → 브라우저 스트리밍"""
    global latest_frame
    while True:
        if latest_frame is not None:
            ret, jpeg = cv2.imencode(".jpg", latest_frame)
            if ret:
                frame = jpeg.tobytes()
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
        time.sleep(0.03)


@app.route("/video_feed")
def video_feed():
    return Response(generate(),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/start", methods=["POST"])
def start_detection():
    data = request.get_json(force=True)
    video = data.get("video", 0)
    run_inference(video_source=video)
    return jsonify({"status": "running", "video": str(video)})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, threaded=True)


#python -m HumanFallDetection.app