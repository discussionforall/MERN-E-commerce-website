import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { orderAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck, 
  Package,
  RefreshCw,
  Download
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { formatDate } from '../utils/formatDate';
import { getProductImageUrl, SimplifiedProduct } from '../utils/imageUtils';
import OptimizedImage from '../components/OptimizedImage';
import toast from 'react-hot-toast';

interface Order {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  items: Array<{
    product: SimplifiedProduct;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    addressType: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'on-hold' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  // Fetch orders
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', currentPage, statusFilter, searchTerm, sortBy, sortOrder],
    queryFn: () => orderAPI.getAllOrders({
      page: currentPage,
      limit: 10,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
      sortBy,
      sortOrder
    }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      orderAPI.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderAPI.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });

  const orders = localOrders.length > 0 ? localOrders : (ordersData?.orders || []);
  const totalPages = ordersData?.pagination?.totalPages || 1;

  // Update local orders when data changes
  useEffect(() => {
    if (ordersData?.orders) {
      setLocalOrders(ordersData.orders);
    }
  }, [ordersData]);

  // Socket event listeners
  useEffect(() => {
    
    if (socket && isConnected) {
      
      // Listen for new orders
      socket.on('newOrder', (order: Order) => {
        
        // Add new order to local state immediately
        setLocalOrders(prevOrders => [order, ...prevOrders]);
        
        // Force refetch the data
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        refetch();
        toast.success(`New order #${order._id.slice(-8).toUpperCase()} received!`);
      });

      // Listen for order status updates
      socket.on('orderStatusUpdated', (data: { orderId: string; status: string; order: Order }) => {
        
        // Show updating indicator
        setUpdatingOrderId(data.orderId);
        
        // Update local state immediately
        setLocalOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.orderId 
              ? { ...order, orderStatus: data.status as any, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Hide updating indicator after a short delay
        setTimeout(() => setUpdatingOrderId(null), 2000);
        
        // Force refetch the data
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        refetch();
        toast.success(`Order #${data.orderId.slice(-8).toUpperCase()} status updated to ${data.status}`);
      });

      // Listen for order cancellations
      socket.on('orderCancelled', (data: { orderId: string; order: Order }) => {
        
        // Update local state immediately
        setLocalOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.orderId 
              ? { ...order, orderStatus: 'cancelled' as any, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Force refetch the data
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        refetch();
        toast.success(`Order #${data.orderId.slice(-8).toUpperCase()} has been cancelled`);
      });

      return () => {
        socket.off('newOrder');
        socket.off('orderStatusUpdated');
        socket.off('orderCancelled');
      };
    }
  }, [socket, isConnected, queryClient]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'on-hold': return <Package className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const exportOrders = () => {
    // TODO: Implement CSV export
    toast.success('Export feature coming soon!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportOrders}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="on-hold">On Hold</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="total-desc">Highest Amount</option>
              <option value="total-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: Order) => (
                  <tr 
                    key={order._id} 
                    className={`hover:bg-gray-50 ${updatingOrderId === order._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        <span className="ml-1 capitalize">{order.orderStatus.replace('-', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            className="text-sm border-0 bg-transparent focus:ring-0 cursor-pointer"
                            disabled={order.orderStatus === 'cancelled' || order.orderStatus === 'delivered'}
                          >
                            <option value="pending">Pending</option>
                            <option value="on-hold">On Hold</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          onStatusUpdate={handleStatusUpdate}
          onCancelOrder={handleCancelOrder}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string) => void;
  onCancelOrder: (orderId: string) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onStatusUpdate,
  onCancelOrder,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Order #{order._id.slice(-8).toUpperCase()}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Order Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus.replace('-', ' ').toUpperCase()}
                </span>
                <select
                  value={order.orderStatus}
                  onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  disabled={order.orderStatus === 'cancelled' || order.orderStatus === 'delivered'}
                >
                  <option value="pending">Pending</option>
                  <option value="on-hold">On Hold</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <OptimizedImage
                    src={getProductImageUrl(item.product)}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                    fallbackIcon={<Package className="h-8 w-8 text-gray-400" />}
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{item.product.name}</h5>
                    <p className="text-sm text-gray-500">Category: {item.product.category}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Order Summary</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping:</span>
                  <span className="text-sm font-medium">{formatPrice(order.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="text-sm font-medium">{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Total:</span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name:</p>
                <p className="text-sm font-medium">{order.user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email:</p>
                <p className="text-sm font-medium">{order.user.email}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Shipping Address</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p className="text-sm">{order.shippingAddress.address}</p>
              <p className="text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-sm">{order.shippingAddress.country}</p>
              <p className="text-sm">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
              <button
                onClick={() => onCancelOrder(order._id)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
              >
                Cancel Order
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
