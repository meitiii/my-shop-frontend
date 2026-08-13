// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  is_main: boolean;
}
interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  parent: number | null;
  subcategories: Category[];
}

interface Variant {
  price: number;
  discount_percent: number;
}
interface Product {
  id: number;
  name: string;
  brand: number | null;
  brand_name?: string | null;
  images: ProductImage[];
  variants: Variant[];
  average_rating: number | string | null;
  category: Category | null;
  category_name?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// اضافه شدن پارامتر ordering به تابع دریافت محصولات
const fetchProducts = async (search: string, categoryId: number | null, selectedBrands: number[], ordering: string) => {
  const params: any = {};
  if (search) params.search = search;
  if (categoryId) params.category = categoryId;
  if (selectedBrands.length > 0) {
    params.brand = selectedBrands.join(',');
  }
  if (ordering) params.ordering = ordering; // 👈 ارسال نحوه مرتب‌سازی به بک‌اند

  const response = await api.get('/products/', { params });
  return response.data.results || response.data;
};

export default function HomePage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchInput, 500); 
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  
  // 👈 استیت جدید برای مرتب‌سازی (پیش‌فرض: جدیدترین)
  const [ordering, setOrdering] = useState('-created_at');
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // دریافت دسته‌بندی‌ها
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories/'); // آدرس‌ها رو بر اساس بک‌اندت چک کن
      return response.data.results || response.data;
    },
  });

  // دریافت برندها
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands/');
      return response.data.results || response.data;
    },
  });

  // دریافت محصولات + ارسال پارامتر ordering
  const { data: products, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ['products', debouncedSearchTerm, selectedCategory, selectedBrands, ordering],
    queryFn: () => fetchProducts(debouncedSearchTerm, selectedCategory, selectedBrands, ordering),
  });

  const toggleBrand = (brandId: number) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
    );
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCategory(null);
    setSelectedBrands([]);
    setOrdering('-created_at'); // ریست کردن مرتب‌سازی
  };

  const FiltersSidebar = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <SlidersHorizontal size={18}/> Filters
        </h2>
        {(selectedCategory || selectedBrands.length > 0 || searchInput) && (
          <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline font-medium">Clear All</button>
        )}
      </div>

      <div className="mb-8">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Categories</h3>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategory === null ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All Products
          </button>
          {categories?.map((cat: any) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Brands</h3>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
          {brands?.map((brand: any) => (
            <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={selectedBrands.includes(brand.id)}
                onChange={() => toggleBrand(brand.id)}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" 
              />
              <span className={`text-sm ${selectedBrands.includes(brand.id) ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {brand.name}
              </span>
            </label>
          ))}
          {(!brands || brands.length === 0) && (
            <p className="text-sm text-gray-400">No brands available</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* هدر جستجو */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Explore Products</h1>
            <p className="text-gray-500 mt-1 text-sm">Find exactly what you're looking for.</p>
          </div>
          
          <div className="w-full md:w-[400px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, description, brand..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm transition-all"
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsMobileFiltersOpen(true)}
            className="md:hidden w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm"
          >
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* سایدبار */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <FiltersSidebar />
          </div>

          {/* مودال موبایل */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)}></div>
              <div className="relative w-4/5 max-w-sm bg-white h-full p-6 overflow-y-auto">
                <button onClick={() => setIsMobileFiltersOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                <FiltersSidebar />
              </div>
            </div>
          )}

          {/* بخش اصلی محصولات */}
          <div className="flex-1 flex flex-col">
            
            {/* 👈 نوار مرتب‌سازی */}
            <div className="flex items-center gap-4 mb-6 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto hide-scrollbar">
              <span className="text-gray-500 font-bold text-sm whitespace-nowrap flex items-center gap-1.5 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                Sort by:
              </span>
              
              <div className="flex gap-2">
                {[
                  { label: 'Newest', value: '-created_at' },
                  { label: 'Cheapest', value: 'min_price' },
                  { label: 'Most Expensive', value: '-min_price' },
                  { label: 'Best Selling', value: '-sales_count' },
                  { label: 'Most Viewed', value: '-views_count' },
                  { label: 'Highly Rated', value: '-average_rating' },
                  { label: 'Featured', value: '-is_featured' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrdering(opt.value)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                      ordering === opt.value 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* گرید محصولات */}
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Searching our catalog...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-red-100 text-red-500 shadow-sm">
                Failed to load products. Please try again.
              </div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">We couldn't find any products matching your current filters and search term.</p>
                <button onClick={clearFilters} className="px-5 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: Product) => {
                  const coverImage = product.images?.find(img => img.is_main) || product.images?.[0];
                  const defaultVariant = product.variants?.[0];
                  const originalPrice = defaultVariant ? defaultVariant.price : 0;
                  const discountPercent = defaultVariant?.discount_percent || 0;
                  const finalPrice = originalPrice - (originalPrice * (discountPercent / 100));
                  
                  // 👈 ترفند جادویی برای نمایش قطعی اسم برند (حتی اگر سریالایزر نفرستاد)
                  const matchedBrand = brands?.find((b: any) => b.id === product.brand);
                  const finalBrandName = product.brand_name || matchedBrand?.name || 'Unbranded';

                  return (
                    <Link 
                      to={`/product/${product.id}`} 
                      key={product.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="relative p-4">
                        {discountPercent > 0 && (
                          <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-md z-10 shadow-sm">
                            {discountPercent}% OFF
                          </span>
                        )}
                        
                        <div className="h-48 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden mb-4">
                          {coverImage ? (
                            <img 
                              src={coverImage.image} 
                              alt={coverImage.alt_text || product.name} 
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 p-2"
                            />
                          ) : (
                            <span className="text-gray-400 font-medium text-sm">No Image Available</span>
                          )}
                        </div>
                        
                        <div>
                          {/* نمایش اسم برند اصلاح شد */}
                          <p className="text-xs text-blue-600 font-bold uppercase mb-1 tracking-wider">
                            {finalBrandName}
                          </p>
                          <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-0 flex justify-between items-end">
                        <div className="flex flex-col">
                          {discountPercent > 0 ? (
                            <>
                              <span className="text-xs text-gray-400 line-through decoration-gray-300 font-medium">${originalPrice.toLocaleString()}</span>
                              <span className="font-black text-gray-900 text-xl">${finalPrice.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="font-black text-gray-900 text-xl">${finalPrice.toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex items-center text-sm bg-yellow-50 px-2 py-1 rounded-lg">
                          <span className="text-yellow-500 mr-1 text-xs">★</span>
                          <span className="font-bold text-yellow-700">{product.average_rating ? Number(product.average_rating).toFixed(1) : 'New'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}