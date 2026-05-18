# apps/analytics/engine/simulation.py
import numpy as np

def run_monte_carlo_runway(
    initial_balance: float,
    drift_mu: float,
    volatility_sigma: float,
    days_to_drop: int,
    start_day_of_cycle: int = 0,
    start_day_of_week: int = 0,
    profile_model = None,
    num_paths: int = 1000
) -> dict:
    """
    Simulates the future trajectory of a wallet balance using Arithmetic Brownian Motion,
    dynamically scaled by a Scikit-Learn behavioral profile regression model.
    """
    if days_to_drop <= 0:
        return {
            "survival_probability": 1.0 if initial_balance > 0 else 0.0,
            "expected_depletion_day": None,
            "risk_status": "CLEAR_SKIES"
        }

    balance_matrix = np.zeros((num_paths, days_to_drop + 1))
    balance_matrix[:, 0] = initial_balance

    assumed_total_cycle_days = max(14, start_day_of_cycle + days_to_drop)

    dt = 1.0

    for t in range(1, days_to_drop + 1):
        simulated_day_of_cycle = start_day_of_cycle + (t - 1)
        simulated_day_of_week = (start_day_of_week + (t - 1)) % 7
        
        phase_pct = min(1.0, simulated_day_of_cycle / assumed_total_cycle_days)

        if profile_model and profile_model.is_trained:
            food_mult = profile_model.predict_multiplier(phase_pct, simulated_day_of_week, "FOOD")
            commute_mult = profile_model.predict_multiplier(phase_pct, simulated_day_of_week, "COMMUTE")
            school_mult = profile_model.predict_multiplier(phase_pct, simulated_day_of_week, "SCHOOL")
            
            ml_multiplier = (food_mult + commute_mult + school_mult) / 3.0
        else:
            ml_multiplier = 1.0

        dynamic_mu = drift_mu * ml_multiplier

        Z = np.random.normal(0, 1, num_paths)
        daily_delta = (-dynamic_mu * dt) + (volatility_sigma * np.sqrt(dt) * Z)
        
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
    expected_depletion_day = int(np.round(np.mean(depletion_days))) if len(depletion_days) > 0 else None

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