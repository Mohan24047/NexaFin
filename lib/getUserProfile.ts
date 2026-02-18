export interface UserProfile {
    id: string
    email: string
    user_type: 'job' | 'startup' | null
    monthly_income: number | null
    monthly_expenses: number | null
    revenue: number | null
    employees: number | null
    budget: number | null
    market_description: string | null
    current_savings: number | null
    risk_tolerance: string | null
    investment_goal: string | null
    investment_override: number | null // Deprecated
    investment_amount: number | null
    ai_investment_amount: number | null
    monthly_investment: number | null
    // Corporate Treasury fields
    cash_balance: number | null
    runway_months: number | null
    debt: number | null
    other_assets: number | null
    // Identity verification
    gst_number: string | null
    aadhaar_number: string | null
    created_at: string
}

const BACKEND_URL = "http://127.0.0.1:8000";

export async function fetchProfile(token: string): Promise<UserProfile | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) return null;

        const data = await res.json();
        const flatProfile: UserProfile = {
            id: data.id,
            email: data.email,
            created_at: data.created_at,
            user_type: data.data?.user_type || null,
            monthly_income: data.data?.income || null,
            monthly_expenses: data.data?.expenses || null,
            revenue: data.data?.revenue || null,
            employees: data.data?.employees || null,
            budget: data.data?.budget || null,
            market_description: data.data?.market_text || null,
            current_savings: data.data?.current_savings || null,
            risk_tolerance: data.data?.risk_tolerance || null,
            investment_goal: data.data?.investment_goal || null,
            investment_override: data.data?.investment_override || null,
            investment_amount: data.data?.investment_amount || null,
            ai_investment_amount: data.data?.ai_investment_amount || null,
            monthly_investment: data.data?.monthly_investment || null,
            cash_balance: data.data?.cash_balance ?? null,
            runway_months: data.data?.runway_months ?? null,
            debt: data.data?.debt ?? null,
            other_assets: data.data?.other_assets ?? null,
            gst_number: data.data?.gst_number ?? null,
            aadhaar_number: data.data?.aadhaar_number ?? null,
        };

        return flatProfile;
    } catch (e) {
        console.error("Failed to fetch profile", e);
        return null;
    }
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<{ error: string | null }> {
    const token = localStorage.getItem("token");
    if (!token) return { error: "Not authenticated" };

    try {
        const userId = localStorage.getItem("user_id");
        console.log("Saving profile for User ID:", userId);

        const res = await fetch(`${BACKEND_URL}/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(profile)
        });

        if (!res.ok) {
            const err = await res.json();
            return { error: err.detail || "Failed to save profile" };
        }

        return { error: null };
    } catch (e) {
        return { error: "Network error" };
    }
}
