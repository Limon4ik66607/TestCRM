import ClientForm from './ClientForm';
import ClientList from './ClientList';
import Notifications from './Notifications';
import { useState, useEffect } from 'react';
import { Users, LogOut, Plus, Building2, Bell, Settings, UserPlus, Download } from 'lucide-react';

const ClientsPage = ({ token, onLogout, onClientsUpdate }) => {
  const [refresh, setRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [clients, setClients] = useState([]);
  
  // Состояние для уведомлений
  const [notifications, setNotifications] = useState([]);

  // Статистика клиентов
  const [clientsStats, setClientsStats] = useState({
    total: 0,
    newThisMonth: 0,
    active: 0
  });

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

  // Загрузка клиентов
  const fetchClients = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        calculateStats(data);
        
        // Уведомляем родительский компонент об обновлении данных
        if (onClientsUpdate) {
          onClientsUpdate(data);
        }
      } else {
        addNotification('error', 'Ошибка при загрузке клиентов');
      }
    } catch (err) {
      console.error('Ошибка при получении клиентов', err);
      addNotification('error', 'Не удалось загрузить список клиентов', 'Проверьте подключение к серверу');
    }
  };

  // Загружаем клиентов при монтировании и обновлении
  useEffect(() => {
    fetchClients();
  }, [refresh]);

  // Экспорт в CSV
  const exportToCSV = (clientsToExport) => {
    try {
      const headers = ['Имя', 'Телефон', 'Статус', 'Заметка', 'Дата создания'];
      const csvContent = [
        headers.join(','),
        ...clientsToExport.map(client => [
          `"${client.name}"`,
          `"${client.phone}"`,
          `"${client.status || ''}"`,
          `"${client.note || ''}"`,
          `"${client.created_at || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification('success', `Экспортировано ${clientsToExport.length} клиентов`, 'Файл загружен на ваш компьютер');
    } catch (error) {
      addNotification('error', 'Ошибка при экспорте данных');
    }
  };

  // Подсчет статистики
  const calculateStats = (clientsData) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newThisMonth = clientsData.filter(client => 
      new Date(client.created_at || Date.now()) >= thisMonth
    ).length;
    
    const active = clientsData.filter(client => 
      client.status !== 'отменен'
    ).length;
    
    setClientsStats({
      total: clientsData.length,
      newThisMonth,
      active
    });
  };

  // Обработка добавления клиента
  const handleClientAdded = () => {
    setRefresh(!refresh);
    addNotification('success', 'Клиент успешно добавлен!', 'Информация сохранена в базе данных');
    setActiveTab('list'); // Переключаемся на список после добавления
  };

  // Функция обработки ошибок для передачи в дочерние компоненты  
  const handleError = (message, details = null) => {
    addNotification('error', message, details);
  };

  // Функция обработки успешных операций
  const handleSuccess = (message, details = null) => {
    addNotification('success', message, details);
  };

  // Функция для обработки изменений в списке клиентов
  const handleClientsChange = () => {
    setRefresh(!refresh);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Компонент уведомлений */}
      <Notifications 
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Управление клиентами</h1>
              <p className="text-slate-600">Добавляйте, редактируйте и управляйте вашими клиентами</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('add')}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                  activeTab === 'add' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Добавить клиента
              </button>
              <button
                onClick={() => exportToCSV(clients)}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                disabled={clients.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Экспорт CSV ({clients.length})
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Список клиентов ({clients.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить клиента
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Areas */}
        <div className="space-y-6">
          {/* Add Client Form */}
          {activeTab === 'add' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Новый клиент</h2>
                    <p className="text-sm text-slate-600">Заполните информацию о клиенте</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ClientForm 
                  token={token} 
                  onClientAdded={handleClientAdded}
                  onError={handleError}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          )}

          {/* Client List */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">База клиентов</h2>
                    <p className="text-sm text-slate-600">Всего клиентов: {clients.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Список клиентов */}
                <ClientList 
                  token={token} 
                  refreshTrigger={refresh}
                  clients={clients}
                  onError={handleError}
                  onSuccess={handleSuccess}
                  onRefresh={handleClientsChange}
                />
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Всего клиентов</p>
                  <p className="text-2xl font-bold text-slate-900">{clientsStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Новых за месяц</p>
                  <p className="text-2xl font-bold text-slate-900">{clientsStats.newThisMonth}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Активных</p>
                  <p className="text-2xl font-bold text-slate-900">{clientsStats.active}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;