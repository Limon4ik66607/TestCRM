import { useEffect, useState } from 'react';
import { Search, User, Phone, MessageCircle, Edit3, Trash2, Save, X, Users, AlertCircle, Tag, Package, Truck, CheckCircle, Clock, AlertTriangle, Filter } from 'lucide-react';
import ClientFilters from './ClientFilters';
import Notifications from './Notifications';

const ClientList = ({ token, refreshTrigger }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', note: '', status: 'новый' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Новые состояния для фильтров и уведомлений
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    hasNote: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Функции для уведомлений
  const addNotification = (message, type = 'info', details = null) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, details };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Функция применения фильтров
  const applyFilters = (clientsList) => {
    return clientsList.filter(client => {
      if (filters.status && client.status !== filters.status) {
        return false;
      }

      if (filters.dateFrom || filters.dateTo) {
        const clientDate = client.created_at ? new Date(client.created_at) : new Date();
        
        if (filters.dateFrom && clientDate < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && clientDate > new Date(filters.dateTo + 'T23:59:59')) {
          return false;
        }
      }

      if (filters.hasNote && !client.note) {
        return false;
      }

      return true;
    });
  };

  // Функция для получения стиля статуса
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'новый':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Clock,
          color: 'text-gray-600'
        };
      case 'оформлен':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: Package,
          color: 'text-blue-600'
        };
      case 'в обработке':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          color: 'text-yellow-600'
        };
      case 'доставляется':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: Truck,
          color: 'text-purple-600'
        };
      case 'доставлен':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: CheckCircle,
          color: 'text-green-600'
        };
      case 'отменен':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: X,
          color: 'text-red-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Tag,
          color: 'text-gray-600'
        };
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('http://127.0.0.1:8000/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        throw new Error('Ошибка при загрузке клиентов');
      }
    } catch (err) {
      console.error('Ошибка при получении клиентов', err);
      setError('Не удалось загрузить список клиентов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [refreshTrigger]);

  // Обновленная логика фильтрации
  const searchFilteredClients = clients.filter((client) =>
    (client.name + client.phone + (client.note || '') + (client.status || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredClients = applyFilters(searchFilteredClients);

  // Пагинация на отфильтрованных данных
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const deleteClient = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого клиента?")) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        fetchClients();
        addNotification('Клиент успешно удален', 'success');
      } else {
        throw new Error('Ошибка при удалении клиента');
      }
    } catch (err) {
      console.error('Ошибка при удалении клиента', err);
      addNotification('Не удалось удалить клиента', 'error', err.message);
    }
  };

  const startEdit = (client) => {
    setEditingClient(client.id);
    setEditForm({ 
      name: client.name, 
      phone: client.phone, 
      note: client.note || '', 
      status: client.status || 'новый' 
    });
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setEditForm({ name: '', phone: '', note: '', status: 'новый' });
  };

  const saveEdit = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/clients/${editingClient}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      
      if (response.ok) {
        cancelEdit();
        fetchClients();
        addNotification('Клиент успешно обновлен', 'success');
      } else {
        throw new Error('Ошибка при сохранении изменений');
      }
    } catch (err) {
      console.error('Ошибка при сохранении клиента', err);
      addNotification('Не удалось сохранить изменения', 'error', err.message);
    }
  };

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Проверяем есть ли фактически активные фильтры
  const hasActiveFilters = filters.status !== '' || 
                          filters.dateFrom !== '' || 
                          filters.dateTo !== '' || 
                          filters.hasNote !== false;

  return (
    <div className="space-y-6">
      {/* Компонент уведомлений */}
      <Notifications 
        notifications={notifications} 
        onRemoveNotification={removeNotification} 
      />

      {/* Кнопка показать/скрыть фильтры */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </button>
        
        {/* Показываем счетчик только если есть фильтры или поиск */}
        {(hasActiveFilters || searchTerm) && filteredClients.length !== clients.length && (
          <span className="text-sm text-slate-600">
            Показано {filteredClients.length} из {clients.length} клиентов
          </span>
        )}
      </div>

      {/* Компонент фильтров */}
      <ClientFilters
        onFiltersChange={setFilters}
        clients={clients}
        isVisible={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Поиск по имени, телефону, заметке или статусу..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Ошибка</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-600">Загрузка клиентов...</span>
        </div>
      ) : (
        /* Clients list */
        <div className="space-y-4">
          {/* Информация о текущей странице и общем количестве */}
          {filteredClients.length > itemsPerPage && (
            <div className="text-sm text-slate-600 text-center">
              Страница {currentPage} из {totalPages} 
              {currentClients.length > 0 && (
                <span> (клиенты {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredClients.length)} из {filteredClients.length})</span>
              )}
            </div>
          )}

          {currentClients.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {editingClient === client.id ? (
                /* Edit mode */
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Редактирование клиента</h3>
                    <p className="text-sm text-slate-600">Измените информацию о клиенте</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Edit form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Имя клиента
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Введите имя"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Телефон
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Введите телефон"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Статус заказа
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Tag className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                        >
                          <option value="новый">Новый</option>
                          <option value="оформлен">Оформлен</option>
                          <option value="в обработке">В обработке</option>
                          <option value="доставляется">Доставляется</option>
                          <option value="доставлен">Доставлен</option>
                          <option value="отменен">Отменен</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Заметка
                      </label>
                      <div className="relative">
                        <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none">
                          <MessageCircle className="h-4 w-4 text-slate-400" />
                        </div>
                        <textarea
                          value={editForm.note}
                          onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                          rows={3}
                          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          placeholder="Дополнительная информация о клиенте"
                        />
                      </div>
                    </div>

                    {/* Edit buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      {/* Client name */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Клиент</p>
                            <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        {client.status && (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(client.status).bg} ${getStatusStyle(client.status).text}`}>
                            {(() => {
                              const StatusIcon = getStatusStyle(client.status).icon;
                              return <StatusIcon className={`w-4 h-4 mr-2 ${getStatusStyle(client.status).color}`} />;
                            })()}
                            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                          </div>
                        )}
                      </div>

                      {/* Client phone */}
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">Телефон</p>
                          <p className="text-slate-900 font-medium">{client.phone}</p>
                        </div>
                      </div>

                      {/* Client note */}
                      {client.note && (
                        <div className="flex items-start">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                            <MessageCircle className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Заметка</p>
                            <p className="text-slate-700">{client.note}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(client)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteClient(client.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Назад
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-2 border rounded-lg transition-colors ${
                    currentPage === index + 1 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Вперед
              </button>
            </div>
          )}

          {/* Empty state */}
          {filteredClients.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm || hasActiveFilters
                  ? 'Клиенты не найдены' 
                  : 'Список клиентов пуст'
                }
              </h3>
              <p className="text-slate-600">
                {searchTerm || hasActiveFilters
                  ? 'Попробуйте изменить поисковый запрос или очистить фильтры' 
                  : 'Добавьте первого клиента, чтобы начать работу с системой'
                }
              </p>
              {(searchTerm || hasActiveFilters) && (
                <div className="flex justify-center space-x-3 mt-4">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Очистить поиск
                    </button>
                  )}
                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '', hasNote: false })}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientList;