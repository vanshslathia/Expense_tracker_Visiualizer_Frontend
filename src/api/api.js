import axios from "axios";
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from "../utils/toast";
import { loaderControl } from "../utils/loaderControl"; // 👈 loader utility

// Use environment variable or detect localhost
const getBaseURL = () => {
  // Check if VITE_API_URL is set (for Vercel/production override)
  if (import.meta.env.VITE_API_URL) {
    // If VITE_API_URL already includes /api/v1, use it as-is
    // Otherwise, append /api/v1
    const baseUrl = import.meta.env.VITE_API_URL;
    return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
  }
  // Check if running on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return "http://localhost:5000/api/v1";
  }
  // Default to Render backend (https://expense-tracker-visiualizer-backend.onrender.com)
  return "https://expense-tracker-visiualizer-backend.onrender.com/api/v1";
};

const BASE_URL = getBaseURL();
console.log("🌐 API Base URL:", BASE_URL);

// Axios instance
const API = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor → add access token + loader start
API.interceptors.request.use((config) => {
  console.log("📡 [REQUEST]", config.method?.toUpperCase(), config.url, {
    params: config.params,
    data: config.data,
    skipLoader: config.skipLoader,
  });

  if (!config.skipLoader) {
    loaderControl.setLoading(true); // 👈 loader ON only if not skipped
  }

  const token = localStorage.getItem("token");
  if (
    token &&
    !config.url?.includes("/auth/login") &&
    !config.url?.includes("/auth/signup")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor → loader stop + handle expired access token
API.interceptors.response.use(
  (response) => {
    console.log("✅ [RESPONSE]", response.config.url, response.data);

    if (!response.config.skipLoader) {
      loaderControl.setLoading(false); // 👈 loader OFF only if not skipped
    }
    return response;
  },
  async (error) => {
    console.error("❌ [ERROR RESPONSE]", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (!error.config?.skipLoader) {
      loaderControl.setLoading(false); // 👈 loader OFF only if not skipped
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token available");

        console.log("♻️ Refreshing access token...");

        // Get new access token
        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("token", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (err) {
        logoutUser();
        showInfoToast("Session expired. Please login again.");
        return Promise.reject(err);
      }
    }

    // Global error handling
    const msg =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    showErrorToast(msg);

    return Promise.reject(error);
  }
);

//
// ✅ Backend check
//
export const checkBackend = async () => {
  console.log("🚀 Calling: checkBackend");
  try {
    // Remove /api/v1 from BASE_URL temporarily for root endpoint
    const baseUrl = BASE_URL.replace("/api/v1", "");
    const res = await axios.get(`${baseUrl}/api/v1`);
    console.log("✅ Backend API is running");
    return res.data;
  } catch (err) {
    console.error("❌ Backend error:", err.message);
    // Don't throw, just log - don't break the app if backend check fails
    return { message: "Backend check failed" };
  }
};

//
// ✅ Auth
//
export const loginUser = async (formData) => {
  console.log("🚀 Calling: loginUser", formData);
  try {
    const res = await API.post("/auth/login", formData);

    localStorage.setItem("token", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);

    showSuccessToast("Login Successful!");
    return res.data;
  } catch (error) {
    showErrorToast("Login Failed");
    throw error;
  }
};

export const logoutUser = () => {
  console.log("🚀 Logging out user...");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  showInfoToast("Logged out successfully.");
  window.location.href = "/login";
};

export const signupUser = async (formData) => {
  console.log("🚀 Calling: signupUser", formData);
  try {
    const res = await API.post("/auth/signup", formData);
    if (res.data && res.data.success) {
      showSuccessToast(res.data.msg || "Signup Successful! Please login.");
    } else {
      showSuccessToast("Signup Successful! Please login.");
    }
    return res.data;
  } catch (error) {
    // Extract error message from server response
    const errorMessage = error.response?.data?.msg || 
                        error.response?.data?.message || 
                        error.message || 
                        "Signup Failed. Please try again.";
    
    console.error("❌ Signup error:", error.response?.data || error);
    showErrorToast(errorMessage);
    throw error;
  }
};

//
// ✅ Transactions
//
export const getTransactions = async (
  page = 1,
  limit = 10,
  search = "",
  filter = ""
) => {
  console.log(
    `🚀 Calling: getTransactions | page=${page}, limit=${limit}, search="${search}", filter="${filter}"`
  );
  try {
    const res = await API.get("/transactions", {
      params: { page, limit, search, filter },
    });
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch transactions");
    throw error;
  }
};

export const createTransaction = async (data) => {
  console.log("🚀 Calling: createTransaction", data);
  try {
    const res = await API.post("/transactions/create", data);
    showSuccessToast("Transaction added successfully!");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add transaction");
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  console.log("🚀 Calling: deleteTransaction", id);
  try {
    const res = await API.delete(`/transactions/${id}`);
    showSuccessToast("Transaction deleted!");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to delete transaction");
    throw error;
  }
};

//
// ✅ Budgets
//
export const fetchBudgets = async () => {
  console.log("🚀 Calling: fetchBudgets");
  try {
    const res = await API.get("/budgets");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch budgets");
    throw error;
  }
};

export const addBudget = async (budgetData) => {
  console.log("🚀 Calling: addBudget", budgetData);
  try {
    const res = await API.post("/budgets", budgetData);
    showSuccessToast("Budget added successfully!");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add budget");
    throw error;
  }
};

//
// ✅ Debts
//
export const fetchDebts = async () => {
  console.log("🚀 Calling: fetchDebts");
  try {
    const res = await API.get("/debts");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch debts");
    throw error;
  }
};

export const addDebt = async (debtData) => {
  console.log("🚀 Calling: addDebt", debtData);
  try {
    const res = await API.post("/debts/create", debtData);
    showSuccessToast("Debt added successfully!");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add debt");
    throw error;
  }
};

export const deleteDebt = async (id) => {
  console.log("🚀 Calling: deleteDebt", id);
  try {
    const res = await API.delete(`/debts/${id}`);
    showSuccessToast("Debt deleted!");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to delete debt");
    throw error;
  }
};

//
// ✅ Budget Summary
//
export const fetchBudgetSummary = async () => {
  console.log("🚀 Calling: fetchBudgetSummary");
  try {
    const res = await API.get("/summary");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch budget summary");
    throw error;
  }
};

    //
    // ✅ Category Goals (skip loader)
    //
    export const fetchCategoryGoals = async () => {
      console.log("🚀 Calling: fetchCategoryGoals");
      try {
        const res = await API.get("/category-goals", { skipLoader: true });
        return res.data;
      } catch (error) {
        showErrorToast("Failed to fetch category goals");
        throw error;
      }
    };

    export const setCategoryGoals = async (categoryGoals) => {
      console.log("🚀 Calling: setCategoryGoals", categoryGoals);
      try {
        const res = await API.post(
          "/category-goals/set",
          { categoryGoals },
          { skipLoader: true }
        );
        showSuccessToast("Category goals updated!");
        return res.data;
      } catch (error) {
        showErrorToast("Failed to set category goals");
        throw error;
      }
    };

    export const fetchBudgetAlerts = async () => {
      console.log("🚀 Calling: fetchBudgetAlerts");
      try {
        const res = await API.get("/category-goals/alerts", { skipLoader: true });
        return res.data;
      } catch (error) {
        console.error("Failed to fetch budget alerts:", error);
        return { alerts: [], hasAlerts: false };
      }
    };

//
// ✅ Reminders (skip loader)
//
export const fetchReminders = async () => {
  console.log("🚀 Calling: fetchReminders");
  try {
    const res = await API.get("/reminders", { skipLoader: true });
    return res.data;
  } catch (error) {
    showErrorToast("Failed to fetch reminders");
    throw error;
  }
};

export const addReminder = async (data) => {
  console.log("🚀 Calling: addReminder", data);
  try {
    const res = await API.post("/reminders/create", data, { skipLoader: true });
    showSuccessToast("Reminder added successfully!");
    return res.data;
  } catch (error) {
    showErrorToast("Failed to add reminder");
    throw error;
  }
};

export const deleteReminder = async (id) => {
  console.log("🚀 Calling: deleteReminder", id);
  try {
    const res = await API.delete(`/reminders/${id}`, { skipLoader: true });
    showSuccessToast("Reminder deleted!");
    return res.data;
  } catch (error) {
    showErrorToast(
      error.response?.data?.msg ||
        error.response?.data?.message ||
        "Failed to delete reminder"
    );
    throw error;
  }
};

//
// ✅ AI Insights
//
export const getAIInsights = async (userId) => {
  console.log("🚀 Calling: getAIInsights", userId);
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const token = localStorage.getItem("token");
    // Check for VITE_API_URL, fallback to localhost, then production
    const apiUrl = import.meta.env.VITE_API_URL || 
                   (window.location.hostname === 'localhost' ? "http://localhost:5000" : "https://expensync-ex0w.onrender.com");
    
    console.log("📡 Calling AI endpoint:", `${apiUrl}/api/ai/analyze/${userId}`);
    
    const res = await axios.get(`${apiUrl}/api/ai/analyze/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  } catch (error) {
    console.error("AI insights error:", error);
    // Re-throw with more context
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data?.message || error.response.data?.msg || "Failed to get AI insights");
    } else if (error.request) {
      // Request made but no response
      throw new Error("Network error. Please check if the server is running.");
    } else {
      // Error setting up request
      throw error;
    }
  }
};

export default API;
