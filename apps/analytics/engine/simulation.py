import numpy as np

def run_monte_carlo_runway(
    initial_balance: float,
    drift_mu: float,
    volatility_sigma: float,
    days_to_drop: int,
    num_paths: int = 1000
) -> dict:
    """
    Simulates the future trajectory of a wallet balance using Arithmetic Brownian Motion.
    Returns the exact mathematical probability of survival and the expected timeline outcomes.
    """
    if days_to_drop <= 0:
        return {
            "survival_probability": 1.0 if initial_balance > 0 else 0.0,
            "expected_depletion_day": None,
            "risk_status": "CLEAR"
        }

    balance_matrix = np.zeros((num_paths, days_to_drop + 1))
    balance_matrix[:, 0] = initial_balance

    dt = 1.0
    for t in range(1, days_to_drop + 1):
        Z = np.random.normal(0, 1, num_paths)
        
        daily_delta = (-drift_mu * dt) + (volatility_sigma * np.sqrt(dt) * Z)
        
        balance_matrix[:, t] = balance_matrix[:, t - 1] + daily_delta

    depletion_days = []
    survived_paths_count = 0

    for path in range(num_paths):
        zero_crossings = np.where(balance_matrix[path, :] <= 0)[0]
        if zero_crossings.size > 0:
            first_depletion_day = int(zero_crossings[0])
            depletion_days.append(first_depletion_day)
        else:
            survived_paths_count += 1

    survival_probability = survived_paths_count / num_paths
    
    if len(depletion_days) > 0:
        expected_depletion_day = int(np.round(np.mean(depletion_days)))
    else:
        expected_depletion_day = None

    if survival_probability >= 0.85:
        risk_status = "CLEAR_SKIES"
    elif survival_probability >= 0.60:
        risk_status = "OVERCAST_TURBULENCE"
    elif survival_probability >= 0.30:
        risk_status = "STORM_WARNING"
    else:
        risk_status = "FLASH_FLOOD"

    return {
        "survival_probability": survival_probability,
        "expected_depletion_day": expected_depletion_day,
        "risk_status": risk_status
    }