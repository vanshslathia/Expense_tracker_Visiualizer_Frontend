import { Bell, Check, CheckCheck, Trash2, X, AlertCircle, Info, AlertTriangle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

const NotificationDropdown = ({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
}) => {
  const getIcon = (type) => {
    switch (type) {
      case "budget_alert":
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type, priority) => {
    if (priority === "critical" || type === "budget_alert") {
      return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    }
    if (priority === "high" || type === "warning") {
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    }
    return "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadNotifications.length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Close"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <>
            {unreadNotifications.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1">
                  NEW
                </div>
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    getIcon={getIcon}
                    getBgColor={getBgColor}
                  />
                ))}
              </div>
            )}

            {readNotifications.length > 0 && (
              <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-1">
                  EARLIER
                </div>
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                    getIcon={getIcon}
                    getBgColor={getBgColor}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete, getIcon, getBgColor }) => {
  const timeAgo = formatTimeAgo(notification.createdAt);
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div
      className={`p-3 mb-2 rounded-lg border transition ${
        !notification.isRead
          ? getBgColor(notification.type, notification.priority)
          : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            {notification.message}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-500">{timeAgo}</span>
            <div className="flex gap-1">
              {notification.actionUrl && (
                <button
                  onClick={handleNavigate}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="View details"
                >
                  <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </button>
              )}
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification._id)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </button>
              )}
              <button
                onClick={() => onDelete(notification._id)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
