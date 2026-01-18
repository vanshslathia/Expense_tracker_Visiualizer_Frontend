import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Heart, AlertCircle, CheckCircle } from "lucide-react";
import { getFinancialHealthScore, getHistoricalHealthScores } from "../../api/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FinancialHealthScore = () => {
  const [scoreData, setScoreData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const [scoreRes, historyRes] = await Promise.all([
        getFinancialHealthScore(),
        getHistoricalHealthScores(6),
      ]);
      setScoreData(scoreRes.data);
      setHistoricalData(historyRes.data || []);
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return null;
  }

  const score = scoreData.score || 0;
  const breakdown = scoreData.breakdown || {};
  const insights = scoreData.insights || [];

  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Chart data
  const chartData = {
    labels: historicalData.map((d) => {
      const [year, month] = d.month.split("-");
      return new Date(year, month - 1).toLocaleDateString("en-US", { month: "short" });
    }),
    datasets: [
      {
        label: "Health Score",
        data: historicalData.map((d) => d.score),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Heart className={`w-8 h-8 ${getScoreColor(score)}`} />
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Health Score</h3>
      </div>

      {/* Score Display */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <div className={`w-32 h-32 rounded-full ${getScoreBgColor(score)}/20 flex items-center justify-center border-4 ${getScoreColor(score)} border-current`}>
            <span className={`text-4xl font-extrabold ${getScoreColor(score)}`}>{score}</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <span className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded">
              /100
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key} className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-white">
              {value.score || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">
              {value.weight}% weight
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      {historicalData.length > 0 && (
        <div className="mb-6" style={{ height: "200px" }}>
          <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Monthly Trend
          </h4>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Insights & Recommendations
          </h4>
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-sm ${
                insight.type === "success"
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : insight.type === "warning"
                  ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                  : insight.type === "error"
                  ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              }`}
            >
              <div className="flex items-start gap-2">
                {insight.type === "success" ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{insight.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinancialHealthScore;
