import { useState, useEffect } from 'react';
import { Activity, User, UserPlus, UserMinus, Edit, Trash2, LogIn, LogOut, Calendar, Filter, Search, RefreshCw, Eye, Shield, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import ActivityLog from './ActivityLog';

const ActivityLog = ({ token, onError, onSuccess }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    todayActions: 0,
    uniqueUsers: 0,
    mostActiveUser: null
  });

  // Загрузка журнала активности
  const fetchActivityLog = async (page = 1, limit = 50) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedAction !== 'all' && { action: selectedAction }),
        ...(selectedUser !== 'all' && { user_id: selectedUser }),
        ...(dateRange !== 'all' && { date_range: dateRange })
      });

      const response = await fetch(`http://127.0.0.1:8000/admin/activity-log?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || data);
        setTotalPages(Math.ceil((data.total || data.length) / limit));
        
        // Обновляем статистику
        calculateStats(data.logs || data);
      } else {
        onError('Ошибка при загрузке журнала активности');
      }
    } catch (err) {
      onError('Не удалось загрузить журнал активности');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка списка пользователей для фильтра
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/admin/staff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке пользователей:', err);
    }
  };

  // Подсчет статистики
  const calculateStats = (logsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActions = logsData.filter(log => {
      const logDate = new Date(log.created_at);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;

    const uniqueUsers = new Set(logsData.map(log => log.user_id)).size;
    
    // Находим самого активного пользователя
    const userActions = {};
    logsData.forEach(log => {
      userActions[log.user_id] = (userActions[log.user_id] || 0) + 1;
    });
    
    const mostActiveUserId = Object.keys(userActions).reduce((a, b) => 
      userActions[a] > userActions[b] ? a : b, null
    );
    
    const mostActiveUser = users.find(user => user.id === parseInt(mostActiveUserId));

    setStats({
      totalActions: logsData.length,
      todayActions,
      uniqueUsers,
      mostActiveUser: mostActiveUser?.name || 'Неизвестно'
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchActivityLog(currentPage);
  }, [currentPage, searchTerm, selectedAction, selectedUser, dateRange]);

  // Получение иконки для действия
  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'login':
        return <LogIn className="w-4 h-4 text-purple-600" />;
      case 'logout':
        return <LogOut className="w-4 h-4 text-gray-600" />;
      case 'view':
        return <Eye className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Получение цвета для типа действия
  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'view':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Получение названия действия на русском
  const getActionName = (action) => {
    const actions = {
      create: 'Создание',
      update: 'Обновление',
      delete: 'Удаление',
      login: 'Вход',
      logout: 'Выход',
      view: 'Просмотр'
    };
    return actions[action] || action;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Получение имени пользователя
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Неизвестный пользователь';
  };

  // Сброс фильтров
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAction('all');
    setSelectedUser('all');
    setDateRange('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Журнал активности</h2>
          <p className="text-slate-600">Отслеживание действий пользователей системы</p>
        </div>
        <button
          onClick={() => fetchActivityLog(currentPage)}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-slate-600">Всего действий</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalActions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-slate-600">Сегодня</p>
              <p className="text-2xl font-bold text-slate-900">{stats.todayActions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <User className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-slate-600">Активных пользователей</p>
              <p className="text-2xl font-bold text-slate-900">{stats.uniqueUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-slate-600">Самый активный</p>
              <p className="text-lg font-bold text-slate-900 truncate">{stats.mostActiveUser}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Поиск */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Фильтр по действию */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все действия</option>
            <option value="create">Создание</option>
            <option value="update">Обновление</option>
            <option value="delete">Удаление</option>
            <option value="login">Вход</option>
            <option value="logout">Выход</option>
            <option value="view">Просмотр</option>
          </select>

          {/* Фильтр по пользователю */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все пользователи</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          {/* Фильтр по дате */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все время</option>
            <option value="today">Сегодня</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
          </select>

          {/* Кнопка сброса */}
          <button
            onClick={resetFilters}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* Журнал */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">Записи журнала</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Загрузка...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Записи не найдены</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Действие</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Пользователь</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Описание</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP адрес</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {getActionName(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-slate-700">
                            {getUserName(log.user_id).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          {getUserName(log.user_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </div>
                      {log.target_type && (
                        <div className="text-xs text-slate-500">
                          {log.target_type} ID: {log.target_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {log.ip_address || 'Неизвестно'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Назад
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Вперед
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Страница <span className="font-medium">{currentPage}</span> из{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  ←
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  →
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;