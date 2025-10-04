import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { getProductImageUrl } from '../utils/imageUtils';
import OptimizedImage from '../components/OptimizedImage';
import { orderAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
  updatingOrderId?: string | null;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  updatingOrderId = null,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 overflow-y-auto h-full w-full z-50">
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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)} ${updatingOrderId === order._id ? 'opacity-75' : ''}`}>
                  {updatingOrderId === order._id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                  ) : (
                    getStatusIcon(order.orderStatus)
                  )}
                  <span className="ml-1">
                    {updatingOrderId === order._id ? 'UPDATING...' : order.orderStatus.replace('-', ' ').toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <OptimizedImage
                    src={getProductImageUrl(item.product)}
                    alt={item.product.name}
                    className="w-16 h-16 rounded"
                    width={64}
                    height={64}
                    quality={85}
                    loading="lazy"
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
                  <span className="text-sm font-medium text-gray-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Shipping Address</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
                <p className="text-sm text-gray-600">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Payment Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="text-sm font-medium capitalize">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <span className={`text-sm font-medium capitalize ${
                    order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tracking Number:</span>
                    <span className="text-sm font-medium">{order.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Dates */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Order Timeline</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Date:</span>
                  <span className="text-sm font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm font-medium">
                      {new Date(order.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const { data: ordersData, isLoading, error, refetch } = useQuery(
    ['orders', currentPage, selectedStatus],
    () => orderAPI.getUserOrders({ 
      page: currentPage, 
      limit: 10, 
      status: selectedStatus || undefined 
    }),
    { 
      staleTime: 30 * 1000, // Reduced to 30 seconds for fresher data
      keepPreviousData: true,
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchOnMount: true // Always refetch when component mounts
    }
  );

  // Force refresh data when page loads to ensure latest data
  useEffect(() => {
    // Always invalidate and refetch orders data when component mounts
    queryClient.invalidateQueries(['orders']);
    setLastUpdated(new Date());
  }, [queryClient]);

  // Sync local orders with fetched data
  useEffect(() => {
    if (ordersData?.orders) {
      setLocalOrders(ordersData.orders);
    }
  }, [ordersData]);

  // Check if we came from payment success and show success message
  useEffect(() => {
    const fromPaymentSuccess = location.state?.fromPaymentSuccess;
    if (fromPaymentSuccess) {
      toast.success('Order placed successfully! Refreshing your orders...');
    }
  }, [location.state]);

  // Socket listeners for real-time order updates
  useEffect(() => {
    if (socket && isConnected) {
      
      const handleNewOrder = (order: any) => {
        // Add new order to local state immediately
        setLocalOrders(prevOrders => [order, ...prevOrders]);
        
        // Invalidate orders cache to trigger refetch
        queryClient.invalidateQueries(['orders']);
        setLastUpdated(new Date());
        toast.success('New order received! Refreshing orders...');
      };

      const handleOrderStatusUpdate = (data: { orderId: string; status: string; order: any }) => {
        // Show updating indicator
        setUpdatingOrderId(data.orderId);
        
        // Update local state immediately
        setLocalOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.orderId 
              ? { ...order, orderStatus: data.status, updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Hide updating indicator after a short delay
        setTimeout(() => setUpdatingOrderId(null), 2000);
        
        // Invalidate orders cache to trigger refetch
        queryClient.invalidateQueries(['orders']);
        setLastUpdated(new Date());
        toast.success(`Order ${data.orderId.slice(-8).toUpperCase()} status updated to ${data.status}`);
      };

      const handleOrderCancelled = (data: { orderId: string; order: any }) => {
        // Update local state immediately
        setLocalOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.orderId 
              ? { ...order, orderStatus: 'cancelled', updatedAt: new Date().toISOString() }
              : order
          )
        );
        
        // Invalidate orders cache to trigger refetch
        queryClient.invalidateQueries(['orders']);
        setLastUpdated(new Date());
        toast.success(`Order ${data.orderId.slice(-8).toUpperCase()} was cancelled`);
      };

      // Listen for order events
      socket.on('newOrder', handleNewOrder);
      socket.on('orderStatusUpdated', handleOrderStatusUpdate);
      socket.on('orderCancelled', handleOrderCancelled);


      return () => {
        socket.off('newOrder', handleNewOrder);
        socket.off('orderStatusUpdated', handleOrderStatusUpdate);
        socket.off('orderCancelled', handleOrderCancelled);
      };
    } else {
    }
  }, [socket, isConnected, queryClient]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleManualRefresh = async () => {
    try {
      await refetch();
      setLastUpdated(new Date());
      toast.success('Orders refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh orders');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading orders</h2>
          <p className="text-gray-600 mb-4">There was a problem loading your orders</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const orders = localOrders.length > 0 ? localOrders : (ordersData?.orders || []);
  const pagination = ordersData?.pagination;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Profile
          </button>
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
            </div>
            {/* Controls */}
            <div className="flex items-center space-x-4">
              
              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {pagination?.totalOrders || 0} orders found
              {lastUpdated && (
                <span className="ml-2">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus 
                ? `No orders with status "${selectedStatus}"` 
                : "You haven't placed any orders yet"
              }
            </p>
            <button
              onClick={() => window.location.href = '/products'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.orderStatus)} ${updatingOrderId === order._id ? 'opacity-75' : ''}`}>
                        {updatingOrderId === order._id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        ) : (
                          getStatusIcon(order.orderStatus)
                        )}
                        <span className="capitalize">
                          {updatingOrderId === order._id ? 'Updating...' : order.orderStatus}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4">
                        <OptimizedImage
                          src={getProductImageUrl(item.product)}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg"
                          width={64}
                          height={64}
                          quality={85}
                          loading="lazy"
                          fallbackIcon={<Package className="h-8 w-8 text-gray-400" />}
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 line-clamp-2">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity} × {formatPrice(item.price)}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {item.product.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CreditCard className="h-4 w-4" />
                        <span className="capitalize">
                          {order.paymentMethod} • {order.paymentStatus}
                        </span>
                      </div>
                      {order.trackingNumber && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Truck className="h-4 w-4" />
                          <span>Tracking: {order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowOrderModal(false)}
          updatingOrderId={updatingOrderId}
        />
      )}
    </div>
  );
};

export default MyOrders;
