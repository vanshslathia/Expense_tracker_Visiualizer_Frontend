import API from "../api/api";

// Get all recurring rules
export const getRecurringRules = async (isActive = null) => {
  try {
    const params = {};
    if (isActive !== null) {
      params.isActive = isActive;
    }
    const res = await API.get("/recurring", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching recurring rules:", error);
    throw error;
  }
};

// Create a new recurring rule
export const createRecurringRule = async (data) => {
  try {
    const res = await API.post("/recurring/create", data);
    return res.data;
  } catch (error) {
    console.error("Error creating recurring rule:", error);
    throw error;
  }
};

// Update a recurring rule
export const updateRecurringRule = async (id, data) => {
  try {
    const res = await API.put(`/recurring/${id}`, data);
    return res.data;
  } catch (error) {
    console.error("Error updating recurring rule:", error);
    throw error;
  }
};

// Delete a recurring rule
export const deleteRecurringRule = async (id) => {
  try {
    const res = await API.delete(`/recurring/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting recurring rule:", error);
    throw error;
  }
};

// Toggle active status
export const toggleRecurringRuleStatus = async (id) => {
  try {
    const res = await API.patch(`/recurring/${id}/toggle`);
    return res.data;
  } catch (error) {
    console.error("Error toggling recurring rule status:", error);
    throw error;
  }
};
