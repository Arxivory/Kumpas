import numpy as np
from sklearn.linear_model import Ridge
from sklearn.preprocessing import OneHotEncoder

class BehavioralProfileModel:
    def __init__(self):
        self.model = Ridge(alpha=1.0)
        self.encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        self.is_trained = False
        self.categories_list = ["FOOD", "COMMUTE", "DORM", "SCHOOL", "ADJUSTMENT", "ALLOWANCE"]
        
        categories_array = np.array(self.categories_list).reshape(-1, 1)
        self.encoder.fit(categories_array)

    def train(self, transactions: list):
        """
        Trains the linear model to identify spending velocity multipliers.
        Expects a list of dictionaries containing: phaseProgressPct, dayOfWeek, category, amount
        """
        if len(transactions) < 5:
            self.is_trained = False
            return False

        X_features = []
        y_targets = []

        all_amounts = [t['amount'] for t in transactions]
        base_mean_spend = np.mean(all_amounts) if len(all_amounts) > 0 else 1.0

        for tx in transactions:
            phase = tx['phaseProgressPct']
            phase_squared = phase ** 2 
            
            day_of_week = tx['dayOfWeek']

            cat_vector = self.encoder.transform([[tx['category']]])[0]

            feature_row = np.hstack(([phase, phase_squared, day_of_week], cat_vector))
            X_features.append(feature_row)

            relative_velocity = tx['amount'] / (base_mean_spend if base_mean_spend > 0 else 1)
            y_targets.append(relative_velocity)

        self.model.fit(np.array(X_features), np.array(y_targets))
        self.is_trained = True
        return True

    def predict_multiplier(self, phase_pct: float, day_of_week: int, category: str) -> float:
        """
        Predicts a spending velocity multiplier for a specific future day.
        1.0 means baseline standard spending. 1.8 means an 80% surge.
        """
        if not self.is_trained:
            return 1.0 

        cat_vector = self.encoder.transform([[category]])[0]
        feature_row = np.hstack(([phase_pct, phase_pct ** 2, day_of_week], cat_vector)).reshape(1, -1)
        
        prediction = self.model.predict(feature_row)[0]
        
        return float(max(0.1, prediction))