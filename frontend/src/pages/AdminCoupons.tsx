import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { couponAPI } from '../services/api';
import { Coupon } from '../types';
import { Plus, Search, Edit, Trash2, Tag, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import CouponForm from '../components/CouponForm';

const AdminCoupons: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    coupon: Coupon | null;
  }>({ isOpen: false, coupon: null });
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    coupon: Coupon | null;
  }>({ isOpen: false, coupon: null });
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Listen for coupon usage updates
  useEffect(() => {
    if (!socket) return;

    const handleCouponUsed = (data: { couponId: string; usedCount: number; code: string }) => {
      
      // Update the specific coupon in the cache
      queryClient.setQueryData(['admin-coupons', currentPage, searchTerm], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          coupons: oldData.coupons.map((coupon: Coupon) => 
            coupon._id === data.couponId 
              ? { ...coupon, usedCount: data.usedCount }
              : coupon
          )
        };
      });

      // Also update individual coupon queries
      queryClient.setQueryData(['coupon', data.couponId], (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, usedCount: data.usedCount };
      });

      toast.success(`Coupon ${data.code} used! Usage count: ${data.usedCount}`);
    };

    socket.on('coupon:used', handleCouponUsed);

    return () => {
      socket.off('coupon:used', handleCouponUsed);
    };
  }, [socket, queryClient, currentPage, searchTerm]);

  const { data, isLoading, error } = useQuery(
    ['admin-coupons', currentPage, searchTerm],
    () =>
      couponAPI.getCoupons({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
      }),
    {
      keepPreviousData: true,
    }
  );

  const deleteCouponMutation = useMutation(couponAPI.deleteCoupon, {
    onSuccess: () => {
      toast.success('Coupon deleted successfully!');
      queryClient.invalidateQueries(['admin-coupons']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    },
  });

  // Socket listeners for real-time updates
  React.useEffect(() => {
    if (!socket) return;

    const handleCouponCreated = (_coupon: Coupon) => {
      toast.success('New coupon created!');
      queryClient.invalidateQueries(['admin-coupons']);
    };

    const handleCouponUpdated = (_coupon: Coupon) => {
      toast.success('Coupon updated!');
      queryClient.invalidateQueries(['admin-coupons']);
    };

    const handleCouponDeleted = (_couponId: string) => {
      toast.success('Coupon deleted!');
      queryClient.invalidateQueries(['admin-coupons']);
    };

    const handleCouponUsed = (_data: { couponId: string; usedCount: number }) => {
      queryClient.invalidateQueries(['admin-coupons']);
    };

    socket.on('coupon:created', handleCouponCreated);
    socket.on('coupon:updated', handleCouponUpdated);
    socket.on('coupon:deleted', handleCouponDeleted);
    socket.on('coupon:used', handleCouponUsed);

    return () => {
      socket.off('coupon:created', handleCouponCreated);
      socket.off('coupon:updated', handleCouponUpdated);
      socket.off('coupon:deleted', handleCouponDeleted);
      socket.off('coupon:used', handleCouponUsed);
    };
  }, [socket, queryClient]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = (coupon: Coupon) => {
    setDeleteModal({ isOpen: true, coupon });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditModal({ isOpen: true, coupon });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.coupon) {
      deleteCouponMutation.mutate(deleteModal.coupon._id);
      setDeleteModal({ isOpen: false, coupon: null });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const getStatusColor = (coupon: Coupon) => {
    if (!coupon.isActive) return 'bg-gray-100 text-gray-800';
    if (isExpired(coupon.expiryDate)) return 'bg-red-100 text-red-800';
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (coupon: Coupon) => {
    if (!coupon.isActive) return 'Inactive';
    if (isExpired(coupon.expiryDate)) return 'Expired';
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 'Limit Reached';
    return 'Active';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load coupons</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600">Manage discount coupons and promotional codes</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex space-x-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coupons by code or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Search
        </button>
      </form>

      {/* Coupons Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.coupons?.map((coupon: Coupon) => (
                <tr key={coupon._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        {coupon.code}
                      </div>
                      <div className="text-sm text-gray-500">{coupon.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}%` 
                        : `$${coupon.discountValue}`
                      }
                    </div>
                    {coupon.minimumOrderAmount && (
                      <div className="text-xs text-gray-500">
                        Min: ${coupon.minimumOrderAmount}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {coupon.usedCount}
                      {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(coupon.expiryDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon)}`}>
                      {getStatusText(coupon)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!data.pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!data.pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * 10 + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, data.pagination.totalCoupons)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{data.pagination.totalCoupons}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!data.pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!data.pagination.hasNext}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, coupon: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Coupon"
        message={`Are you sure you want to delete the coupon "${deleteModal.coupon?.code}"? This action cannot be undone.`}
        isLoading={deleteCouponMutation.isLoading}
      />

      {/* Create/Edit Coupon Modal */}
      <CouponForm
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        mode="create"
      />

      <CouponForm
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, coupon: null })}
        coupon={editModal.coupon}
        mode="edit"
      />
    </div>
  );
};

export default AdminCoupons;
