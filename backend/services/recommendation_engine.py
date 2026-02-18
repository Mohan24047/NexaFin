import random


def calculate_confidence(user_data, asset_info: dict) -> int:
    """
    Calculate a dynamic AI confidence score (55-95%) for a recommendation.
    Factors: income stability, savings ratio, risk alignment, allocation weight, market outlook.
    """
    score = 50

    income = getattr(user_data, 'income', 0) or 0
    expenses = getattr(user_data, 'expenses', 0) or 0
    savings = getattr(user_data, 'monthly_savings', 0) or 0
    risk_tolerance = getattr(user_data, 'risk_tolerance', 'moderate') or 'moderate'

    # 1. Income stability: positive cash flow => more reliable recommendation
    if income > expenses and income > 0:
        score += 10

    # 2. Savings ratio: 3x+ income saved => strong financial base
    if savings > income * 3:
        score += 10
    elif savings > income:
        score += 5

    # 3. Risk alignment: does the asset match the user's risk profile?
    asset_risk = asset_info.get("risk", "moderate")
    if asset_risk == risk_tolerance:
        score += 15
    elif asset_risk == "moderate":
        score += 5  # moderate assets are somewhat suitable for everyone
    else:
        score -= 5

    # 4. Allocation strength: higher allocation = stronger recommendation
    alloc = asset_info.get("allocation", 30)
    if alloc >= 40:
        score += 5
    elif alloc >= 25:
        score += 3

    # 5. Market outlook factor
    outlook = asset_info.get("market_outlook", "medium")
    market_boost = {"low": 5, "medium": 10, "high": 15}
    score += market_boost.get(outlook, 10)

    # 6. Random jitter for realism (+-3)
    score += random.randint(-3, 3)

    # Clamp to 55-95 range
    score = max(55, min(score, 95))
    return score


def generate_recommendations(user_data):
    """
    Generate financial recommendations based on user data.
    Input: user_data object (SQLAlchemy model or dict)
    """
    # Extract data safely
    income = getattr(user_data, 'income', 0) or 0
    expenses = getattr(user_data, 'expenses', 0) or 0
    risk_tolerance = getattr(user_data, 'risk_tolerance', 'moderate') or 'moderate'

    disposable = max(0, income - expenses)

    # Base allocations
    base_invest = disposable * 0.5
    base_save = disposable * 0.3
    emergency_fund_monthly = disposable * 0.2

    # Risk adjustment
    risk_multiplier = 1.0
    if risk_tolerance == 'low':
        risk_multiplier = 0.6
    elif risk_tolerance == 'high':
        risk_multiplier = 1.4

    recommended_investment = base_invest * risk_multiplier
    recommended_savings = base_save

    # Dynamic confidence scores per recommendation category
    invest_confidence = calculate_confidence(user_data, {
        "risk": "high" if risk_multiplier > 1.0 else ("low" if risk_multiplier < 1.0 else "moderate"),
        "allocation": 50,
        "market_outlook": "high" if risk_tolerance == "high" else "medium",
    })

    savings_confidence = calculate_confidence(user_data, {
        "risk": "low",
        "allocation": 30,
        "market_outlook": "medium",
    })

    emergency_confidence = calculate_confidence(user_data, {
        "risk": "low",
        "allocation": 20,
        "market_outlook": "low",
    })

    # Overall confidence = weighted average
    overall_confidence = round(
        (invest_confidence * 0.5 + savings_confidence * 0.3 + emergency_confidence * 0.2)
    )

    print(f"[RecommendationEngine] Confidence — invest:{invest_confidence}%, savings:{savings_confidence}%, emergency:{emergency_confidence}%, overall:{overall_confidence}%")

    return {
        "monthly_disposable": disposable,
        "recommended_investment": round(recommended_investment, 2),
        "recommended_savings": round(recommended_savings, 2),
        "emergency_fund_allocation": round(emergency_fund_monthly, 2),
        "confidence_score": overall_confidence,
        "invest_confidence": invest_confidence,
        "savings_confidence": savings_confidence,
        "emergency_confidence": emergency_confidence,
        "message": f"Based on your {risk_tolerance} risk profile, we recommend investing ${round(recommended_investment, 2)} monthly."
    }
