"""Demand router — peak demand prediction endpoint."""

import logging
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from api.auth import verify_api_key
from api.models import DemandPredictionResponse
from api.services import demand_predictor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demand", tags=["demand"])


@router.get("/predict", response_model=DemandPredictionResponse)
async def predict_demand(
    branch: Optional[Literal["Central", "East", "West"]] = None,
    peak_threshold: float = Query(default=0.75),
    _api_key: str = Depends(verify_api_key),
) -> DemandPredictionResponse:
    """Return demand matrix, peak periods, and ramp-up recommendations."""
    if peak_threshold <= 0.0 or peak_threshold >= 1.0:
        raise HTTPException(
            status_code=422,
            detail="peak_threshold must be between 0.0 and 1.0 (exclusive)",
        )

    try:
        return demand_predictor.predict(branch, peak_threshold)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error in demand prediction")
        raise HTTPException(
            status_code=500, detail="Internal server error",
        ) from exc
