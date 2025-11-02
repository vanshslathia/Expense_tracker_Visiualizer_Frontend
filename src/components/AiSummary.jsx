import { useEffect, useState } from "react";
import { Brain, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import axios from "axios";

const AiSummary = ({ userId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        // Construct API URL - note: AI routes are at /api/ai, not /api/v1/ai
        let apiUrl;
        if (import.meta.env.VITE_API_URL) {
          // Use VITE_API_URL if set (remove /api/v1 if present since AI routes use /api/ai)
          apiUrl = import.meta.env.VITE_API_URL.replace('/api/v1', '');
        } else if (window.location.hostname === 'localhost') {
          apiUrl = "http://localhost:5000";
        } else {
          // Default to Render backend
          apiUrl = "https://expense-tracker-visiualizer-backend.onrender.com";
        }
        
        const url = `${apiUrl}/api/ai/trend-insights/${userId}`;
        console.log("🔍 Fetching AI insights from:", url);
        
        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (res.data && res.data.success !== false) {
          setInsights(res.data);
        } else {
          console.warn("AI insights response indicates failure:", res.data);
          setInsights(null);
        }
      } catch (error) {
        console.error("Error fetching AI insights:", error);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }
        setInsights(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">🧠 Smart AI Dashboard</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Analyzing your spending patterns...</p>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const spendingTrend = insights.percentageChange > 0 
    ? { icon: <TrendingUp className="w-5 h-5 text-red-500" />, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" }
    : insights.percentageChange < 0
    ? { icon: <TrendingDown className="w-5 h-5 text-green-500" />, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" }
    : { icon: null, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          🧠 AI Monthly Summary
        </h3>
      </div>

      {/* Main Conversational Summary */}
      <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-5 border border-blue-100 dark:border-blue-900 mb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${spendingTrend.bg}`}>
            {spendingTrend.icon || <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          </div>
          <div className="flex-1">
            <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
              {insights.summary || insights.spendingChange}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {insights.currentMonthIncome > 0 && (
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">💰 Income</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              ₹{insights.currentMonthIncome?.toLocaleString() || "0"}
            </p>
          </div>
        )}
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">💸 Expenses</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">
            ₹{insights.currentMonthExpense?.toLocaleString() || "0"}
          </p>
        </div>
      </div>

      {/* Top Categories (if available) */}
      {insights.topCategories && insights.topCategories.length > 0 && (
        <div className="mt-4 bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">📊 Top Spending Categories</p>
          <div className="flex flex-wrap gap-2">
            {insights.topCategories.map((cat, idx) => {
              const percentage = insights.currentMonthExpense > 0 
                ? ((cat.amount / insights.currentMonthExpense) * 100).toFixed(0)
                : 0;
              return (
                <div key={idx} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{cat.category}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">({percentage}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiSummary;

