import openpifpaf
import torch
import logging
import copy
import torch.multiprocessing as mp
from .default_params import DEFAULT_CONSEC_FRAMES
from .algorithms import extract_keypoints_parallel, alg2_sequential


class Args:
    resolution = 0.4
    resize = None
    num_cams = 1
    video = 0
    debug = False
    disable_cuda = False
    plot_graph = False
    joints = True
    skeleton = True
    coco_points = False
    save_output = False
    fps = 18
    checkpoint = 'shufflenetv2k16w'

    # 👇 OpenPifPaf 관련 필수 옵션 추가
    decoder = 'cifcaf'
    headnets = None
    profile_decoder = False
    cif_th = 0.1
    caf_th = 0.1
    force_complete_pose = True
    force_single_pose = False
    instance_threshold = 0.2
    seed_threshold = 0.5
    tracking = False
    decoder_workers = 1

        # ---- OpenPifPaf tracking(TrackBase)에서 기대하는 필드들 (기본값 추가) ----
    tr_single_pose_threshold = 0.5
    tr_multi_pose_threshold  = 0.5
    tr_track_threshold = 0.2
    tr_association = 'iou'          # 'iou' 또는 'embedding' 등
    tr_keypoint_threshold = 0.2
    tr_verbose = False
    tr_reid = False                 # 재식별 안 씀



    # ✅ Device 관련
    device = torch.device('cpu')
    pin_memory = False



class FallDetector:
    def __init__(self, t=DEFAULT_CONSEC_FRAMES, queue=None):
        self.consecutive_frames = t
        self.args = self.cli()
        self.queue = queue
        self.stream_queue = queue


    def cli(self):
        args = Args()
        logging.basicConfig(level=logging.INFO)

        args.force_complete_pose = True
        args.instance_threshold = 0.2
        args.seed_threshold = 0.5

        args.device = torch.device('cuda' if torch.cuda.is_available() and not args.disable_cuda else 'cpu')
        args.pin_memory = args.device.type == 'cuda'

        # --- 누락된 tr_* 필드 자동 주입 (configure 직전) ---
        import re
        default_map = {
            "tr_single_pose_threshold": 0.5,
            "tr_multi_pose_threshold":  0.5,
            "tr_track_threshold":       0.2,
            "tr_association":          "iou",
            "tr_keypoint_threshold":    0.2,
            "tr_verbose":               False,
            "tr_reid":                  False,
            "tr_multi_pose_n":          5,
            "tr_minimum_threshold":     0.2,
            "trackingpose_track_recovery": False,
            "trackingpose_single_seed": False,
            "posesimilarity_distance":  "cosine",   # ✅ 여기 중요
        }


        while True:
            try:
                # 여기서 필요한 tr_*을 다 읽는데, 없으면 아래 except로 떨어짐
                openpifpaf.decoder.configure(args)
                break
            except AttributeError as e:
                m = re.search(r"has no attribute '([^']+)'", str(e))
                if not m:
                    raise
                name = m.group(1)

                # 휴리스틱: 이름 패턴으로 기본값 추정
                if name in default_map:
                    val = default_map[name]
                elif name.endswith("_threshold"):
                    val = 0.2
                elif name.endswith("_n"):
                    val = 5
                elif name.endswith("_verbose"):
                    val = False
                elif name == "tr_association":
                    val = "iou"
                else:
                    val = 0  # 안전한 기본값(숫자형)

                setattr(args, name, val)
                print(f"[WARN] missing `{name}` → set default {val!r} and retry")

        # decoder 설정이 성공한 뒤에 네트워크 팩토리 설정
        openpifpaf.network.Factory.configure(args)
        print('[DEBUG] Args:', vars(args))
        return args


    def begin(self):
        print('[FallDetector] Starting...')
        e = mp.Event()
        queues = [mp.Queue() for _ in range(self.args.num_cams)]
        counter1 = mp.Value('i', 0)
        counter2 = mp.Value('i', 0)
        argss = [copy.deepcopy(self.args) for _ in range(self.args.num_cams)]

        process1 = mp.Process(target=extract_keypoints_parallel,
                              args=(queues[0], argss[0], counter1, counter2, self.consecutive_frames, e))
        process1.start()

        if self.args.coco_points:
            process1.join()
        else:
            process2 = mp.Process(target=alg2_sequential,
                      args=(queues, argss, self.consecutive_frames, e, self.stream_queue))

            process2.start()

        process1.join()
        if not self.args.coco_points:
            process2.join()
        print('[FallDetector] Exiting...')

# 예시: 추론 루프에서 오버레이 완료된 BGR 프레임을 yield
import cv2

def frames():
    # TODO: 모델 로드 등 초기화
    cap = cv2.VideoCapture(0)  # 데모; 실제는 네 입력 소스/파이프라인
    if not cap.isOpened():
        return
    try:
        while True:
            ok, frame = cap.read()
            if not ok: break
            # TODO: 낙상 추론 + 오버레이 그리기
            yield frame  # <- 최종 BGR 프레임
    finally:
        cap.release()
