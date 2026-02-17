import json

def generate_portfolio(amount, risk_tolerance, user_type='job'):
    """
    Generate portfolio allocation based on risk tolerance and user type.
    """
    allocations = []
    
    if user_type == 'startup':
        allocations = [
            {"asset": "Business Reinvestment", "percent": 60, "amount": amount * 0.60, "color": "#10B981"}, # Emerald
            {"asset": "Cash Reserve (OpEx)", "percent": 20, "amount": amount * 0.20, "color": "#3B82F6"},   # Blue
            {"asset": "Market Hedge (Puts/Gold)", "percent": 20, "amount": amount * 0.20, "color": "#F59E0B"} # Amber
        ]
        return json.dumps(allocations)
    
    if risk_tolerance == 'low':
        allocations = [
            {"asset": "Index Funds (S&P 500)", "percent": 60, "amount": amount * 0.60, "color": "#10B981"}, # Emerald
            {"asset": "Government Bonds", "percent": 30, "amount": amount * 0.30, "color": "#3B82F6"}, # Blue
            {"asset": "Gold / Real Estate", "percent": 10, "amount": amount * 0.10, "color": "#F59E0B"}  # Amber
        ]
    elif risk_tolerance == 'high':
        allocations = [
            {"asset": "Tech Growth Stocks", "percent": 60, "amount": amount * 0.60, "color": "#8B5CF6"}, # Violet
            {"asset": "Emerging Markets", "percent": 30, "amount": amount * 0.30, "color": "#EC4899"},   # Pink
            {"asset": "Crypto / Alt Assets", "percent": 10, "amount": amount * 0.10, "color": "#EF4444"}  # Red
        ]
    else: # moderate
        allocations = [
            {"asset": "Diversified ETFs", "percent": 50, "amount": amount * 0.50, "color": "#3B82F6"}, # Blue
            {"asset": "Tech Sector", "percent": 30, "amount": amount * 0.30, "color": "#8B5CF6"},      # Violet
            {"asset": "Corporate Bonds", "percent": 20, "amount": amount * 0.20, "color": "#10B981"}   # Emerald
        ]
        
    return json.dumps(allocations)
