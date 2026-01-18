import { useState } from "react";
import { X } from "lucide-react";
import { createRecurringRule } from "../../api/api";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

const categories = [
  "Food",
  "Entertainment",
  "Travel",
  "Shopping",
  "Savings",
  "Income",
  "Others",
  "Utilities",
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const AddRecurringRule = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Others",
    note: "",
    frequency: "monthly",
    dayOfWeek: undefined,
    dayOfMonth: 1,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "dayOfWeek" || name === "dayOfMonth" ? parseInt(value) || undefined : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.title || !formData.amount || !formData.startDate) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.frequency === "weekly" && formData.dayOfWeek === undefined) {
      setError("Please select a day of week for weekly frequency");
      return;
    }

    if (formData.frequency === "monthly" && !formData.dayOfMonth) {
      setError("Please select a day of month for monthly frequency");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfWeek: formData.frequency === "weekly" ? formData.dayOfWeek : undefined,
        dayOfMonth: formData.frequency === "monthly" ? formData.dayOfMonth : undefined,
        endDate: formData.endDate || null,
      };

      await createRecurringRule(payload);
      showSuccessToast("Recurring transaction created successfully!");
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to create recurring transaction";
      setError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Add Recurring Transaction</h2>
        <button
          onClick={onCancel}
          className="text-slate-500 hover:text-red-500 text-xl font-bold transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Rent, Netflix Subscription"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. -5000 for expense"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              required
            >
              {frequencies.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.frequency === "weekly" && (
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Day of Week <span className="text-red-500">*</span>
            </label>
            <select
              name="dayOfWeek"
              value={formData.dayOfWeek || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              required
            >
              <option value="">Select day</option>
              {daysOfWeek.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.frequency === "monthly" && (
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Day of Month <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="dayOfMonth"
              value={formData.dayOfMonth}
              onChange={handleChange}
              min="1"
              max="31"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              End Date (Optional)
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Note (Optional)
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="3"
            placeholder="Additional notes..."
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Recurring Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecurringRule;
