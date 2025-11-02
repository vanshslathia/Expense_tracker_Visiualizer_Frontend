import { useState, useEffect } from "react";
import Dashboard from "../components/Dashboard";
import Chatbot from "../components/Chatbot";
import AiInsights from "../components/AiInsights";
import axios from "axios";

function Home() {
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState("");

  // 🔹 Fetch user ID (adjust based on how you store user)
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  const totalIncome = transactions
    .filter((txn) => txn.amount > 0)
    .reduce((acc, txn) => acc + txn.amount, 0);

  const totalExpense = transactions
    .filter((txn) => txn.amount < 0)
    .reduce((acc, txn) => acc + Math.abs(txn.amount), 0);

  // 🧠 Fetch AI insights when Home loads
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/ai/analyze/${userId}`
        );
        setInsights(data.insights);
      } catch (err) {
        console.error("Error fetching insights:", err);
      }
    };

    if (userId) fetchInsights();
  }, [userId]);

  return (
    <div className="relative p-4">
      <Dashboard totalIncome={totalIncome} totalExpense={totalExpense} />

      {/* 💡 Show AI Insights Card */}
      <AiInsights insights={insights} />

      {/* 🤖 Chatbot in bottom-right corner */}
      <Chatbot userId={userId} />
    </div>
  );
}

export default Home;
