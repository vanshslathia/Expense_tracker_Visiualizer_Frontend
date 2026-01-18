import { useState, useEffect } from "react";
import { Repeat, Plus, Calendar, Tag, Trash2, Power, PowerOff } from "lucide-react";
import Layout from "../Layout";
import { getRecurringRules, deleteRecurringRule, toggleRecurringRuleStatus } from "../../api/api";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import AddRecurringRule from "./AddRecurringRule";

const RecurringTransactions = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all, active, inactive

  useEffect(() => {
    fetchRules();
  }, [filter]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const isActive = filter === "all" ? null : filter === "active";
      const res = await getRecurringRules(isActive);
      setRules(res.data || []);
    } catch (error) {
      showErrorToast("Failed to fetch recurring transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recurring transaction?")) {
      return;
    }

    try {
      await deleteRecurringRule(id);
      showSuccessToast("Recurring transaction deleted");
      fetchRules();
    } catch (error) {
      showErrorToast("Failed to delete recurring transaction");
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleRecurringRuleStatus(id);
      showSuccessToast("Status updated");
      fetchRules();
    } catch (error) {
      showErrorToast("Failed to update status");
    }
  };

  const formatFrequency = (frequency, dayOfWeek, dayOfMonth) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    switch (frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return dayOfWeek !== undefined ? `Weekly (${days[dayOfWeek]})` : "Weekly";
      case "monthly":
        return dayOfMonth !== undefined ? `Monthly (Day ${dayOfMonth})` : "Monthly";
      case "yearly":
        return "Yearly";
      default:
        return frequency;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout>
      <div className="p-8 bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] text-slate-800 dark:text-white rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Repeat className="w-10 h-10 text-blue-500" />
            Recurring Transactions
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Recurring Transaction
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Repeat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No recurring transactions found</p>
            <p className="text-sm mt-2">Click "Add Recurring Transaction" to create one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rules.map((rule) => (
              <div
                key={rule._id}
                className="p-6 rounded-2xl bg-gradient-to-tr from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] shadow-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{rule.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatFrequency(rule.frequency, rule.dayOfWeek, rule.dayOfMonth)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rule.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium">{rule.category}</span>
                    <span className={`text-lg font-bold ${rule.amount < 0 ? "text-red-500" : "text-green-500"}`}>
                      ₹{Math.abs(rule.amount).toLocaleString()}
                    </span>
                  </div>

                  {rule.note && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{rule.note}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>Starts: {formatDate(rule.startDate)}</span>
                    {rule.endDate && <span>• Ends: {formatDate(rule.endDate)}</span>}
                  </div>

                  {rule.nextProcessDate && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Next: {formatDate(rule.nextProcessDate)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleToggle(rule._id)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                      rule.isActive
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                        : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                    }`}
                  >
                    {rule.isActive ? (
                      <>
                        <PowerOff className="w-4 h-4 inline mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 inline mr-2" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(rule._id)}
                    className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
            <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <AddRecurringRule
                onSuccess={() => {
                  setShowAddModal(false);
                  fetchRules();
                }}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecurringTransactions;
