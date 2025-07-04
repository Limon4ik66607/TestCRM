import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  Users, UserPlus, TrendingUp, TrendingDown, Activity, 
  Calendar, Phone, Mail, Building2, Target, Award, 
  Clock, CheckCircle, AlertCircle, XCircle, DollarSign,
  Package, Truck, AlertTriangle
} from 'lucide-react';

const StatisticsPage = ({ token, clients = [] }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('clients');
  const [loading, setLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Триггер анимации при изменении периода
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [timeRange]);

  // Цвета для диаграмм
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6',
    gray: '#6B7280'
  };

  // Соответствие статусов из ClientList
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'новый':
        return COLORS.gray;
      case 'оформлен':
        return COLORS.primary;
      case 'в обработке':
        return COLORS.warning;
      case 'доставляется':
        return COLORS.purple;
      case 'доставлен':
        return COLORS.success;
      case 'отменен':
        return COLORS.danger;
      default:
        return COLORS.gray;
    }
  };

  // Обработка данных для статистики
  const processStatistics = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Фильтрация по временному диапазону
    let filteredClients = clients;
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredClients = clients.filter(client => 
        new Date(client.created_at || Date.now()) >= weekAgo
      );
    } else if (timeRange === 'month') {
      filteredClients = clients.filter(client => {
        const clientDate = new Date(client.created_at || Date.now());
        return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
      });
    } else if (timeRange === 'year') {
      filteredClients = clients.filter(client => {
        const clientDate = new Date(client.created_at || Date.now());
        return clientDate.getFullYear() === currentYear;
      });
    }

    // Основные метрики
    const totalClients = clients.length;
    const newClients = filteredClients.length;
    const activeClients = clients.filter(client => 
      client.status && client.status !== 'отменен' && client.status !== 'доставлен'
    ).length;
    const completedClients = clients.filter(client => client.status === 'доставлен').length;
    
    // Данные для графиков по месяцам
    const monthlyData = [];
    const monthsToShow = timeRange === 'year' ? 12 : 6;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthClients = clients.filter(client => {
        const clientDate = new Date(client.created_at || Date.now());
        return clientDate.getMonth() === date.getMonth() && clientDate.getFullYear() === date.getFullYear();
      });
      
      monthlyData.push({
        month: date.toLocaleDateString('ru-RU', { month: 'short', year: timeRange === 'year' ? '2-digit' : undefined }),
        clients: monthClients.length,
        active: monthClients.filter(c => c.status && c.status !== 'отменен' && c.status !== 'доставлен').length,
        completed: monthClients.filter(c => c.status === 'доставлен').length
      });
    }

    // Подсчет всех возможных статусов
    const statusCounts = {};
    const statusLabels = {
      'новый': 'Новые',
      'оформлен': 'Оформлены',
      'в обработке': 'В обработке',
      'доставляется': 'Доставляются',
      'доставлен': 'Доставлены',
      'отменен': 'Отменены'
    };

    // Инициализируем все статусы
    Object.keys(statusLabels).forEach(status => {
      statusCounts[status] = 0;
    });

    // Подсчитываем клиентов по статусам
    clients.forEach(client => {
      const status = client.status?.toLowerCase() || 'новый';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      } else {
        statusCounts['новый']++; // Клиенты без статуса считаются новыми
      }
    });

    // Формируем данные для pie chart
    const statusData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0) // Показываем только статусы с клиентами
      .map(([status, count]) => ({
        name: statusLabels[status],
        value: count,
        color: getStatusColor(status)
      }));

    // Активность по дням недели
    const weeklyActivity = [
      { day: 'Пн', count: 0 },
      { day: 'Вт', count: 0 },
      { day: 'Ср', count: 0 },
      { day: 'Чт', count: 0 },
      { day: 'Пт', count: 0 },
      { day: 'Сб', count: 0 },
      { day: 'Вс', count: 0 }
    ];

    filteredClients.forEach(client => {
      const dayIndex = new Date(client.created_at || Date.now()).getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      weeklyActivity[adjustedIndex].count++;
    });

    // Расчет роста
    const growth = monthlyData.length > 1 ? 
      Math.round(((monthlyData[monthlyData.length - 1].clients - monthlyData[monthlyData.length - 2].clients) / Math.max(monthlyData[monthlyData.length - 2].clients, 1)) * 100) : 0;

    return {
      totalClients,
      newClients,
      activeClients,
      completedClients,
      monthlyData,
      statusData,
      weeklyActivity,
      conversionRate: totalClients > 0 ? Math.round((completedClients / totalClients) * 100) : 0,
      growth
    };
  };

  const stats = processStatistics();

  // Карточки метрик с анимацией
  const MetricCard = ({ icon: Icon, title, value, change, changeType, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transform transition-all duration-300 hover:scale-105">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 transition-all duration-500">{value}</p>
            {change !== undefined && (
              <div className="flex items-center mt-2">
                {changeType === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-slate-500 text-sm ml-1">за период</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]} transition-all duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  // Кастомная анимация для графиков
  const AnimatedLineChart = ({ data, ...props }) => (
    <LineChart key={animationKey} data={data} {...props}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="month" stroke="#64748b" />
      <YAxis stroke="#64748b" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'white', 
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Line 
        type="monotone" 
        dataKey="clients" 
        stroke={COLORS.primary} 
        strokeWidth={3}
        dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
        animationDuration={1000}
        animationBegin={0}
      />
    </LineChart>
  );

  const AnimatedPieChart = ({ data, ...props }) => (
    <PieChart key={animationKey} {...props}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
        animationDuration={1000}
        animationBegin={0}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );

  const AnimatedBarChart = ({ data, ...props }) => (
    <BarChart key={animationKey} data={data} {...props}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
      <XAxis dataKey="day" stroke="#64748b" />
      <YAxis stroke="#64748b" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'white', 
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Bar 
        dataKey="count" 
        fill={COLORS.primary} 
        radius={[4, 4, 0, 0]}
        animationDuration={1000}
        animationBegin={0}
      />
    </BarChart>
  );

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'За неделю';
      case 'month': return 'За месяц';
      case 'year': return 'За год';
      default: return 'За месяц';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Статистика и аналитика</h1>
              <p className="text-slate-600">Анализ эффективности работы с клиентами • {getTimeRangeLabel()}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
              >
                <option value="week">За неделю</option>
                <option value="month">За месяц</option>
                <option value="year">За год</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Users}
            title="Всего клиентов"
            value={stats.totalClients}
            change={stats.growth}
            changeType={stats.growth >= 0 ? 'up' : 'down'}
            color="blue"
          />
          <MetricCard
            icon={UserPlus}
            title={`Новых ${getTimeRangeLabel().toLowerCase()}`}
            value={stats.newClients}
            color="green"
          />
          <MetricCard
            icon={Activity}
            title="Активных клиентов"
            value={stats.activeClients}
            color="yellow"
          />
          <MetricCard
            icon={CheckCircle}
            title="Конверсия"
            value={`${stats.conversionRate}%`}
            color="purple"
          />
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Динамика клиентов */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Динамика по месяцам</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Новые клиенты</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AnimatedLineChart data={stats.monthlyData} />
            </ResponsiveContainer>
          </div>

          {/* Распределение по статусам */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Распределение по статусам</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AnimatedPieChart data={stats.statusData} />
            </ResponsiveContainer>
          </div>
        </div>

        {/* Активность по дням недели */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Активность по дням недели {getTimeRangeLabel().toLowerCase()}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AnimatedBarChart data={stats.weeklyActivity} />
          </ResponsiveContainer>
        </div>

        {/* Детальная статистика */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ключевые показатели */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Ключевые показатели</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-slate-600">Конверсия</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{stats.conversionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-slate-600">Рост за период</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{stats.growth}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-purple-500 mr-2" />
                  <span className="text-sm text-slate-600">Активность</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {Math.round((stats.activeClients / Math.max(stats.totalClients, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Статусы клиентов */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Статусы клиентов</h3>
            <div className="space-y-3">
              {stats.statusData.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-sm text-slate-600">{status.name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{status.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Быстрые факты */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Быстрые факты</h3>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Лучший день</p>
                    <p className="text-xs text-blue-600">
                      {stats.weeklyActivity.reduce((max, day) => 
                        day.count > max.count ? day : max
                      ).day} ({stats.weeklyActivity.reduce((max, day) => 
                        day.count > max.count ? day : max
                      ).count} клиентов)
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Завершено</p>
                    <p className="text-xs text-green-600">{stats.completedClients} клиентов</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Всего статусов</p>
                    <p className="text-xs text-purple-600">{stats.statusData.length} активных</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;