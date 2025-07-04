import { useState, useEffect } from 'react';
import { Filter, Calendar, Tag, RotateCcw, MessageCircle } from 'lucide-react';

const ClientFilters = ({ onFiltersChange, clients, isVisible, onToggle }) => {
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    hasNote: false
  });

  // Получаем уникальные статусы из клиентов
  const statuses = [...new Set(clients.map(c => c.status).filter(Boolean))];

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters = { status: '', dateFrom: '', dateTo: '', hasNote: false };
    applyFilters(emptyFilters);
  };

  // Подсчитываем активные фильтры
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false
  ).length;

  if (!isVisible) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 mb-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-900 flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center disabled:opacity-50"
            disabled={activeFiltersCount === 0}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Сбросить
          </button>
          <button
            onClick={onToggle}
            className="text-sm text-slate-600 hover:text-slate-700"
          >
            Скрыть
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Фильтр по статусу */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Tag className="w-4 h-4 inline mr-1" />
            Статус
          </label>
          <select
            value={filters.status}
            onChange={(e) => applyFilters({...filters, status: e.target.value})}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Все статусы</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Фильтр по дате создания от */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Дата от
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => applyFilters({...filters, dateFrom: e.target.value})}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Фильтр по дате создания до */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Дата до
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => applyFilters({...filters, dateTo: e.target.value})}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Фильтр по наличию заметки */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <MessageCircle className="w-4 h-4 inline mr-1" />
            Заметки
          </label>
          <div className="flex items-center h-10">
            <input
              type="checkbox"
              id="hasNote"
              checked={filters.hasNote}
              onChange={(e) => applyFilters({...filters, hasNote: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="hasNote" className="ml-2 text-sm text-slate-700">
              Только с заметками
            </label>
          </div>
        </div>
      </div>

      {/* Показ результатов фильтрации */}
      {activeFiltersCount > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Применено фильтров: <span className="font-medium">{activeFiltersCount}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientFilters;