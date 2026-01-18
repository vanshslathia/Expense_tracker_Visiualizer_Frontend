import React, { useEffect, useState, useRef, useMemo } from "react";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Calendar, Tag } from "lucide-react";
import TransactionReminders from "./TransactionReminders";
import Layout from "./Layout";
import { getTransactions, deleteTransaction, exportTransactions } from "../api/api";
import { showErrorToast, showSuccessToast } from "../utils/toast";

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg w-[90%] max-w-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          Confirm Delete
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete this transaction? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exporting, setExporting] = useState(false);
  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showExportModal, setShowExportModal] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const listRef = useRef();
  const loadingRef = useRef(false);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);

  // 🔥 Fetch with pagination, search, filter
  const fetchTransactions = async (pageNum = 1, reset = false) => {
    console.log(
      `📡 Fetching transactions | page=${pageNum}, search="${search}", filter="${filter}"`
    );
    setLoading(true);
    loadingRef.current = true;
    try {
      const res = await getTransactions(pageNum, 10, search, filter);
      if (reset) {
        setTransactions(res.transactions);
      } else {
        setTransactions((prev) => [...prev, ...res.transactions]);
      }
      setHasMore(res.hasMore);
      hasMoreRef.current = res.hasMore;
      setPage(pageNum);
      pageRef.current = pageNum;
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      setError("Error fetching transactions");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // ✅ Initial load (mount pe ek hi call)
  useEffect(() => {
    fetchTransactions(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Re-fetch on search/filter change (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTransactions(1, true);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search, filter]);

  // ✅ Infinite scroll
  useEffect(() => {
    const div = listRef.current;
    if (!div) return;

    const handleScroll = () => {
      if (
        hasMoreRef.current &&
        !loadingRef.current &&
        div.scrollTop + div.clientHeight >= div.scrollHeight - 50
      ) {
        fetchTransactions(pageRef.current + 1);
      }
    };

    div.addEventListener("scroll", handleScroll);
    return () => div.removeEventListener("scroll", handleScroll);
  }, []);

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTransaction(deleteId);
      setTransactions((prev) => prev.filter((txn) => txn._id !== deleteId));
    } catch (err) {
      console.error("❌ Error deleting transaction:", err);
      alert("Error deleting transaction");
    } finally {
      setIsModalOpen(false);
      setDeleteId(null);
    }
  };

  const totalSpent = transactions
    .filter((txn) => txn.amount < 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalIncome = transactions
    .filter((txn) => txn.amount > 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const net = totalIncome + totalSpent;

  // Group transactions by month
  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach(txn => {
      const date = new Date(txn.date || txn.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(txn);
    });

    // Sort months (most recent first) and transactions within each month (most recent first)
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0]?.date || a[1][0]?.createdAt);
      const dateB = new Date(b[1][0]?.date || b[1][0]?.createdAt);
      return dateB - dateA;
    });

    // Sort transactions within each month by date (most recent first)
    sortedGroups.forEach(([_, txns]) => {
      txns.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
      });
    });

    return sortedGroups;
  }, [transactions]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const parseFilename = (header) => {
    if (!header) return null;
    const match = /filename="?([^"]+)"?/i.exec(header);
    return match?.[1];
  };

  const handleExport = async () => {
    if (!exportMonth) {
      showErrorToast("Please select a month and year to export.");
      return;
    }
    const [yearStr, monthStr] = exportMonth.split("-");
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!month || !year || month < 1 || month > 12) {
      showErrorToast("Invalid month selection.");
      return;
    }

    setExporting(true);
    try {
      const response = await exportTransactions(exportFormat, search, filter, month, year);
      const suggestedName =
        parseFilename(response.headers["content-disposition"]) ||
        `Expense_Report_${exportMonth}_${exportFormat === "ppt" ? "pptx" : exportFormat}`;
      const mimeType =
        response.headers["content-type"] ||
        (exportFormat === "csv"
          ? "text/csv"
          : exportFormat === "ppt"
          ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          : "application/pdf");

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", suggestedName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccessToast("Export ready! Download started.");
    } catch (err) {
      console.error("❌ Error exporting data:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.message ||
        "Failed to export data. Please try again.";
      showErrorToast(msg);
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200 dark:border-slate-700 p-6 sm:p-8 md:p-10 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] transition-all duration-500">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-slate-800 dark:text-white mb-10">
          💳 Transaction Dashboard
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
          {/* LEFT SIDE */}
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition backdrop-blur-md shadow-sm"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-60 px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-800 dark:text-white transition shadow-sm"
              >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Travel">Travel</option>
                <option value="Utilities">Utilities</option>
                <option value="Income">Income</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Export format
                </span>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-transparent border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="ppt">PPT</option>
                </select>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition"
                title="Export Data"
              >
                Export Data
              </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {transactions.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  No transactions found. Add your first transaction to get started!
                </p>
              </div>
            )}

            <div
              ref={listRef}
              className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
            >
              {groupedTransactions.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    No transactions found. Add your first transaction to get started!
                  </p>
                </div>
              )}

              {groupedTransactions.map(([month, monthTransactions]) => (
                <div key={month} className="mb-8">
                  {/* Month Header */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 text-white px-4 py-3 rounded-t-xl mb-3 shadow-lg">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Calendar size={20} />
                      {month}
                    </h3>
                  </div>

                  {/* Transactions for this month */}
                  <ul className="space-y-3">
                    {monthTransactions.map((txn) => (
                      <li
                        key={txn._id}
                        className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Icon */}
                          <div className={`p-2 rounded-lg ${
                            txn.amount < 0 
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                              : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          }`}>
                            {txn.amount < 0 ? (
                              <ArrowDownCircle size={22} />
                            ) : (
                              <ArrowUpCircle size={22} />
                            )}
                          </div>

                          {/* Transaction Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-base font-semibold text-slate-800 dark:text-white truncate">
                                {txn.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <Tag size={14} />
                                <span className="font-medium">{txn.category}</span>
                              </div>
                              <span className="text-slate-400">•</span>
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{formatDate(txn.date || txn.createdAt)}</span>
                              </div>
                              {txn.note && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="truncate max-w-[150px]" title={txn.note}>
                                    {txn.note}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount and Delete Button */}
                        <div className="flex items-center gap-4 ml-4">
                          <div
                            className={`text-lg font-bold ${
                              txn.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {txn.amount < 0 ? "-" : "+"}₹{Math.abs(txn.amount).toLocaleString()}
                          </div>
                          <button
                            onClick={() => openDeleteModal(txn._id)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete transaction"
                          >
                            <MinusCircle size={22} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {loading && (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more transactions...</span>
                  </div>
                </div>
              )}
              {!hasMore && !loading && transactions.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-slate-400 dark:text-slate-500 text-sm italic">
                    No more transactions to load
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col gap-8">
            <div className="bg-gradient-to-b from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 h-fit">
              <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
                Summary:{" "}
                <span className="text-purple-600 dark:text-purple-400">
                  {filter || "All Categories"}
                </span>
              </h3>
              <ul className="space-y-4 text-slate-700 dark:text-slate-300">
                <li>
                  <span className="font-semibold">🧾 Total Transactions:</span>{" "}
                  {transactions.length}
                </li>
                <li>
                  <span className="font-semibold">💸 Total Spent:</span> ₹
                  {Math.abs(totalSpent)}
                </li>
                <li>
                  <span className="font-semibold">💰 Total Income:</span> ₹
                  {totalIncome}
                </li>
                <li>
                  <span className="font-semibold">🔴 Net Balance:</span> ₹{net}
                </li>
              </ul>
            </div>

            <TransactionReminders />
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
              Choose month & year
            </h3>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Month
              </label>
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  disabled={exporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition"
                >
                  {exporting ? "Preparing..." : "Export"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Transactions;
