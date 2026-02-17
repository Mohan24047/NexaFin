
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
    else: # moderate
        risk_multiplier = 1.0
        
    recommended_investment = base_invest * risk_multiplier
    
    # Rebalance savings if investment changes (optional, or just keep savings fixed? 
    # User prompt says "Adjust by risk: if risk = low -> invest * 0.6". 
    # It doesn't explicitly say where the difference goes, but usually it goes to savings.
    # However, the user ONLY specified the multiplication logic. I will stick to returning the calculated values.
    # Note: If invest drops, where does the money go? The prompt isn't specific. 
    # "Return: { recommended_investment, recommended_savings, emergency_fund, monthly_disposable, message }"
    # I will calculate strictly as requested.
    
    recommended_savings = base_save 
    # If we want to be smart, if invest is lower, savings should be higher?
    # The prompt logic: "base_invest = disposable * 0.5". "if risk=low -> invest * 0.6".
    # This implies final investment is 0.5 * 0.6 = 0.3 of disposable.
    # It leaves 0.2 floating. I'll just return the values as calculated.
    
    return {
        "monthly_disposable": disposable,
        "recommended_investment": round(recommended_investment, 2),
        "recommended_savings": round(recommended_savings, 2),
        "emergency_fund_allocation": round(emergency_fund_monthly, 2),
        "message": f"Based on your {risk_tolerance} risk profile, we recommend investing ${round(recommended_investment, 2)} monthly."
    }
