import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice } from '../utils/formatPrice';
import { getProductImageUrl } from '../utils/imageUtils';
import { Star, ShoppingCart, Heart } from 'lucide-react';

interface RelatedProductsProps {
  products: Product[];
  isLoading: boolean;
  category: string;
  userRole?: 'admin' | 'user';
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ products, isLoading, category, userRole = 'user' }) => {
  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
        <Link
          to={`/products?category=${encodeURIComponent(category)}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View More
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <Link to={userRole === 'admin' ? `/admin/products/${product._id}` : `/product/${product.name.toLowerCase().replace(/ /g, '-')}`}>
              <div className="aspect-w-16 aspect-h-12">
                <img
                  src={getProductImageUrl(product) || ''}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </div>
            </Link>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {product.category}
                </span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">4.5</span>
                </div>
              </div>
              
              <Link to={userRole === 'admin' ? `/admin/products/${product._id}` : `/product/${product.name.toLowerCase().replace(/ /g, '-')}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-gray-500">
                {product.stock > 0 ? (
                  <span className="text-green-600">In Stock ({product.stock} available)</span>
                ) : (
                  <span className="text-red-600">Out of Stock</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
