from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from engine.simulation import run_monte_carlo_runway
from engine.behavior import BehavioralProfileModel

app = FastAPI(title="Kumpas Analytics Core")

behavioral_profile = BehavioralProfileModel()

class SimulationRequest(BaseModel):
    initial_balance: float
    drift_mu: float
    volatility_sigma: float
    days_to_drop: int
    current_day_of_cycle: int = Field(0, gte=0)
    current_day_of_week: int = Field(0, gte=0, lte=6)

class TrainRequest(BaseModel):
    transactions: list

@app.post("/analytics/train-profile")
async def train_profile(payload: TrainRequest):
    try:
        success = behavioral_profile.train(payload.transactions)
        return {"status": "SUCCESS" if success else "INSUFFICIENT_DATA"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Training Interruption: {str(e)}")

@app.post("/analytics/simulate-runway")
async def simulate_runway(payload: SimulationRequest):
    try:
        results = run_monte_carlo_runway(
            initial_balance=payload.initial_balance,
            drift_mu=payload.drift_mu,
            volatility_sigma=payload.volatility_sigma,
            days_to_drop=payload.days_to_drop,
            start_day_of_cycle=payload.current_day_of_cycle,
            start_day_of_week=payload.current_day_of_week,
            profile_model=behavioral_profile,
            num_paths=1000
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)