// src/components/admin/AdminComponents.js
import React from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

// small helper to render icon components consistently
const renderIcon = (Icon, props = {}) => {
  if (!Icon || typeof Icon !== 'function') return null;
  return <Icon {...props} />;
};

// Modern Card Component
export const AdminCard = ({ children, className = '', hover = true }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`p-4 sm:p-6 rounded-xl shadow transition-all duration-300 ${
        hover ? 'sm:hover:shadow-xl sm:hover:scale-105' : ''
      } ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'} ${className}`}
    >
      {children}
    </div>
  );
};

// Modern Button Component
export const AdminButton = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    outline: isDarkMode ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const iconElement = typeof Icon === 'function' ? renderIcon(Icon, { className: children ? 'mr-2' : '', size: 16 }) : null;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center rounded-lg font-medium transition-all duration-200 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {iconElement}
      {children}
    </button>
  );
};

// Modern Input Component
export const AdminInput = ({ label, error, icon: Icon, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      )}

      <div className="relative">
        {typeof Icon === 'function' && renderIcon(Icon, { className: `absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`, size: 16 })}
        <input
          className={`w-full rounded-lg border transition-colors duration-200 ${Icon ? 'pl-10 pr-4' : 'px-4'} py-3 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-orange-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500'} focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 ${error ? 'border-red-500' : ''}`}
          {...props}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Modern Select Component
export const AdminSelect = ({ label, options = [], error, className = '', ...props }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      )}
      <select className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 focus:border-orange-500' : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'} focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 ${error ? 'border-red-500' : ''}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Modern Table Component
export const AdminTable = ({ columns = [], data = [], actions = [], loading = false, className = '' }) => {
  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <AdminCard className={className}>
        <div className="animate-pulse">
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`} />
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`} />
          <div className={`h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`} />
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard className={className} hover={false}>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {columns.map((column) => {
                const colKey = column.key || column.field || String(column.title || column.label || Math.random());
                const colTitle = column.title || column.label || column.field || column.key || '';
                return (
                  <th key={colKey} className={`text-left py-4 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {colTitle}
                  </th>
                );
              })}

              {actions.length > 0 && (
                <th className={`text-left py-4 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => {
              const rowKey = row._id || row.id || index;
              return (
                <tr key={rowKey} className={`border-b transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                  {columns.map((column) => {
                    const colKey = column.key || column.field || String(column.title || column.label || Math.random());
                    let value;
                    if (column.render) {
                      value = column.render(row, column);
                    } else {
                      value = row[column.key || column.field];
                    }
                    return (
                      <td key={`${rowKey}-${colKey}`} className="py-4 px-4 align-top">
                        {value}
                      </td>
                    );
                  })}

                  {actions.length > 0 && (
                    <td className="py-4 px-4 align-top">
                      <div className="flex space-x-2">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={`p-2 rounded-lg transition-colors ${action.variant === 'danger' ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            title={action.title}
                          >
                            {renderIcon(action.icon, { size: 16 })}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {data.length === 0 && <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available</div>}
      </div>

      {/* Stacked card view for small screens */}
      <div className="sm:hidden space-y-3">
        {data.map((row, idx) => (
          <div key={row._id || row.id || `row-${idx}`} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-start justify-between space-x-3">
              <div className="flex-1 min-w-0">
                {columns.map((col) => {
                  const colKey = col.key || col.field || String(col.title || col.label || Math.random());
                  return (
                    <div key={`${row._id || row.id || idx}-${colKey}`} className="mb-2">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {col.title || col.label || col.field || ''}
                      </div>
                      <div className={`mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {col.render ? col.render(row, col) : row[col.key || col.field] || ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              {actions.length > 0 && (
                <div className="flex-shrink-0 flex flex-col space-y-2">
                  {actions.map((action, actionIndex) => (
                    <button key={actionIndex} onClick={() => action.onClick(row)} className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`} title={action.title}>
                      {renderIcon(action.icon, { size: 16 })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {data.length === 0 && <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available</div>}
      </div>
    </AdminCard>
  );
};

// Search and Filter Bar
export const AdminSearchBar = ({ onSearch, onFilter, onExport, onAdd, placeholder = 'Search...', showFilter = true, showExport = true, showAdd = true, className = '' }) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      <div className="flex-1 max-w-md">
        <AdminInput icon={FiSearch} placeholder={placeholder} onChange={(e) => onSearch && onSearch(e.target.value)} />
      </div>

      <div className="flex items-center space-x-3">
        {showFilter && (
          <AdminButton variant="outline" icon={FiFilter} onClick={onFilter}>
            Filter
          </AdminButton>
        )}

        {showExport && (
          <AdminButton variant="secondary" icon={FiDownload} onClick={onExport}>
            Export
          </AdminButton>
        )}

        {showAdd && (
          <AdminButton variant="primary" icon={FiPlus} onClick={onAdd}>
            Add New
          </AdminButton>
        )}
      </div>
    </div>
  );
};

// Status Badge Component
export const StatusBadge = ({ status, variant }) => {
  const variants = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}>{status}</span>
  );
};

// Modal Component
export const AdminModal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  const { isDarkMode } = useTheme();

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-7xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-6 pb-12 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={onClose} />

        <div className={`inline-block w-full ${sizes[size]} p-6 sm:p-8 my-6 sm:my-8 max-h-[90vh] overflow-auto text-left align-middle transition-all transform ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl rounded-2xl ${className}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold">{title}</h3>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-lg transition-colors text-2xl leading-none ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
            >
              ×
            </button>
          </div>

          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner
export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return <div className={`animate-spin rounded-full border-2 border-orange-200 border-t-orange-500 ${sizes[size]}`} />;
};

// Common table actions
export const tableActions = {
  view: { icon: FiEye, title: 'View', variant: 'default' },
  edit: { icon: FiEdit, title: 'Edit', variant: 'default' },
  delete: { icon: FiTrash2, title: 'Delete', variant: 'danger' }
};

export default AdminCard;