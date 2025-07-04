import { useState, useEffect } from 'react';
import { Users, Shield, CreditCard, Settings, UserPlus, Crown, Trash2, Edit, Mail, Lock, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const AdminPage = ({ token, onError, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [subscription, setSubscription] = useState({
    plan: 'basic',
    status: 'active',
    expiresAt: '2024-12-31',
    maxUsers: 10,
    currentUsers: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Форма добавления сотрудника
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: {
      canAddClients: true,
      canEditClients: true,
      canDeleteClients: false,
      canViewReports: true,
      canExportData: false
    }
  });

  // Загрузка сотрудников
  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:8000/admin/staff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      } else {
        onError('Ошибка при загрузке сотрудников');
      }
    } catch (err) {
      onError('Не удалось загрузить список сотрудников');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Добавление сотрудника
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(staffForm),
      });

      if (response.ok) {
        onSuccess('Сотрудник успешно добавлен');
        setShowAddStaffModal(false);
        setStaffForm({
          name: '',
          email: '',
          password: '',
          role: 'staff',
          permissions: {
            canAddClients: true,
            canEditClients: true,
            canDeleteClients: false,
            canViewReports: true,
            canExportData: false
          }
        });
        fetchStaff();
      } else {
        onError('Ошибка при добавлении сотрудника');
      }
    } catch (err) {
      onError('Не удалось добавить сотрудника');
    }
  };

  // Удаление сотрудника
  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/staff/${staffId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        onSuccess('Сотрудник удален');
        fetchStaff();
      } else {
        onError('Ошибка при удалении сотрудника');
      }
    } catch (err) {
      onError('Не удалось удалить сотрудника');
    }
  };

  // Изменение роли сотрудника
  const handleRoleChange = async (staffId, newRole) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/admin/staff/${staffId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        onSuccess('Роль сотрудника изменена');
        fetchStaff();
      } else {
        onError('Ошибка при изменении роли');
      }
    } catch (err) {
      onError('Не удалось изменить роль');
    }
  };

  // Компонент управления сотрудниками
  const StaffManagement = () => (
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Управление сотрудниками</h2>
          <p className="text-slate-600">Добавляйте сотрудников и управляйте их правами</p>
        </div>
        <button
          onClick={() => setShowAddStaffModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Добавить сотрудника
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-slate-600">Всего сотрудников</p>
              <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-slate-600">Администраторы</p>
              <p className="text-2xl font-bold text-slate-900">{staff.filter(s => s.role === 'admin').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-slate-600">Активные</p>
              <p className="text-2xl font-bold text-slate-900">{staff.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Список сотрудников */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">Список сотрудников</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Сотрудник</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Последний вход</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-700">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{member.name}</div>
                        <div className="text-sm text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-sm rounded-md border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="staff">Сотрудник</option>
                      <option value="admin">Администратор</option>
                      <option value="manager">Менеджер</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status === 'active' ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Никогда'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingStaff(member)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Компонент управления подпиской
  const SubscriptionManagement = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Управление подпиской</h2>
        <p className="text-slate-600">Информация о вашем тарифном плане</p>
      </div>

      {/* Текущая подписка */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-900">Текущий план</h3>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            subscription.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {subscription.status === 'active' ? 'Активен' : 'Неактивен'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Тарифный план</p>
            <p className="text-lg font-bold text-slate-900 capitalize">{subscription.plan}</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Пользователи</p>
            <p className="text-lg font-bold text-slate-900">{subscription.currentUsers}/{subscription.maxUsers}</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Действует до</p>
            <p className="text-lg font-bold text-slate-900">{subscription.expiresAt}</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Обновить план
          </button>
          <button className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            Просмотреть тарифы
          </button>
        </div>
      </div>

      {/* Доступные тарифы */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Базовый', price: '990', users: 5, features: ['Основные функции', 'Поддержка email', '1 ГБ хранилища'] },
          { name: 'Профессиональный', price: '2990', users: 25, features: ['Все функции Базового', 'Приоритетная поддержка', '10 ГБ хранилища', 'Интеграции'] },
          { name: 'Корпоративный', price: '9990', users: 100, features: ['Все функции Про', 'Персональный менеджер', '100 ГБ хранилища', 'API доступ'] }
        ].map((plan) => (
          <div key={plan.name} className={`bg-white rounded-lg border-2 p-6 ${
            subscription.plan === plan.name.toLowerCase() 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-slate-200'
          }`}>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-500">/мес</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">До {plan.users} пользователей</p>
            </div>
            
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              subscription.plan === plan.name.toLowerCase()
                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              {subscription.plan === plan.name.toLowerCase() ? 'Текущий план' : 'Выбрать план'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Модальное окно добавления сотрудника
  const AddStaffModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Добавить сотрудника</h3>
        
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Имя</label>
            <input
              type="text"
              value={staffForm.name}
              onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={staffForm.email}
              onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
            <input
              type="password"
              value={staffForm.password}
              onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Сотрудник</option>
              <option value="admin">Администратор</option>
              <option value="manager">Менеджер</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Администрирование</h1>
        <p className="text-slate-600">Управление сотрудниками, правами и подпиской</p>
      </div>

      {/* Вкладки */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Сотрудники
              </div>
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'subscription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Подписка
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Контент */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'subscription' && <SubscriptionManagement />}
      </div>

      {/* Модальные окна */}
      {showAddStaffModal && <AddStaffModal />}
    </div>
  );
};

export default AdminPage;