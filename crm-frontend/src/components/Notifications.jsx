import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Notifications = ({ notifications, onRemoveNotification }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      default: return Info;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map(notification => {
        const Icon = getIcon(notification.type);
        return (
          <div
            key={notification.id}
            className={`flex items-start p-4 rounded-lg shadow-lg border transform transition-all duration-300 ${getStyles(notification.type)}`}
          >
            <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{notification.message}</p>
              {notification.details && (
                <p className="text-xs mt-1 opacity-75">{notification.details}</p>
              )}
            </div>
            <button
              onClick={() => onRemoveNotification(notification.id)}
              className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Notifications;