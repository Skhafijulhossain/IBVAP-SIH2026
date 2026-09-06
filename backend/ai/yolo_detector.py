"""
YOLOv11 Deep Vision Detector for Border Surveillance
Loads YOLOv11 (yolo11n.pt) via Ultralytics, processes OpenCV image frames,
and filters detections for Person, Vehicle, and Animal categories with normalized coordinates.
"""

import os
from typing import List, Dict, Any, Optional, Union
import numpy as np
import cv2

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    YOLO = None

from ..models.schemas import AiDetectionItem, NormalizedBBox


class YOLOv11Detector:
    """
    Ultralytics YOLOv11 deep vision detection engine for border surveillance.
    Automatically downloads and loads 'yolo11n.pt', running inference on OpenCV frames.
    """

    # Category taxonomy mapping from standard COCO class names to requested categories
    CATEGORY_MAPPING: Dict[str, str] = {
        # Person category
        "person": "person",

        # Vehicle category (cars, trucks, motorcycles, buses, trains, boats, bicycles, airplanes)
        "bicycle": "vehicle",
        "car": "vehicle",
        "motorcycle": "vehicle",
        "airplane": "vehicle",
        "bus": "vehicle",
        "train": "vehicle",
        "truck": "vehicle",
        "boat": "vehicle",

        # Animal category (wildlife & domestic animals)
        "bird": "animal",
        "cat": "animal",
        "dog": "animal",
        "horse": "animal",
        "sheep": "animal",
        "cow": "animal",
        "elephant": "animal",
        "bear": "animal",
        "zebra": "animal",
        "giraffe": "animal",
    }

    def __init__(
        self,
        model_name: str = "yolo11n.pt",
        confidence_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        device: Optional[str] = None
    ):
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.device = device
        self.model = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        """Loads yolo11n.pt automatically via Ultralytics."""
        if not ULTRALYTICS_AVAILABLE:
            print("[YOLOv11 Warning] Ultralytics package not available.")
            return

        try:
            print(f"[YOLOv11] Loading model '{self.model_name}'...")
            self.model = YOLO(self.model_name)
            # Warm up model with a dummy tensor so first live video frame is instant
            dummy = np.zeros((160, 160, 3), dtype=np.uint8)
            self.model.predict(source=dummy, conf=0.5, verbose=False, device=self.device)
            self.is_loaded = True
            print(f"[YOLOv11] Successfully loaded and warmed up '{self.model_name}'. Ready for inference.")
        except Exception as e:
            print(f"[YOLOv11 Error] Failed to load '{self.model_name}': {e}")
            self.is_loaded = False

    def detect_categories(
        self,
        image_frame: np.ndarray,
        conf_threshold: Optional[float] = None
    ) -> List[AiDetectionItem]:
        """
        Executes YOLOv11 detection on an OpenCV BGR image frame.
        Filters detected objects for 'person', 'vehicle', and 'animal',
        and calculates normalized bounding boxes (x, y, w, h) in [0.0, 1.0].

        Args:
            image_frame: OpenCV BGR image numpy array (H, W, C)
            conf_threshold: Optional minimum confidence override

        Returns:
            List of AiDetectionItem objects matching the required schema.
        """
        if not self.is_loaded or self.model is None:
            if not self._load_model_retry():
                return []

        if image_frame is None or not isinstance(image_frame, np.ndarray) or image_frame.size == 0:
            return []

        img_h, img_w = image_frame.shape[:2]
        if img_h == 0 or img_w == 0:
            return []

        active_conf = conf_threshold if conf_threshold is not None else self.confidence_threshold

        try:
            # Run Ultralytics YOLOv11 inference
            results = self.model.predict(
                source=image_frame,
                conf=active_conf,
                iou=self.iou_threshold,
                verbose=False,
                device=self.device
            )

            detections: List[AiDetectionItem] = []

            if not results or len(results) == 0:
                return []

            result = results[0]
            boxes = result.boxes

            if boxes is None or len(boxes) == 0:
                return []

            for i in range(len(boxes)):
                box = boxes[i]
                cls_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())

                # Get class name from model names dictionary
                raw_class_name = self.model.names.get(cls_id, str(cls_id)).lower()

                # Filter only requested target categories: person, vehicle, animal
                if raw_class_name not in self.CATEGORY_MAPPING:
                    continue

                target_category = self.CATEGORY_MAPPING[raw_class_name]

                # Bounding box in pixel coordinates [x1, y1, x2, y2]
                xyxy = box.xyxy[0].tolist()
                x1, y1, x2, y2 = xyxy[0], xyxy[1], xyxy[2], xyxy[3]

                # Normalize bounding box coordinates to [0.0, 1.0]
                norm_x = max(0.0, min(1.0, x1 / float(img_w)))
                norm_y = max(0.0, min(1.0, y1 / float(img_h)))
                norm_w = max(0.0, min(1.0, (x2 - x1) / float(img_w)))
                norm_h = max(0.0, min(1.0, (y2 - y1) / float(img_h)))

                item = AiDetectionItem(
                    class_name=target_category,
                    confidence=round(confidence, 4),
                    bbox=NormalizedBBox(
                        x=round(norm_x, 4),
                        y=round(norm_y, 4),
                        w=round(norm_w, 4),
                        h=round(norm_h, 4),
                    )
                )
                detections.append(item)

            return detections

        except Exception as e:
            print(f"[YOLOv11 Inference Error] {e}")
            return []

    def _load_model_retry(self) -> bool:
        """Attempt to re-initialize model if not loaded."""
        self._load_model()
        return self.is_loaded


# Global singleton instance
yolo_detector = YOLOv11Detector(model_name="yolo11n.pt")
