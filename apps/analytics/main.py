from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from engine.simulation import run_monte_carlo_runway

app = FastAPI(
    title="Kumpas Analytics Core",
    description="Stochastic Simulation Engine for Runway Stress-Testing"
)

class SimulationRequest(BaseModel):
    initial_balance: float = Field(..., gte=0, description="Total liquid balance across active user wallets")
    drift_mu: float = Field(..., gte=0, description="Average historical spend rate per day (Daily Burn Velocity)")
    volatility_sigma: float = Field(..., gte=0, description="Standard deviation of daily spending variations")
    days_to_drop: int = Field(..., gte=0, description="Number of days remaining until next allowance drop")

@app.post("/analytics/simulate-runway")
async def simulate_runway(payload: SimulationRequest):
    try:
        results = run_monte_carlo_runway(
            initial_balance=payload.initial_balance,
            drift_mu=payload.drift_mu,
            volatility_sigma=payload.volatility_sigma,
            days_to_drop=payload.days_to_drop,
            num_paths=1000
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quant Simulation Runtime Interruption: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)