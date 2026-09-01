# IBVAP FastAPI Backend (SIH 2026)

**Team**: BWU NEURAL NEXUS  
**Platform**: Intelligent Border Video Analytics Platform API  
**Architecture**: FastAPI • SQLite • Uvicorn • YOLOv11 & RTSP Integration Prepared  

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Launch FastAPI Defense Gateway

```bash
# Direct Python execution
python -m backend.main

# Or via Uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Diagnostic**: `http://localhost:8000/health`

---

## 📡 REST API Endpoints

### 📷 Cameras (`/api/cameras` & `/api/v1/cameras`)
- `GET /api/cameras` — Retrieve all 8 border camera nodes
- `GET /api/cameras/{id}` — Fetch specific camera node
- `POST /api/cameras` — Onboard new RTSP/ONVIF camera stream
- `PUT /api/cameras/{id}` — Update camera parameters
- `DELETE /api/cameras/{id}` — Decommission camera node
- `POST /api/cameras/test-rtsp` — Test RTSP stream latency & handshake
- `POST /api/cameras/{id}/reboot` — Remote camera soft-reboot

### 🚨 Alerts (`/api/alerts` & `/api/v1/alerts`)
- `GET /api/alerts?severity=critical&status=new` — Query threat queue
- `GET /api/alerts/{id}` — Fetch alert details & evidence metadata
- `POST /api/alerts` — Create/inject threat alert
- `POST /api/alerts/{id}/acknowledge` — Acknowledge alert
- `POST /api/alerts/{id}/escalate` — Dispatch Quick Reaction Force (QRF)
- `POST /api/alerts/{id}/dismiss` — Mark as false positive
- `POST /api/alerts/{id}/resolve` — Resolve incident

### 📜 Forensics Events (`/api/events` & `/api/v1/events`)
- `GET /api/events?eventType=person&threatLevel=critical&minConfidence=0.8` — Query historical archive
- `GET /api/events/{id}` — Fetch forensic snapshot record
- `POST /api/events/log` — Append AI event log

### ⚙️ System & Defense Matrix (`/api/system`)
- `GET /api/system/stats` — Real-time telemetry (uptime, active cameras, QRF readiness)
- `GET /api/system/config` — YOLOv11 model weights & inference thresholds
- `PUT /api/system/config` — Update AI model weights & fusion toggles

### ⚡ WebSocket Gateway
- `ws://localhost:8000/ws/alerts` — Real-time live threat broadcast channel

---

## 🧠 AI Subsystem Preparation (`backend/ai/`)
- `yolo_detector.py`: YOLOv11 model loading, TensorRT/ONNX runtime inference stub, confidence and IoU thresholding, normalized bounding boxes.
- `rtsp_stream.py`: RTSP frame ingestion, OpenCV/FFmpeg capture loop, reconnection backoff, latency metrics.
- `tripwire.py`: Vector cross-product line-crossing algorithm for virtual perimeter fences.
- `pipeline.py`: End-to-end edge pipeline orchestrator binding stream ingestion, YOLOv11 inference, and threat dispatch.
