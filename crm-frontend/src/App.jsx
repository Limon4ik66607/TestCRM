import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import ClientsPage from './components/ClientsPage';
import StatisticsPage from './components/StatisticsPage';
import AdminPage from './components/AdminPage';
import Notifications from './components/Notifications';
import { Users, BarChart3, LogOut, Building2, Bell, Settings, Shield, Crown } from 'lucide-react';

function App() {
  const [token, setToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('clients');
  const [clients, setClients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  // Загрузка клиентов при авторизации
  useEffect(() => {
    if (token) {
      fetchClients();
      fetchUserInfo();
    }
  }, [token]);

  // Получение информации о пользователе
  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/users/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserInfo(userData);
      } else {
        console.error('Ошибка при получении информации о пользователе:', response.status);
      }
    } catch (err) {
      console.error('Ошибка при получении информации о пользователе', err);
    }
  };

  // Загрузка списка клиентов
  const fetchClients = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/clients', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        console.error('Ошибка при получении клиентов:', response.status);
      }
    } catch (err) {
      console.error('Ошибка при получении клиентов', err);
    }
  };

  // Функции для работы с уведомлениями
  const addNotification = (type, message, details = null) => {
    const id = Date.now();
    const notification = { id, type, message, details };
    setNotifications(prev => [...prev, notification]);
    
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Проверка срока действия токена
  useEffect(() => {
    if (token && tokenExpiry) {
      const timeUntilExpiry = tokenExpiry - Date.now();
      if (timeUntilExpiry <= 0) {
        handleLogout();
        return;
      }
      
      // Автоматический выход за 5 минут до истечения
      const logoutTimer = setTimeout(() => {
        handleLogout();
        alert('Сессия истекла. Пожалуйста, войдите снова.');
      }, timeUntilExpiry - 5 * 60 * 1000);

      return () => clearTimeout(logoutTimer);
    }
  }, [token, tokenExpiry]);

  const handleLogin = (newToken, expiryTime, userData) => {
    const expiry = expiryTime || Date.now() + 24 * 60 * 60 * 1000; // 24 часа по умолчанию
    
    setToken(newToken);
    setTokenExpiry(expiry);
    setUserInfo(userData);
  };

  const handleLogout = () => {
    setToken(null);
    setTokenExpiry(null);
    setUserInfo(null);
    setCurrentPage('clients');
    setClients([]);
  };

  // Обновление списка клиентов
  const handleClientsUpdate = (updatedClients) => {
    if (updatedClients) {
      setClients(updatedClients);
    } else {
      fetchClients();
    }
  };

  // Проверка прав доступа
  const hasAdminAccess = () => {
    return userInfo && (userInfo.role === 'admin' || userInfo.role === 'owner');
  };

  // Обработчики для уведомлений
  const handleError = (message, details = null) => {
    addNotification('error', message, details);
  };

  const handleSuccess = (message, details = null) => {
    addNotification('success', message, details);
  };

  // Показываем загрузку пока проверяем сохраненный токен
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Навигационная панель
  const Navigation = () => (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">BusinessCRM</h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setCurrentPage('clients')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentPage === 'clients'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Клиенты</span>
            </button>
            <button
              onClick={() => setCurrentPage('statistics')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                currentPage === 'statistics'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Статистика</span>
            </button>
            {hasAdminAccess() && (
              <button
                onClick={() => setCurrentPage('admin')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Администрирование</span>
              </button>
            )}
          </div>

          {/* Right Side Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            <button className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-900">{userInfo?.name}</div>
                  <div className="flex items-center text-xs text-slate-500">
                    {userInfo?.role === 'admin' && <Crown className="w-3 h-3 text-yellow-500 mr-1" />}
                    {userInfo?.role === 'admin' ? 'Администратор' : 'Сотрудник'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Компонент уведомлений */}
      <Notifications 
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />

      {!token ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <>
          <Navigation />
          {currentPage === 'clients' && (
            <ClientsPage 
              token={token} 
              onLogout={handleLogout}
              onClientsUpdate={handleClientsUpdate}
              onError={handleError}
              onSuccess={handleSuccess}
            />
          )}
          {currentPage === 'statistics' && (
            <StatisticsPage 
              token={token} 
              clients={clients}
              onRefresh={handleClientsUpdate}
              onError={handleError}
              onSuccess={handleSuccess}
            />
          )}
          {currentPage === 'admin' && hasAdminAccess() && (
            <AdminPage 
              token={token}
              userInfo={userInfo}
              onError={handleError}
              onSuccess={handleSuccess}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;