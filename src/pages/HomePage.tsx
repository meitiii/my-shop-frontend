// src/pages/HomePage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  is_main: boolean;
}

interface Variant {
  price: number;
  discount_percent: number;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  images: ProductImage[];
  variants: Variant[];
  average_rating: number | string | null;
}

const fetchProducts = async (search: string, categoryId: number | null) => {
  const params: any = {};
  if (search) params.search = search;
  if (categoryId) params.category = categoryId;

  const response = await api.get('/products/', { params });
  return response.data.results || response.data;
};

const fetchCategories = async () => {
  const response = await api.get('/categories/');
  return response.data.results || response.data;
};

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: products, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory],
    queryFn: () => fetchProducts(searchTerm, selectedCategory),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Explore Products</h1>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg w-full md:w-80 focus:ring-2 focus:ring-blue-200 focus:outline-none bg-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === null ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            All Categories
          </button>
          {categories?.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {productsLoading ? (
          <div className="text-center py-12 text-xl text-gray-500">Loading products... ⏳</div>
        ) : productsError ? (
          <div className="text-center py-12 text-red-500">Failed to load products.</div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: Product) => {
              // پیدا کردن عکس اصلی (اگر پیدا نکرد، همون اولی رو میذاره)
              const coverImage = product.images?.find(img => img.is_main) || product.images?.[0];
              
              // محاسبه قیمت و تخفیف از روی اولین Variant
              const defaultVariant = product.variants?.[0];
              const originalPrice = defaultVariant ? defaultVariant.price : 0;
              const discountPercent = defaultVariant?.discount_percent || 0;
              const finalPrice = originalPrice - (originalPrice * (discountPercent / 100));

              return (
                <Link 
                  to={`/product/${product.id}`} 
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative">
                    {/* برچسب تخفیف روی عکس */}
                    {discountPercent > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                        {discountPercent}% OFF
                      </span>
                    )}
                    
                    {coverImage ? (
                      <img 
                        src={coverImage.image} 
                        alt={coverImage.alt_text || product.name} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    
                    <div className="p-4 relative z-10 bg-white">
                      <p className="text-xs text-gray-400 uppercase mb-1">{product.brand}</p>
                      <h3 className="font-bold text-gray-800 text-lg mb-2 truncate">{product.name}</h3>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex justify-between items-end bg-white">
                    <div className="flex flex-col">
                      {discountPercent > 0 ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">${originalPrice.toLocaleString()}</span>
                          <span className="font-bold text-red-600 text-lg">${finalPrice.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-900 text-lg">${finalPrice.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-center text-sm mb-1">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>{product.average_rating ? Number(product.average_rating).toFixed(1) : '0.0'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}