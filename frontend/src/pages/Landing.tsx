import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productAPI } from '../services/api';
import { getProductImageUrl } from '../utils/imageUtils';
import { 
  Star, 
  Shield, 
  Heart,
  ShoppingCart,
  User,
  ChevronDown,
  PlayCircle,
  Eye,
  ArrowRight,
  Zap,
  Award
} from 'lucide-react';

const Landing: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [_mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Fetch featured products for the landing page
  const { data: featuredProducts } = useQuery(
    'featured-products',
    () => productAPI.getProducts({ page: 1, limit: 12 }),
    { staleTime: 5 * 60 * 1000 }
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Mouse movement effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation trigger
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Carousel auto-play
  useEffect(() => {
    if (!isAutoPlaying || !featuredProducts?.products) return;
    
    const totalSlides = Math.ceil(featuredProducts.products.length / 3);
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredProducts?.products]);

  const nextSlide = () => {
    if (!featuredProducts?.products) return;
    const totalSlides = Math.ceil(featuredProducts.products.length / 3);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    if (!featuredProducts?.products) return;
    const totalSlides = Math.ceil(featuredProducts.products.length / 3);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Premium Quality",
      description: "Handpicked products that meet our highest standards of excellence and durability.",
      color: "from-blue-100 to-blue-200"
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: "Lightning Fast",
      description: "Same-day delivery and instant processing for all your orders.",
      color: "from-green-100 to-green-200"
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Customer First",
      description: "24/7 support and satisfaction guarantee on every purchase.",
      color: "from-red-100 to-red-200"
    },
    {
      icon: <Award className="h-8 w-8 text-purple-600" />,
      title: "Award Winning",
      description: "Recognized for excellence in customer service and product quality.",
      color: "from-purple-100 to-purple-200"
    }
  ];

  const stats = [
    { number: "10K+", label: "Happy Customers", icon: <User className="h-8 w-8 text-blue-600" /> },
    { number: "50K+", label: "Products Sold", icon: <ShoppingCart className="h-8 w-8 text-green-600" /> },
    { number: "99%", label: "Satisfaction Rate", icon: <Star className="h-8 w-8 text-yellow-600" /> },
    { number: "24/7", label: "Support Available", icon: <Shield className="h-8 w-8 text-purple-600" /> }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fashion Enthusiast",
      quote: "The quality and service exceeded my expectations. I've been a loyal customer for over 2 years!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Tech Professional",
      quote: "Fast delivery and amazing customer support. The products are exactly as described.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      rating: 5
    },
    {
      name: "Emily Davis",
      role: "Home Decor Lover",
      quote: "Beautiful products that transformed my living space. Highly recommend to everyone!",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
      rating: 5
    }
  ];

  // Get product image from database or fallback
  // const getProductImage = (product: any) => {
  //   // Use the actual product image from database if available
  //   if (product.imageUrl && product.imageUrl.trim() !== '') {
  //     return product.imageUrl;
  //   }
  //   // Fallback to a default placeholder if no image in database
  //   return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
  // };

  return (
    <div className="w-full bg-white">
      {/* Hero Section with Animated Products */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Animated Product Grid Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 gap-8 h-full">
            {[...Array(32)].map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '3s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating Product Cards */}
        <div className="absolute top-20 left-10 animate-float-slow">
          <div className="w-24 h-32 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 transform rotate-12 hover:scale-110 transition-transform duration-300">
            <div className="w-full h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-2"></div>
            <div className="h-2 bg-gray-200 rounded mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        
        <div className="absolute top-40 right-20 animate-float-slow-reverse">
          <div className="w-28 h-36 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 transform -rotate-12 hover:scale-110 transition-transform duration-300">
            <div className="w-full h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-2"></div>
            <div className="h-2 bg-gray-200 rounded mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        
        <div className="absolute bottom-20 left-1/4 animate-float">
          <div className="w-20 h-28 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 transform rotate-6 hover:scale-110 transition-transform duration-300">
            <div className="w-full h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mb-2"></div>
            <div className="h-2 bg-gray-200 rounded mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="inline-flex items-center px-6 py-3 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-8 border border-blue-200">
              <Star className="h-4 w-4 mr-2" />
              New Collection Available Now
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                Discover
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Extraordinary
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience the pinnacle of luxury with our curated collection of premium products, 
              designed for those who demand nothing but the extraordinary.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                to="/products"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Explore Collection
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <button className="group px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">
                <span className="flex items-center">
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Watch Story
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-10 w-10 text-gray-400" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">MERN Store</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just a store, we're a gateway to a world of unparalleled luxury and sophistication.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 ${
                  isVisible ? `animate-fade-in-up-delay-${index + 1}` : 'opacity-0'
                }`}
              >
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/5 to-blue-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex p-4 rounded-full bg-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <p className="text-5xl font-bold text-gray-900 mb-2 animate-counter" data-target={parseInt(stat.number.replace('+', ''))}>
                  {stat.number}
                </p>
                <p className="text-lg text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Products</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our handpicked selection of premium products from our collection
            </p>
          </div>
          
          {featuredProducts?.products && featuredProducts.products.length > 0 ? (
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: Math.ceil(featuredProducts.products.length / 3) }).map((_, slideIndex) => (
                    <div key={slideIndex} className="w-full flex-shrink-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProducts.products
                          .slice(slideIndex * 3, (slideIndex + 1) * 3)
                          .map((product, index) => (
                            <div
                              key={product._id}
                              className={`group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                                isVisible ? `animate-fade-in-up-delay-${(index % 3) + 1}` : 'opacity-0'
                              }`}
                            >
                              <div className="relative overflow-hidden h-64 bg-gray-100 flex items-center justify-center">
                                <img
                                  src={getProductImageUrl(product) || ''}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  style={{ 
                                    display: 'block',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                  }}
                                />
                                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                  <Link
                                    to="/products"
                                    className="bg-white text-blue-600 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center"
                                  >
                                    <Eye className="h-5 w-5 mr-2" /> Quick View
                                  </Link>
                                </div>
                                <div className="absolute top-4 right-4">
                                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-full capitalize">
                                    {product.category}
                                  </span>
                                </div>
                              </div>
                              <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                                <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                    ${product.price}
                                  </span>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-600 ml-1">4.9</span>
                                  </div>
                                </div>
                                <Link
                                  to="/products"
                                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center group"
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  View Product
                                </Link>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-600 hover:text-blue-600 p-3 rounded-full shadow-lg transition-all duration-300 z-10"
              >
                <ChevronDown className="h-6 w-6 rotate-90" />
              </button>
              
              <button
                onClick={nextSlide}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-600 hover:text-blue-600 p-3 rounded-full shadow-lg transition-all duration-300 z-10"
              >
                <ChevronDown className="h-6 w-6 -rotate-90" />
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: Math.ceil(featuredProducts.products.length / 3) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentSlide === index 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">Check back later for our amazing collection!</p>
            </div>
          )}

          {/* View All Products Button */}
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Customers</span> Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied customers who have experienced the MERN Store difference
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-12 shadow-xl">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-2xl text-gray-700 italic mb-8 leading-relaxed">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <div className="flex items-center justify-center">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{testimonials[currentTestimonial].name}</h3>
                    <p className="text-gray-600 text-sm">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12 shadow-inner border border-gray-100">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Stay in the <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">Loop</span>
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive offers, new arrivals, and style inspiration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-6 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;