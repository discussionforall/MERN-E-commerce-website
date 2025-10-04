import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import ProductCard from '../components/ProductCard';
import { Search, Filter, Package, ChevronDown, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Products: React.FC = () => {
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [availability, setAvailability] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-low' | 'price-high' | 'name' | 'popularity'>('newest');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ type: 'product' | 'category'; value: string }>>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize category from URL parameters
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const { data, isLoading, error, refetch } = useQuery(
    ['products', currentPage, selectedCategory, searchTerm, availability, sortBy, minPrice, maxPrice],
    () =>
      productAPI.getProducts({
        page: currentPage,
        limit: 12,
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        availability: availability !== 'all' ? availability : undefined,
        sortBy: sortBy,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (!socket) {
      return;
    }

    // Set up socket listeners for real-time updates
    const handleProductCreated = () => {
      toast.success('New product added!');
      refetch();
    };

    const handleProductUpdated = () => {
      toast.success('Product updated!');
      refetch();
    };

    const handleProductDeleted = () => {
      toast.success('Product deleted!');
      refetch();
    };

    const handleBulkImportCompleted = (data: {
      success: number;
      failed: number;
      total: number;
      message: string;
    }) => {
      // Refresh the products list to show newly imported products
      refetch();
      
      // Show notification to users about new products
      if (data.success > 0) {
        toast.success(`New products available! ${data.success} products have been added.`);
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
  }, [socket, refetch]);

  // Fetch categories from API - unified system
  const { data: categoriesData } = useQuery(
    ['categories'],
    () => categoryAPI.getCategories(),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  const categories = categoriesData?.categories || [];

  // Search suggestions
  const { data: suggestionsData } = useQuery(
    ['search-suggestions', searchTerm],
    () => productAPI.getSearchSuggestions(searchTerm),
    {
      enabled: searchTerm.length >= 2,
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  useEffect(() => {
    if (suggestionsData?.suggestions) {
      setSuggestions(suggestionsData.suggestions);
    }
  }, [suggestionsData]);

  // Real-time search as user types
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      refetch();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, refetch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryChange = (category: string) => {
    const newCategory = category === selectedCategory ? '' : category;
    setSelectedCategory(newCategory);
    setCurrentPage(1);
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    if (newCategory) {
      newSearchParams.set('category', newCategory);
    } else {
      newSearchParams.delete('category');
    }
    setSearchParams(newSearchParams);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length >= 2);
    setCurrentPage(1);
  };

  const handleSuggestionClick = (suggestion: { type: 'product' | 'category'; value: string }) => {
    setSearchTerm(suggestion.value);
    setShowSuggestions(false);
    setCurrentPage(1);
    
    if (suggestion.type === 'category') {
      setSelectedCategory(suggestion.value);
    }
  };

  const handleAvailabilityChange = (value: 'all' | 'in-stock' | 'out-of-stock') => {
    setAvailability(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name' | 'popularity') => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setAvailability('all');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };


  const getSortLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'newest': 'Newest First',
      'oldest': 'Oldest First',
      'price-low': 'Price: Low to High',
      'price-high': 'Price: High to Low',
      'name': 'Name: A to Z',
      'popularity': 'Most Popular'
    };
    return labels[value] || value;
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
      <div>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Products</h1>
        <p className='mt-2 text-sm sm:text-base text-gray-600'>Browse our collection of products</p>
      </div>

      {/* Search and Filters */}
      <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border'>
        <div className='space-y-4'>
          {/* Search Bar with Suggestions */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1 relative'>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  ref={searchInputRef}
                  type='text'
                  placeholder='Search products by name, description, or category...'
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(searchTerm.length >= 2)}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                />
              </div>
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto'
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className='w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2'
                    >
                      <span className={`text-xs px-2 py-1 rounded ${
                        suggestion.type === 'product' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {suggestion.type}
                      </span>
                      <span className='text-sm text-gray-900'>{suggestion.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className='relative'>
              <select
                value={sortBy}
                onChange={e => handleSortChange(e.target.value as any)}
                className='appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500'
              >
                <option value='newest'>Newest First</option>
                <option value='oldest'>Oldest First</option>
                <option value='price-low'>Price: Low to High</option>
                <option value='price-high'>Price: High to Low</option>
                <option value='name'>Name: A to Z</option>
                <option value='popularity'>Most Popular</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                <ChevronDown className='h-4 w-4 text-gray-400' />
              </div>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className='flex items-center justify-between'>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900'
            >
              <Filter className='h-4 w-4' />
              <span>Advanced Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {(searchTerm || selectedCategory || availability !== 'all' || minPrice || maxPrice) && (
              <button
                onClick={clearFilters}
                className='flex items-center space-x-1 text-sm text-red-600 hover:text-red-800'
              >
                <X className='h-4 w-4' />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className='border-t pt-4 space-y-4'>
              {/* Availability Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Availability
                </label>
                <div className='flex space-x-4'>
                  {[
                    { value: 'all', label: 'All Products' },
                    { value: 'in-stock', label: 'In Stock' },
                    { value: 'out-of-stock', label: 'Out of Stock' }
                  ].map(option => (
                    <label key={option.value} className='flex items-center'>
                      <input
                        type='radio'
                        name='availability'
                        value={option.value}
                        checked={availability === option.value}
                        onChange={e => handleAvailabilityChange(e.target.value as any)}
                        className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300'
                      />
                      <span className='ml-2 text-sm text-gray-700'>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Price Range
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs text-gray-500 mb-1'>Min Price</label>
                    <input
                      type='number'
                      placeholder='0'
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-gray-500 mb-1'>Max Price</label>
                    <input
                      type='number'
                      placeholder='1000'
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500'
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Filters */}
          <div>
            <div className='flex items-center space-x-2 mb-2'>
              <Package className='h-4 w-4 text-gray-500' />
              <span className='text-sm font-medium text-gray-700'>
                Categories:
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => handleCategoryChange('')}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedCategory === ''
                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category._id}
                  type='button'
                  onClick={() => handleCategoryChange(category.name)}
                  className={`px-3 py-1 text-sm rounded-full border capitalize transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-primary-100 text-primary-800 border-primary-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {data?.products && (
        <div className='flex items-center justify-between text-sm text-gray-600'>
          <div>
            Showing {data.pagination.totalProducts} product{data.pagination.totalProducts !== 1 ? 's' : ''}
            {(searchTerm || selectedCategory || availability !== 'all' || minPrice || maxPrice) && (
              <span className='ml-2'>
                (filtered by: 
                {searchTerm && <span className='ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs'>"{searchTerm}"</span>}
                {selectedCategory && <span className='ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs'>{selectedCategory}</span>}
                {availability !== 'all' && <span className='ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs'>{availability === 'in-stock' ? 'In Stock' : 'Out of Stock'}</span>}
                {(minPrice || maxPrice) && <span className='ml-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs'>Price Range</span>}
                )
              </span>
            )}
          </div>
          <div className='text-gray-500'>
            Sorted by: <span className='font-medium'>{getSortLabel(sortBy)}</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {data?.products.length === 0 ? (
        <div className='text-center py-12'>
          <Package className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>
            No products found
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            {searchTerm || selectedCategory
              ? 'Try adjusting your search or filter criteria.'
              : 'No products have been added yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {data?.products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className='bg-white rounded-2xl shadow-lg border border-gray-100 p-6'>
              {/* Mobile Pagination */}
              <div className='flex flex-1 justify-between sm:hidden'>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!data.pagination.hasPrev}
                  className='flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium'
                >
                  <ChevronDown className='h-4 w-4 rotate-90' />
                  Previous
                </button>
                <div className='flex items-center text-sm text-gray-500'>
                  Page {currentPage} of {data.pagination.totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data.pagination.hasNext}
                  className='flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium'
                >
                  Next
                  <ChevronDown className='h-4 w-4 -rotate-90' />
                </button>
              </div>
              
              {/* Desktop Pagination */}
              <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <span>Showing</span>
                  <span className='font-semibold text-gray-900'>
                    {(currentPage - 1) * 12 + 1}
                  </span>
                  <span>to</span>
                  <span className='font-semibold text-gray-900'>
                    {Math.min(currentPage * 12, data.pagination.totalProducts)}
                  </span>
                  <span>of</span>
                  <span className='font-semibold text-gray-900'>
                    {data.pagination.totalProducts}
                  </span>
                  <span>products</span>
                </div>
                
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!data.pagination.hasPrev}
                    className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium'
                  >
                    <ChevronDown className='h-4 w-4 rotate-90' />
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className='flex items-center gap-1'>
                    {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        data.pagination.totalPages - 4,
                        currentPage - 2
                      )) + i;
                      
                      if (pageNum > data.pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!data.pagination.hasNext}
                    className='flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium'
                  >
                    Next
                    <ChevronDown className='h-4 w-4 -rotate-90' />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
