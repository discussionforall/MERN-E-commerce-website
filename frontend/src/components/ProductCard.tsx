import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types/index.js';
import { Package, Hash, Eye, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatPrice';
import { getProductImageUrl } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showActions = false,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      electronics: 'bg-blue-100 text-blue-800',
      clothing: 'bg-purple-100 text-purple-800',
      books: 'bg-green-100 text-green-800',
      home: 'bg-yellow-100 text-yellow-800',
      sports: 'bg-red-100 text-red-800',
      beauty: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      navigate('/login');
      return;
    }

    if (product.stock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(product._id, 1);
    } catch {
      // Error is already handled in the cart context
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200'>
      {(() => {
        const imageUrl = getProductImageUrl(product);
        
        return imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className={`w-full h-48 object-cover ${showActions ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            onClick={
              showActions ? () => navigate(`/admin/products/${product._id}`) : undefined
            }
          />
        ) : (
          <div
            className={`w-full h-48 bg-gray-200 flex items-center justify-center ${showActions ? 'cursor-pointer hover:bg-gray-300 transition-colors' : ''}`}
            onClick={
              showActions ? () => navigate(`/admin/products/${product._id}`) : undefined
            }
          >
            <Package className='h-16 w-16 text-gray-400' />
          </div>
        );
      })()}

      <div className='p-6'>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-lg font-semibold text-gray-900 truncate'>
            {product.name}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(product.category)}`}
          >
            {product.category}
          </span>
        </div>

        <p className='text-gray-600 text-sm mb-4 line-clamp-2'>
          {product.description}
        </p>

        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-1 text-primary-600'>
            <span className='text-lg font-bold'>
              {formatPrice(product.price)}
            </span>
          </div>
          <div className='flex items-center space-x-1 text-gray-500'>
            <Hash className='h-4 w-4' />
            <span className='text-sm'>Stock: {product.stock}</span>
          </div>
        </div>

        {/* Action Buttons - Only show for non-admin view */}
        {!showActions && (
          <div className='flex space-x-2'>
            <button
              onClick={() => navigate(`/product/${product?.name.toLowerCase().replace(/ /g, '-')}`)}
              className='flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors cursor-pointer'
            >
              <Eye className='h-4 w-4' />
              <span>View Details</span>
            </button>

            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              className='flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer'
            >
              <ShoppingCart className='h-4 w-4' />
              <span>{isAddingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </button>
          </div>
        )}

        {showActions && onEdit && onDelete && (
          <div className='flex space-x-2'>
            <button
              onClick={() => onEdit(product)}
              className='flex-1 bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition-colors cursor-pointer'
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className='flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer'
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
