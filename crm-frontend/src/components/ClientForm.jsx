import { useState } from "react";
import { User, Phone, MessageCircle, Plus, CheckCircle, AlertCircle } from "lucide-react";

// Компонент уведомлений
const Notifications = ({ notifications, onRemoveNotification }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      default: return CheckCircle;
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
              <span className="sr-only">Закрыть</span>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

const ClientForm = ({ token, onClientAdded }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Состояние для уведомлений
  const [notifications, setNotifications] = useState([]);

  // Функция для добавления уведомления
  const addNotification = (message, type = 'success', details = null) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, details };
    
    setNotifications(prev => [...prev, notification]);
    
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  // Функция для удаления уведомления
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!name.trim()) {
      errors.name = 'Имя обязательно для заполнения';
    } else if (name.trim().length < 2) {
      errors.name = 'Имя должно содержать минимум 2 символа';
    }
    
    if (!phone.trim()) {
      errors.phone = 'Телефон обязателен для заполнения';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      errors.phone = 'Неверный формат телефона';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      addNotification('Пожалуйста, исправьте ошибки в форме', 'error');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, note }),
      });

      if (response.ok) {
        setName("");
        setPhone("");
        setNote("");
        setValidationErrors({});
        
        addNotification(
          'Клиент успешно добавлен!', 
          'success',
          'Информация сохранена в базе данных'
        );
        
        onClientAdded();
      } else {
        const data = await response.json();
        addNotification(
          'Не удалось добавить клиента',
          'error',
          data.detail || 'Произошла ошибка на сервере'
        );
      }
    } catch (error) {
      addNotification(
        'Ошибка при добавлении клиента',
        'error',
        'Проверьте подключение к серверу'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setName("");
    setPhone("");
    setNote("");
    setValidationErrors({});
    addNotification('Форма очищена', 'success');
  };

  return (
    <>
      {/* Компонент уведомлений */}
      <Notifications 
        notifications={notifications} 
        onRemoveNotification={removeNotification} 
      />

      <div className="max-w-4xl mx-auto">
        {/* Показ ошибок валидации */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Обнаружены ошибки в форме</p>
                <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                  {Object.values(validationErrors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Форма */}
        <div className="space-y-6">
          {/* Поля формы в сетке */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Поле имени */}
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-slate-700 mb-2">
                Имя клиента *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="client-name"
                  type="text"
                  placeholder="Введите имя клиента"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-500 ${
                    validationErrors.name ? 'border-red-300' : 'border-slate-300'
                  }`}
                  required
                />
              </div>
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Поле телефона */}
            <div>
              <label htmlFor="client-phone" className="block text-sm font-medium text-slate-700 mb-2">
                Номер телефона *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="client-phone"
                  type="tel"
                  placeholder="+380123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-500 ${
                    validationErrors.phone ? 'border-red-300' : 'border-slate-300'
                  }`}
                  required
                />
              </div>
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Поле заметки - полная ширина */}
          <div>
            <label htmlFor="client-note" className="block text-sm font-medium text-slate-700 mb-2">
              Заметка
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MessageCircle className="h-5 w-5 text-slate-400" />
              </div>
              <textarea
                id="client-note"
                rows="3"
                placeholder="Дополнительная информация о клиенте (необязательно)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-500 resize-none"
              />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Укажите особенности работы с клиентом, предпочтения или важные детали
            </p>
          </div>

          {/* Действия формы */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !name.trim() || !phone.trim()}
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Добавление...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить клиента
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={clearForm}
              disabled={isLoading}
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-6 py-3 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Очистить форму
            </button>
          </div>

          {/* Справочный текст */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-slate-900 mb-1">Информация о форме</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>• Поля "Имя" и "Телефон" обязательны для заполнения</p>
                  <p>• Заметка поможет сохранить важную информацию о клиенте</p>
                  <p>• После добавления клиент появится в общем списке</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientForm;