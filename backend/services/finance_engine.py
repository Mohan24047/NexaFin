
def generate_job_plan(income: float, expenses: float, risk_tolerance: str = "moderate") -> dict:
    """
    Generates a financial plan based on income and risk tolerance.
    Logic:
    - Base Savings: 20%
    - Base Investment: 15% (adjusted by risk)
    - Emergency Fund: 5% (or more if low risk)
    """
    
    # Ensure non-negative inputs
    income = max(0, income)
    expenses = max(0, expenses)
    
    # Risk adjustments
    invest_alloc = 0.15
    savings_alloc = 0.20
    
    if risk_tolerance == "low":
        invest_alloc = 0.05 # Conservative
        savings_alloc = 0.30 # Focus on safety
    elif risk_tolerance == "high":
        invest_alloc = 0.25 # Aggressive
        savings_alloc = 0.10 # Reduced cash drag

    savings = income * savings_alloc
    invest = income * invest_alloc
    emergency = income * 0.05
    
    disposable_income = income - expenses
    
    message = (
        f"Based on your ${income:,.2f} income and '{risk_tolerance}' risk profile, we recommend a focused strategy. "
        f"Allocate {savings_alloc*100:.0f}% (${savings:,.2f}) to savings/bonds on safety, "
        f"and {invest_alloc*100:.0f}% (${invest:,.2f}) to growth investments. "
        f"Maintain a steady 5% (${emergency:,.2f}) allocation for emergencies."
    )

    return {
        "monthly_income": income,
        "monthly_expenses": expenses,
        "recommended_savings": savings,
        "recommended_investment": invest,
        "recommended_emergency_fund": emergency,
        "message": message
    }
