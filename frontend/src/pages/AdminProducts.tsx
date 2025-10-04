import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Plus, Search, Package, Download, Upload, FileText, Edit, Trash2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types/index.js';
import { formatPrice } from '../utils/formatPrice';
import { getProductImageUrl } from '../utils/imageUtils';

const AdminProducts: React.FC = () => {
  const { socket } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['admin-products', currentPage, searchTerm],
    () =>
      productAPI.getProducts({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
      }),
    {
      keepPreviousData: true,
    }
  );

  const deleteProductMutation = useMutation(productAPI.deleteProduct, {
    onSuccess: () => {
      toast.success('Product deleted successfully!');
      queryClient.invalidateQueries(['admin-products']);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  useEffect(() => {
    if (!socket) {
      return;
    }


    // Set up socket listeners for real-time updates
    const handleProductCreated = (_product: any) => {
      toast.success('New product added!');
      queryClient.invalidateQueries(['admin-products']);
    };

    const handleProductUpdated = (_product: any) => {
      toast.success('Product updated!');
      queryClient.invalidateQueries(['admin-products']);
    };

    const handleProductDeleted = (_productId: string) => {
      toast.success('Product deleted!');
      queryClient.invalidateQueries(['admin-products']);
    };

    const handleBulkImportCompleted = (data: {
      success: number;
      failed: number;
      total: number;
      message: string;
    }) => {
      // Refresh the products list to show newly imported products
      queryClient.invalidateQueries(['admin-products']);
      
      // Show notification
      if (data.success > 0) {
        toast.success(`Bulk import completed! ${data.success} products imported successfully.`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} products failed to import. Check console for details.`);
      }
    };

    // Set up all listeners
    socket.on('product:created', handleProductCreated);
    socket.on('product:updated', handleProductUpdated);
    socket.on('product:deleted', handleProductDeleted);
    socket.on('products:bulk_imported', handleBulkImportCompleted);

    // Handle socket reconnection
    const handleReconnect = () => {
      // Re-setup listeners after reconnection
      socket.off('product:created', handleProductCreated);
      socket.off('product:updated', handleProductUpdated);
      socket.off('product:deleted', handleProductDeleted);
      socket.off('products:bulk_imported', handleBulkImportCompleted);

      socket.on('product:created', handleProductCreated);
      socket.on('product:updated', handleProductUpdated);
      socket.on('product:deleted', handleProductDeleted);
      socket.on('products:bulk_imported', handleBulkImportCompleted);
    };

    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('product:created', handleProductCreated);
      socket.off('product:updated', handleProductUpdated);
      socket.off('product:deleted', handleProductDeleted);
      socket.off('products:bulk_imported', handleBulkImportCompleted);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket, queryClient]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const blob = await productAPI.exportProductsToCSV();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Products exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export products');
    }
  };

  const handleImport = () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const result = await productAPI.importProductsFromCSV(file);
        
        // Show results
        toast.success(result.message);
        
        // Show detailed results if there are errors
        if (result.results.errors.length > 0) {
          toast.error(`${result.results.failed} products failed to import. Check console for details.`);
        }
        
        // Refresh the products list
        queryClient.invalidateQueries(['admin-products']);
      } catch (error: any) {
        console.error('Import error:', error);
        toast.error(error.response?.data?.message || 'Failed to import products');
      }
    };
    input.click();
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await productAPI.getCSVTemplate();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully!');
    } catch (error: any) {
      console.error('Template download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download template');
    }
  };

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/${product._id}/edit`);
  };

  const handleDelete = (product: Product) => {
    setDeleteModal({ isOpen: true, product });
  };

  const confirmDelete = () => {
    if (deleteModal.product) {
      deleteProductMutation.mutate(deleteModal.product._id);
      setDeleteModal({ isOpen: false, product: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, product: null });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-64'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <Package className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>
          Error loading products
        </h3>
        <p className='mt-1 text-sm text-gray-500'>Please try again later.</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Manage Products</h1>
          <p className='mt-2 text-sm sm:text-base text-gray-600'>Add, edit, and delete products</p>
        </div>
        <div className='flex flex-col sm:flex-row gap-3'>
          <button
            onClick={handleDownloadTemplate}
            className='flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 sm:px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium w-full sm:w-auto'
          >
            <FileText className='h-5 w-5' />
            <span>Template</span>
          </button>
          <button
            onClick={handleImport}
            className='flex items-center justify-center space-x-2 bg-green-600 text-white px-4 sm:px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium w-full sm:w-auto'
          >
            <Upload className='h-5 w-5' />
            <span>Import</span>
          </button>
          <button
            onClick={handleExport}
            className='flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 sm:px-6 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium w-full sm:w-auto'
          >
            <Download className='h-5 w-5' />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/admin/products/new')}
            className='flex items-center justify-center space-x-2 bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium w-full sm:w-auto'
          >
            <Plus className='h-5 w-5' />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border'>
        <form onSubmit={handleSearch} className='flex gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='text'
                placeholder='Search products...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
              />
            </div>
          </div>
          <button
            type='submit'
            className='px-6 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium'
          >
            Search
          </button>
        </form>
      </div>

      {/* Products Table */}
      {(!data?.products || data.products.length === 0) && currentPage === 1 && (
        <div className='text-center py-12'>
          <Package className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>
            No products found
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'No products have been added yet.'}
          </p>
          {!searchTerm && (
            <div className='mt-6'>
              <button
                onClick={() => navigate('/admin/products/new')}
                className='inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add your first product
              </button>
            </div>
          )}
        </div>
      )}

      {data?.products && data.products.length > 0 && (
        <>
          <div className='bg-white shadow overflow-hidden sm:rounded-md'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Image
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Product Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Price
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Stock
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Category
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {data?.products.map(product => (
                    <tr key={product._id} className='hover:bg-gray-50'>
                      {/* Product Image */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex-shrink-0 h-12 w-12'>
                          <img
                            className='h-12 w-12 rounded-lg object-cover'
                            src={getProductImageUrl(product) || '/placeholder-product.jpg'}
                            alt={product.name}
                          />
                        </div>
                      </td>
                      
                      {/* Product Name */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 max-w-xs truncate'>
                          {product.name}
                        </div>
                        <div className='text-sm text-gray-500 max-w-xs truncate'>
                          {product.description}
                        </div>
                      </td>
                      
                      {/* Price */}
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {formatPrice(product.price)}
                      </td>
                      
                      {/* Stock */}
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                        {product.stock || 0}
                      </td>
                      
                      {/* Category */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          {product.category}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        <div className='flex items-center space-x-2'>
                          <button
                            onClick={() => handleEdit(product)}
                            className='text-blue-600 hover:text-blue-900 p-1 rounded'
                            title='View/Edit Product'
                          >
                            <Edit className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/${product._id}/reviews`)}
                            className='text-green-600 hover:text-green-900 p-1 rounded'
                            title='Manage Reviews'
                          >
                            <MessageSquare className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className='text-red-600 hover:text-red-900 p-1 rounded'
                            title='Delete Product'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty page message */}
          {(!data?.products || data.products.length === 0) && currentPage > 1 && (
            <div className='text-center py-12 bg-white'>
              <Package className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                No products on this page
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                This page doesn't contain any products.
              </p>
              <button
                onClick={() => setCurrentPage(1)}
                className='mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
              >
                Go to first page
              </button>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6'>
              <div className='flex flex-1 justify-between sm:hidden'>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!data.pagination.hasPrev}
                  className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data.pagination.hasNext}
                  className='relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
              <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm text-gray-700'>
                    Showing{' '}
                    <span className='font-medium'>
                      {(currentPage - 1) * 20 + 1}
                    </span>{' '}
                    to{' '}
                    <span className='font-medium'>
                      {Math.min(
                        currentPage * 20,
                        data.pagination.totalProducts
                      )}
                    </span>{' '}
                    of{' '}
                    <span className='font-medium'>
                      {data.pagination.totalProducts}
                    </span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className='isolate inline-flex -space-x-px rounded-md shadow-sm'>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!data.pagination.hasPrev}
                      className='relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!data.pagination.hasNext}
                      className='relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title='Delete Product'
        message='Are you sure you want to delete this product? This action cannot be undone.'
        itemName={deleteModal.product?.name}
        isLoading={deleteProductMutation.isLoading}
      />
    </div>
  );
};

export default AdminProducts;
