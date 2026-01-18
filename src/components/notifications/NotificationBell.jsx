import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { getUnreadNotificationCount, getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "../../api/api";
import { showSuccessToast, showWarningToast } from "../../utils/toast";
import NotificationDropdown from "./NotificationDropdown";

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const previousCount = unreadCount;
      const res = await getUnreadNotificationCount();
      const newCount = res.unreadCount || 0;
      setUnreadCount(newCount);

      // If new notifications arrived, check for critical budget alerts
      if (newCount > previousCount && previousCount > 0) {
        checkForCriticalAlerts();
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const checkForCriticalAlerts = async () => {
    try {
      // Fetch recent unread notifications
      const res = await getNotifications(true, "budget_alert");
      const criticalAlerts = (res.data || []).filter(
        (n) => n.priority === "critical" && !n.isRead
      );

      // Show toast for the most recent critical alert
      if (criticalAlerts.length > 0) {
        const latestAlert = criticalAlerts[0];
        showWarningToast(latestAlert.message || latestAlert.title);
      }
    } catch (error) {
      console.error("Error checking for critical alerts:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications(false);
      setNotifications(res.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showSuccessToast("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      // Update unread count if deleted notification was unread
      const deleted = notifications.find((n) => n._id === id);
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1A365D] transition"
        title="Notifications"
      >
        <Bell className="w-6 h-6 text-[#1A202C] dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
