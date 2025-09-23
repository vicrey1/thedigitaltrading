import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiDollarSign, FiTrendingUp, FiTrendingDown, 
  FiCreditCard, FiDownload, FiEye, FiActivity, FiTruck,
  FiBarChart2, FiPieChart, FiArrowUpRight, FiArrowDownRight,
  FiRefreshCw, FiCalendar, FiClock, FiBell, FiSettings,
  FiAlertCircle, FiCheckCircle, FiTarget, FiGlobe
} from 'react-icons/fi';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminStats, getRecentActivities } from '../../services/adminStatsAPI';

const AdminIndex = () => {
  const { isDarkMode } = useTheme();
  
  // Helper function to ensure numeric values
  const ensureNumber = useCallback((value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  }, []);

  // Helper function to sanitize chart data
  const sanitizeChartData = useCallback((data, numericFields) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      const sanitized = { ...item };
      numericFields.forEach(field => {
        sanitized[field] = ensureNumber(item[field], 0);
      });
      return sanitized;
    });
  }, [ensureNumber]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInvestments: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart data - will be populated from API
  const [revenueData, setRevenueData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [investmentDistribution, setInvestmentDistribution] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState([]);

  // Fetch data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminStats();
        
        // Update stats
        setStats({
          totalUsers: ensureNumber(data.totalUsers, 0),
          activeInvestments: ensureNumber(data.activeInvestments, 0),
          totalDeposits: ensureNumber(data.totalDeposits, 0),
          totalWithdrawals: ensureNumber(data.totalWithdrawals, 0),
          pendingWithdrawals: ensureNumber(data.pendingWithdrawals, 0),
          totalRevenue: ensureNumber(data.totalRevenue, 0),
          monthlyGrowth: ensureNumber(data.monthlyGrowth, 0),
          activeUsers: ensureNumber(data.activeUsers, 0)
        });
        
        // Update chart data with validation
        setRevenueData(sanitizeChartData(data.revenueData || [], ['revenue', 'investments']));
        setUserGrowthData(sanitizeChartData(data.userGrowthData || [], ['newUsers', 'totalUsers']));
        setInvestmentDistribution(sanitizeChartData(data.investmentDistribution || [], ['value']));
        setSystemMetrics(sanitizeChartData(data.systemMetrics || [], ['value', 'max']));
        
        // Fetch recent activities
        const activitiesData = await getRecentActivities(10);
        setRecentActivities(activitiesData || []);
        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        
        // Check if it's an authentication error
        if (err.response?.status === 401) {
          setError('Authentication required. Please log in to view admin dashboard.');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
        
        // Fallback to default values on error
        setStats({
          totalUsers: 0,
          activeInvestments: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          pendingWithdrawals: 0,
          totalRevenue: 0,
          monthlyGrowth: 0,
          activeUsers: 0
        });
        
        // Set safe fallback data for charts
        setRevenueData([]);
        setUserGrowthData([]);
        setInvestmentDistribution([]);
        setSystemMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [ensureNumber, sanitizeChartData]);

  // Refresh data function
  const refreshData = () => {
    const fetchData = async () => {
      try {
        const data = await getAdminStats();
        setStats({
          totalUsers: ensureNumber(data.totalUsers, 0),
          activeInvestments: ensureNumber(data.activeInvestments, 0),
          totalDeposits: ensureNumber(data.totalDeposits, 0),
          totalWithdrawals: ensureNumber(data.totalWithdrawals, 0),
          pendingWithdrawals: ensureNumber(data.pendingWithdrawals, 0),
          totalRevenue: ensureNumber(data.totalRevenue, 0),
          monthlyGrowth: ensureNumber(data.monthlyGrowth, 0),
          activeUsers: ensureNumber(data.activeUsers, 0)
        });
        
        // Sanitize chart data to prevent NaN values
        setRevenueData(sanitizeChartData(data.revenueData || [], ['revenue', 'investments']));
        setUserGrowthData(sanitizeChartData(data.userGrowthData || [], ['newUsers', 'totalUsers']));
        setInvestmentDistribution(sanitizeChartData(data.investmentDistribution || [], ['value']));
        setSystemMetrics(sanitizeChartData(data.systemMetrics || [], ['value', 'max']));
        
        // Refresh recent activities
        const activitiesData = await getRecentActivities(10);
        setRecentActivities(activitiesData || []);
      } catch (err) {
        console.error('Failed to refresh data:', err);
        setError('Failed to refresh data. Please try again.');
      }
    };
    fetchData();
  };

  const [recentActivities, setRecentActivities] = useState([]);

  const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <div className={`
      p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105
      ${isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-2">
            {typeof value === 'number' && value > 1000 
              ? `$${(value / 1000).toFixed(0)}K` 
              : typeof value === 'number' 
                ? value.toLocaleString()
                : value
            }
          </p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend === 'up' ? <FiArrowUpRight className="mr-1" /> : <FiArrowDownRight className="mr-1" />}
              {change}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, link }) => (
    <Link to={link} className="block group">
      <div className={`
        p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105
        ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }
        group-hover:border-orange-500
      `}>
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color} mr-4`}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'deposit': return <FiDollarSign className="text-green-500" size={16} />;
        case 'withdrawal': return <FiDownload className="text-red-500" size={16} />;
        case 'investment': return <FiTrendingUp className="text-blue-500" size={16} />;
        case 'signup': return <FiUsers className="text-purple-500" size={16} />;
        default: return <FiActivity className="text-gray-500" size={16} />;
      }
    };

    const getActivityText = (activity) => {
      switch (activity.type) {
        case 'deposit':
          return `${activity.user} deposited $${activity.amount.toLocaleString()}`;
        case 'withdrawal':
          return `${activity.user} withdrew $${activity.amount.toLocaleString()}`;
        case 'investment':
          return `${activity.user} invested $${activity.amount.toLocaleString()}`;
        case 'signup':
          return `${activity.user} signed up`;
        default:
          return `${activity.user} performed an action`;
      }
    };

    return (
      <div className={`
        flex items-center p-4 rounded-lg transition-colors
        ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
      `}>
        <div className="mr-3">
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{getActivityText(activity)}</p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {activity.time}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button className={`
            flex items-center px-4 py-2 rounded-lg transition-colors
            ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}
          `}>
            <FiCalendar className="mr-2" size={16} />
            Last 30 days
          </button>
          <button 
            onClick={refreshData}
            disabled={loading}
            className={`
              flex items-center px-4 py-2 rounded-lg transition-colors
              ${isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'}
              text-white disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`
          p-4 rounded-lg border-l-4 border-red-500 
          ${isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}
        `}>
          <div className="flex items-center">
            <FiAlertCircle className="mr-2" size={16} />
            <span className="font-medium">Error loading dashboard data</span>
          </div>
          <p className="mt-1 text-sm">{error}</p>
          <button 
            onClick={refreshData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={8.2}
          trend="up"
          icon={FiUsers}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Investments"
          value={stats.activeInvestments}
          change={12.5}
          trend="up"
          icon={FiTrendingUp}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={15.3}
          trend="up"
          icon={FiDollarSign}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatCard
          title="Pending Withdrawals"
          value={stats.pendingWithdrawals}
          change={-2.1}
          trend="down"
          icon={FiDownload}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends Chart */}
        <div className={`
          p-6 rounded-xl shadow-lg
          ${isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
          }
        `}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Revenue Trends</h3>
            <FiBarChart2 className="text-blue-500" size={20} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="month" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                  tickFormatter={(value) => (typeof value === 'number' && isFinite(value)) ? `$${(value / 1000).toFixed(0)}K` : '$0K'}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#F9FAFB' : '#111827'
                  }}
                  formatter={(value) => (typeof value === 'number' && isFinite(value)) ? [`$${value.toLocaleString()}`, 'Revenue'] : ['$0', 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  fill="url(#revenueGradient)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className={`
          p-6 rounded-xl shadow-lg
          ${isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
          }
        `}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">User Growth</h3>
            <FiTrendingUp className="text-green-500" size={20} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="month" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                  tickFormatter={(value) => (typeof value === 'number' && isFinite(value)) ? value.toString() : '0'}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#F9FAFB' : '#111827'
                  }}
                  formatter={(value, name) => (typeof value === 'number' && isFinite(value)) ? [value.toString(), name] : ['0', name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  name="New Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalUsers" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                  name="Total Users"
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Distribution Pie Chart */}
        <div className={`
          p-6 rounded-xl shadow-lg
          ${isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
          }
        `}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Investment Distribution</h3>
            <FiPieChart className="text-purple-500" size={20} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={investmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {investmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#F9FAFB' : '#111827'
                  }}
                  formatter={(value) => (typeof value === 'number' && isFinite(value)) ? [`${value}%`, 'Percentage'] : ['0%', 'Percentage']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Performance Bar Chart */}
        <div className={`
          p-6 rounded-xl shadow-lg
          ${isDarkMode 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
            : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
          }
        `}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">System Performance</h3>
            <FiActivity className="text-orange-500" size={20} />
          </div>
          <div className="h-64">
            {systemMetrics && systemMetrics.length > 0 && systemMetrics.every(item => 
              item && typeof item.value === 'number' && isFinite(item.value) && item.metric
            ) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={systemMetrics} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    fontSize={12}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="metric"
                    stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                      border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      color: isDarkMode ? '#F9FAFB' : '#111827'
                    }}
                    formatter={(value) => (typeof value === 'number' && isFinite(value)) ? [`${value}%`, 'Usage'] : ['0%', 'Usage']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FiActivity className="mx-auto mb-2" size={24} />
                  <p>No system metrics data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Manage Users"
            description="View and manage user accounts"
            icon={FiUsers}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            link="/admin/users"
          />
          <QuickActionCard
            title="Investment Plans"
            description="Create and manage investment plans"
            icon={FiBarChart2}
            color="bg-gradient-to-r from-green-500 to-green-600"
            link="/admin/plans"
          />
          <QuickActionCard
            title="Withdrawals"
            description="Process pending withdrawals"
            icon={FiDownload}
            color="bg-gradient-to-r from-orange-500 to-orange-600"
            link="/admin/withdrawals"
          />
          <QuickActionCard
            title="Car Management"
            description="Manage luxury car inventory"
            icon={FiTruck}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            link="/admin/cars"
          />
          <QuickActionCard
            title="User Mirror"
            description="Mirror user account view"
            icon={FiEye}
            color="bg-gradient-to-r from-indigo-500 to-indigo-600"
            link="/admin/mirror"
          />
          <QuickActionCard
            title="Cold Wallet"
            description="Manage cold wallet funds"
            icon={FiDollarSign}
            color="bg-gradient-to-r from-gray-500 to-gray-600"
            link="/admin/cold-wallet"
          />
        </div>
      </div>

      {/* Recent Activities */}
      <div className={`
        p-6 rounded-xl shadow-lg
        ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }
      `}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Activities</h3>
          <FiActivity className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
        </div>
        <div className="space-y-2">
          {recentActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
        <Link 
          to="/admin/activities" 
          className="block text-center mt-4 text-orange-500 hover:text-orange-600 font-medium"
        >
          View All Activities
        </Link>
      </div>

      {/* System Status */}
      <div className={`
        p-6 rounded-xl shadow-lg
        ${isDarkMode 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
        }
      `}>
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span>API Services: Online</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span>Database: Connected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
            <span>Email Service: Degraded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIndex;
