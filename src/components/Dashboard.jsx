import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
    ArrowDownRight,
    ArrowUpRight,
    Wallet,
    Plus,
    Sparkles,
} from "lucide-react";
import AddTransaction from "./AddTransaction";
import ExpenseChart from "./ExpenseChart";
import BudgetGoalProgress from "./BudgetGoalProgress";
import DebtOverview from "./DebtOverview";
import NetWorthCard from "./NetWorthCard";
import AiSummary from "./AiSummary";
import BudgetAlerts from "./BudgetAlerts";
import Layout from "./Layout";
import FinancialHealthScore from "./financialHealth/FinancialHealthScore";

// Centralized API imports
import { getTransactions, fetchBudgetSummary, fetchCategoryGoals, fetchDebts } from "../api/api";

const Dashboard = () => {
    const [userId, setUserId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [budgetGoals, setBudgetGoals] = useState([]);
    const [debts, setDebts] = useState([]);
    
    const totalBalance = totalIncome - totalExpense;
    const budgetUsed = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    // Decode token and set userId
    const token = localStorage.getItem("token");
    useEffect(() => {
        if (token) {
            const decodedToken = jwtDecode(token);
            setUserId(decodedToken.userId);
        }
    }, [token]);

    // Fetch all required data
    useEffect(() => {
        if (!userId || !token) return;

        const fetchData = async () => {
            try {
                const [summary, txs, goals, debtsData] = await Promise.all([
                    fetchBudgetSummary(),
                    getTransactions(1, 10), // Get first 10 for dashboard
                    fetchCategoryGoals(),
                    fetchDebts()
                ]);

                // Set summary data
                setTotalIncome(summary.totalIncome || 0);
                setTotalExpense(summary.totalExpenses || 0);

                // Set transactions
                setTransactions(txs?.transactions || []);

                // Set budget goals
                setBudgetGoals(goals.categoryGoals || []);

                // Set debts
                setDebts(debtsData || []);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            }
        };

        fetchData();
    }, [userId, token]);

    // Calculate total spent per category
    const calculateSpentPerCategory = (transactions) => {
    if (!Array.isArray(transactions)) return {}; // safety check
    const spentPerCategory = {};
    transactions.forEach(tx => {
        if (spentPerCategory[tx.category]) {
            spentPerCategory[tx.category] += tx.amount;
        } else {
            spentPerCategory[tx.category] = tx.amount;
        }
    });
    return spentPerCategory;
};

    // Merge budget goals with spent data
    const budgetGoalsWithSpent = budgetGoals.map(goal => {
        const spent = calculateSpentPerCategory(transactions)[goal.category] || 0;
        return {
            ...goal,
            spent
        };
    });

    return (
        <Layout>
            <div className={`p-8 transition-all duration-500 ease-in-out relative ${showModal ? "blur-sm pointer-events-none" : ""} 
                bg-gradient-to-b from-slate-50 to-white dark:from-[#0c0f1c] dark:to-[#1a1d2e]
                text-slate-800 dark:text-white rounded-3xl shadow-xl sm:px-10`}>
                
                <h2 className="text-4xl font-extrabold mb-12 text-center md:text-left tracking-tight">
                    Your Financial Overview
                </h2>

                {/* Top Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[{
                        title: "Total Balance",
                        amount: totalBalance,
                        icon: <Wallet className="w-8 h-8 text-green-500" />,
                        textColor: totalBalance >= 0 ? "text-green-600" : "text-red-500",
                    }, {
                        title: "Total Income",
                        amount: totalIncome,
                        icon: <ArrowUpRight className="w-8 h-8 text-blue-600" />,
                        textColor: "text-blue-600",
                    }, {
                        title: "Total Expense",
                        amount: totalExpense,
                        icon: <ArrowDownRight className="w-8 h-8 text-red-500" />,
                        textColor: "text-red-500",
                    }].map(({ title, amount, icon, textColor }, idx) => (
                        <div key={idx} className="p-6 rounded-2xl bg-gradient-to-tr from-slate-100/60 to-slate-200/60 dark:from-[#0c0f1c] dark:to-[#1a1d2e] shadow-xl border border-slate-200 dark:border-slate-700 transform hover:scale-[1.05] transition-all duration-300 ease-in-out">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold">{title}</h3>
                                {icon}
                            </div>
                            <p className={`text-3xl font-bold ${textColor}`}>
                                ₹{amount !== undefined && amount !== null ? amount.toLocaleString() : "0"}
                            </p>
                        </div>
                    ))}
                    <NetWorthCard income={totalIncome} expense={totalExpense} />
                </div>

                {/* Financial Health Score */}
                {userId && (
                    <div className="mt-16">
                        <FinancialHealthScore />
                    </div>
                )}

                {/* Budget Alerts Section */}
                {userId && (
                    <div className="mt-16">
                        <BudgetAlerts userId={userId} />
                    </div>
                )}

                {/* AI Summary Section */}
                {userId && (
                    <div className="mt-16">
                        <AiSummary userId={userId} />
                    </div>
                )}

                {/* Budget Progress */}
                <div className="flex flex-col space-y-4 mt-16">
                    <h4 className="text-xl font-semibold">Monthly Budget Usage</h4>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div className="bg-blue-500 h-4 transition-all duration-700 ease-out" style={{ width: `${budgetUsed}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        ₹{totalExpense !== undefined && totalExpense !== null ? totalExpense.toLocaleString() : "0"} spent out of ₹{totalIncome !== undefined && totalIncome !== null ? totalIncome.toLocaleString() : "0"}
                    </p>
                </div>

                {/* Budget Goals & Expense Chart */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-4">
                        <h4 className="text-xl font-semibold">Budget Goals</h4>
                        <BudgetGoalProgress goals={budgetGoalsWithSpent} />
                    </div>
                    <div className="flex flex-col space-y-4">
                        <h4 className="text-xl font-semibold">Expense Chart</h4>
                        <ExpenseChart totalIncome={totalIncome} totalExpense={totalExpense} />
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="mt-16">
                    <h4 className="text-xl font-semibold mb-6">Recent Transactions</h4>
                    <ul className="space-y-4">
                        {transactions.slice(0, 3).map((tx, idx) => (
                            <li key={idx} className="flex justify-between items-center text-sm bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                                <span className="font-semibold">{tx.category}</span>
                                <span className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                                    ₹{tx.amount !== undefined && tx.amount !== null ? tx.amount.toLocaleString() : "0"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Savings */}
                <div className="mt-16">
                    <h4 className="text-xl font-semibold mb-4">Savings This Month</h4>
                    <p className="text-4xl font-extrabold text-green-600">
                        ₹{(totalIncome - totalExpense) !== undefined && (totalIncome - totalExpense) !== null ? (totalIncome - totalExpense).toLocaleString() : "0"}
                    </p>
                </div>

                {/* Debt Overview */}
                <DebtOverview debts={debts} />
            </div>

            {/* Floating Add Transaction Button */}
            <button 
                onClick={() => setShowModal(true)} 
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-300 z-[55] flex items-center gap-1.5 sm:gap-2 group"
                title="Add Transaction"
            >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                <span className="font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap hidden sm:inline">Add Transaction</span>
                <span className="font-semibold text-xs sm:hidden">Add</span>
            </button>

            {/* Modal for Add Transaction */}
            {showModal && userId && (
                <div className="fixed inset-0 z-40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <AddTransaction userId={userId} onSuccess={() => setShowModal(false)} />
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;
