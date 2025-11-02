import { useEffect, useState } from "react";
import { AlertTriangle, X, TrendingUp } from "lucide-react";
import { fetchBudgetAlerts } from "../api/api";

const BudgetAlerts = ({ userId }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    if (!userId) return;

    const loadAlerts = async () => {
      try {
        setLoading(true);
        const data = await fetchBudgetAlerts();
        setAlerts(data.alerts || []);
      } catch (error) {
        console.error("Error fetching budget alerts:", error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleDismiss = (category) => {
    setDismissedAlerts(prev => new Set([...prev, category]));
  };

  if (loading || alerts.length === 0) {
    return null;
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.category));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {visibleAlerts.map((alert, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between p-4 rounded-xl border-2 shadow-lg transition-all duration-300 ${
            alert.type === "exceeded"
              ? "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-700"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-700"
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className={`${alert.type === "exceeded" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}>
              {alert.type === "exceeded" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <TrendingUp className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-base ${
                alert.type === "exceeded"
                  ? "text-red-800 dark:text-red-200"
                  : "text-yellow-800 dark:text-yellow-200"
              }`}>
                {alert.type === "exceeded" ? "🔴" : "🟡"} {alert.message}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Budget: ₹{alert.goal.toLocaleString()} | Spent: ₹{alert.spent.toLocaleString()} ({alert.percentage}%)
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDismiss(alert.category)}
            className={`ml-4 p-1 rounded-full hover:bg-opacity-20 transition ${
              alert.type === "exceeded"
                ? "hover:bg-red-500 text-red-600 dark:text-red-400"
                : "hover:bg-yellow-500 text-yellow-600 dark:text-yellow-400"
            }`}
            title="Dismiss alert"
          >
            <X size={20} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default BudgetAlerts;

