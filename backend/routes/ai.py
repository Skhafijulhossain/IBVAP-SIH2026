import time
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Query, HTTPException, status
import cv2
import numpy as np

from ..ai.yolo_detector import yolo_detector
from ..models.schemas import AiDetectionResponse

router = APIRouter(prefix="/ai", tags=["AI Detection"])


@router.post(
    "/detect",
    response_model=AiDetectionResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_200_OK,
    summary="YOLOv11 Deep Vision Inference",
    description="Accepts an image frame via OpenCV, executes YOLOv11 inference, and detects person, vehicle, and animal."
)
async def detect_objects(
    file: UploadFile = File(..., description="Image file (JPEG/PNG/WebP/BMP) for AI analysis"),
    conf: Optional[float] = Query(0.25, ge=0.05, le=0.99, description="Minimum confidence threshold")
):
    """
    POST /api/ai/detect & POST /api/v1/ai/detect
    Performs real-time YOLOv11 inference on an uploaded image frame using OpenCV.
    Returns normalized bounding boxes, confidence score, and class name ('person', 'vehicle', 'animal').
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        # Allow any file that has an image filename extension as fallback
        valid_exts = (".jpg", ".jpeg", ".png", ".webp", ".bmp")
        if not file.filename or not file.filename.lower().endswith(valid_exts):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file.content_type}'. Please upload a valid image (JPEG, PNG, WebP, BMP)."
            )

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        # Decode image using OpenCV
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OpenCV failed to decode image. Image data may be corrupted."
            )

        start_time = time.time()
        detections = yolo_detector.detect_categories(frame, conf_threshold=conf or 0.25)
        inference_time = round((time.time() - start_time) * 1000, 2)

        return AiDetectionResponse(
            detections=detections,
            model=yolo_detector.model_name,
            inference_time_ms=inference_time,
            total_detections=len(detections),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Detection Pipeline error: {str(e)}"
        )
