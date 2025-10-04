import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeType, icon, color }) => {
  const changeColor = changeType === 'increase' ? 'text-green-600' : 
                     changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';
  
  const changeIcon = changeType === 'increase' ? <TrendingUp className="h-4 w-4" /> :
                    changeType === 'decrease' ? <TrendingDown className="h-4 w-4" /> : null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center mt-2">
            {changeIcon && (
              <div className={`flex items-center ${changeColor}`}>
                {changeIcon}
                <span className="ml-1 text-sm font-medium">
                  {Math.abs(change)}%
                </span>
              </div>
            )}
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface AnalyticsData {
  kpis: {
    revenue: { value: number; change: number; type: 'increase' | 'decrease' | 'neutral' };
    orders: { value: number; change: number; type: 'increase' | 'decrease' | 'neutral' };
    customers: { value: number; change: number; type: 'increase' | 'decrease' | 'neutral' };
    products: { value: number; change: number; type: 'increase' | 'decrease' | 'neutral' };
  };
  orderStatus: Array<{ name: string; value: number; color: string }>;
  recentOrders: Array<{ id: string; customer: string; amount: number; status: string; date: string }>;
  revenueData: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  categoryStats: Array<{ name: string; count: number; stock: number }>;
}

const AdminAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();

  // Fetch analytics data
  const fetchAnalytics = async (period: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getAnalytics(period);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when date range changes
  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  // Listen for analytics updates via socket
  useEffect(() => {
    if (socket && isConnected) {
      const handleAnalyticsUpdate = (data: { type: string; data: any }) => {
        
        // Show toast notification for the update
        switch (data.type) {
          case 'order_created':
            toast.success(`New order received! Revenue: $${data.data.total}`);
            break;
          case 'order_status_updated':
            toast.success(`Order ${data.data.orderId} status updated to ${data.data.status}`);
            break;
          case 'order_cancelled':
            toast.success(`Order ${data.data.orderId} was cancelled`);
            break;
          case 'product_created':
            toast.success(`New product added: ${data.data.productId}`);
            break;
          case 'product_updated':
            toast.success(`Product ${data.data.productId} was updated`);
            break;
          case 'product_deleted':
            toast.success(`Product ${data.data.productId} was deleted`);
            break;
          case 'user_registered':
            toast.success('New user registered!');
            break;
          default:
            toast.success('Analytics data updated');
        }
        
        // Refresh analytics data
        fetchAnalytics(dateRange);
      };

      socket.on('analytics:updated', handleAnalyticsUpdate);

      return () => {
        socket.off('analytics:updated', handleAnalyticsUpdate);
      };
    }
  }, [socket, isConnected, dateRange]);

  const handleRefresh = async () => {
    await fetchAnalytics(dateRange);
    toast.success('Analytics data refreshed');
  };

  const handleExport = () => {
    toast.success('Exporting analytics data...');
    // In real app, this would trigger actual export
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive business insights and performance metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              {/* Action Buttons */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-medium">Error loading analytics</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : analyticsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Revenue"
              value={`$${analyticsData.kpis.revenue.value.toLocaleString()}`}
              change={analyticsData.kpis.revenue.change}
              changeType={analyticsData.kpis.revenue.type}
              icon={<DollarSign className="h-6 w-6 text-white" />}
              color="bg-green-500"
            />
            <KPICard
              title="Total Orders"
              value={analyticsData.kpis.orders.value}
              change={analyticsData.kpis.orders.change}
              changeType={analyticsData.kpis.orders.type}
              icon={<ShoppingCart className="h-6 w-6 text-white" />}
              color="bg-blue-500"
            />
            <KPICard
              title="New Customers"
              value={analyticsData.kpis.customers.value}
              change={analyticsData.kpis.customers.change}
              changeType={analyticsData.kpis.customers.type}
              icon={<Users className="h-6 w-6 text-white" />}
              color="bg-purple-500"
            />
            <KPICard
              title="Active Products"
              value={analyticsData.kpis.products.value}
              change={analyticsData.kpis.products.change}
              changeType={analyticsData.kpis.products.type}
              icon={<Package className="h-6 w-6 text-white" />}
              color="bg-orange-500"
            />
          </div>
        ) : null}

        {/* Charts Row 1 */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Last 7 days</span>
                </div>
              </div>
              {analyticsData.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No revenue data available for this period
                </div>
              )}
            </div>

            {/* Top Products Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              {analyticsData.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Sales']} />
                    <Bar dataKey="sales" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No product sales data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts Row 2 */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Order Status Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                <PieChartIcon className="h-5 w-5 text-purple-600" />
              </div>
              {analyticsData.orderStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.orderStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.orderStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No order status data available
                </div>
              )}
            </div>

            {/* Category Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Product Categories</h3>
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              {analyticsData.categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Products']} />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No category data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Orders Table */}
        {analyticsData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Orders
              </button>
            </div>
            <div className="overflow-x-auto">
              {analyticsData.recentOrders.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{order.id}</td>
                        <td className="py-3 px-4 text-gray-600">{order.customer}</td>
                        <td className="py-3 px-4 text-gray-900 font-medium">${order.amount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  No recent orders available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
