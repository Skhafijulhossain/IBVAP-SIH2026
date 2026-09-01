"""
Virtual Fence Tripwire & Intrusion Geometry Engine
Computes 2D vector intersections between target trajectory paths and virtual tripwire coordinates.
"""

from typing import Tuple, Optional, Dict, Any
from ..models.schemas import BoundingBox, WireCoordinates


class TripwireEngine:
    """
    Evaluates whether bounding box trajectories breach virtual border fence lines.
    """

    @staticmethod
    def check_line_intersection(
        p1: Tuple[float, float],
        p2: Tuple[float, float],
        q1: Tuple[float, float],
        q2: Tuple[float, float]
    ) -> bool:
        """
        Cross-product 2D line segment intersection test.
        """
        def ccw(a, b, c):
            return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0])

        return (ccw(p1, q1, q2) != ccw(p2, q1, q2)) and (ccw(p1, p2, q1) != ccw(p1, p2, q2))

    @classmethod
    def evaluate_breach(
        cls,
        box: BoundingBox,
        wire: Optional[WireCoordinates],
        prev_center: Optional[Tuple[float, float]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates if target center point crossed the demarcated virtual line wire.
        """
        if not wire:
            return {"is_breach": False, "confidence": 0.0, "type": "none"}

        # Current center of bounding box in % coordinates (0-100)
        curr_center = (box.x + box.width / 2.0, box.y + box.height / 2.0)
        
        # If no previous track, test proximity within 4% of line
        wire_p1 = (wire.x1, wire.y1)
        wire_p2 = (wire.x2, wire.y2)

        if prev_center:
            crossed = cls.check_line_intersection(prev_center, curr_center, wire_p1, wire_p2)
            if crossed:
                return {
                    "is_breach": True,
                    "confidence": 0.92,
                    "type": "line_crossing",
                    "label": "Virtual Tripwire Breach Imminent"
                }

        # Bounding box bottom edge touching wire line threshold
        bottom_mid = (box.x + box.width / 2.0, box.y + box.height)
        if abs(bottom_mid[1] - ((wire.y1 + wire.y2) / 2.0)) < 5.0:
            return {
                "is_breach": True,
                "confidence": 0.88,
                "type": "line_crossing",
                "label": "Boundary Demarcation Touched"
            }

        return {"is_breach": False, "confidence": 0.0, "type": "none"}
