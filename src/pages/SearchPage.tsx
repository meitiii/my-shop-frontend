// src/pages/SearchPage.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, X, PackageOpen, 
  DollarSign, ChevronDown, LayoutGrid, Tag 
} from 'lucide-react';

interface ProductImage {
  id: number;
  image: string;
  is_main: boolean;
  alt_text: string | null;
}
interface Variant {
  price: number;
  discount_percent: number;
}
interface Product {
  id: number;
  name: string;
  brand: number | null;
  brand_name: string | null;
  images: ProductImage[];
  variants: Variant[];
  average_rating: number | string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const fetchProducts = async (
  search: string, 
  categoryId: number | null, 
  selectedBrands: number[], 
  ordering: string,
  inStock: boolean,
  minPrice: string | number,
  maxPrice: string | number
) => {
  const params: any = {};
  if (search) params.search = search;
  if (categoryId) params.category = categoryId;
  if (selectedBrands.length > 0) params.brand = selectedBrands.join(',');
  if (ordering) params.ordering = ordering;
  
  if (inStock) params.in_stock = true;
  if (minPrice) params.min_price = minPrice;
  if (maxPrice) params.max_price = maxPrice;

  const response = await api.get('/products/', { params });
  return response.data.results || response.data;
};

// ماکزیمم قیمت مجاز برای اسلایدر (بسته به واحد پولت می‌تونی این رو تغییر بدی)
const SLIDER_MAX = 5000; 

export default function SearchPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // استیت‌های جستجو و فیلتر
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchInput, 500); 
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [ordering, setOrdering] = useState('-created_at');
  
  const [inStock, setInStock] = useState(false);
  const [minPrice, setMinPrice] = useState<number | string>('');
  const [maxPrice, setMaxPrice] = useState<number | string>('');
  
  // دی‌باونس برای قیمت‌ها
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  // استیت‌های آکاردئون‌ها (کدام بخش‌ها باز باشند)
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isBrandOpen, setIsBrandOpen] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories/')).data.results || (await api.get('/categories/')).data,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands/')).data.results || (await api.get('/brands/')).data,
  });

  useEffect(() => {
    if (categories.length > 0) {
      if (slug) {
        const findCategoryBySlug = (cats: any[], targetSlug: string): any => {
          for (let cat of cats) {
            if (cat.slug === targetSlug) return cat;
            if (cat.subcategories) {
              const found = findCategoryBySlug(cat.subcategories, targetSlug);
              if (found) return found;
            }
          }
          return null;
        };

        const matchedCat = findCategoryBySlug(categories, slug);
        if (matchedCat) {
          setSelectedCategory(matchedCat.id);
        } else {
          setSelectedCategory(null);
        }
      } else {
        setSelectedCategory(null);
      }
    }
  }, [slug, categories]);

  const { data: products, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ['products', debouncedSearchTerm, selectedCategory, selectedBrands, ordering, inStock, debouncedMinPrice, debouncedMaxPrice],
    queryFn: () => fetchProducts(debouncedSearchTerm, selectedCategory, selectedBrands, ordering, inStock, debouncedMinPrice, debouncedMaxPrice),
  });

  const handleCategoryChange = (cat: any | null) => {
    if (cat) {
      navigate({ pathname: `/category/${cat.slug}`, search: location.search });
    } else {
      navigate({ pathname: `/search`, search: location.search });
    }
  };

  const toggleBrand = (brandId: number) => {
    setSelectedBrands(prev => prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]);
  };

  const clearFilters = () => {
    setSearchInput('');
    handleCategoryChange(null);
    setSelectedBrands([]);
    setOrdering('-created_at');
    setInStock(false);
    setMinPrice('');
    setMaxPrice('');
  };

  // محاسبه درصد برای نمایش رنگ آبی در نوار اسلایدر
  const minPercent = minPrice ? (Number(minPrice) / SLIDER_MAX) * 100 : 0;
  const maxPercent = maxPrice ? (Number(maxPrice) / SLIDER_MAX) * 100 : 100;

  // کدهای سایدبار به صورت مستقیم در بدنه اصلی (برای جلوگیری از باگ فوکوس)
  const renderSidebarContent = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-gray-900 text-xl flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-blue-600" /> Filters
        </h2>
        {(selectedCategory || selectedBrands.length > 0 || searchInput || inStock || minPrice || maxPrice) && (
          <button onClick={clearFilters} className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100 font-bold transition-colors">
            Clear All
          </button>
        )}
      </div>

      {/* ۱. سوئیچ موجودی */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <label className="flex items-center justify-between cursor-pointer group bg-gray-50 p-3 rounded-xl hover:bg-blue-50 transition-colors">
          <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
            <PackageOpen size={18} className={`${inStock ? 'text-blue-600' : 'text-gray-400'}`} />
            In Stock Only
          </div>
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
            <div className={`block w-11 h-6 rounded-full transition-colors duration-300 ease-in-out ${inStock ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${inStock ? 'translate-x-5' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* ۲. آکاردئون دسته‌بندی‌ها */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <button 
          onClick={() => setIsCategoryOpen(!isCategoryOpen)} 
          className="flex items-center justify-between w-full group"
        >
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <LayoutGrid size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            Categories
          </h3>
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <div className={`grid transition-all duration-300 ease-in-out ${isCategoryOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden flex flex-col gap-1">
            <button 
              onClick={() => handleCategoryChange(null)}
              className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategory === null ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              All Products
            </button>
            {categories?.map((cat: any) => (
              <button 
                key={cat.id}
                onClick={() => handleCategoryChange(cat)}
                className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ۳. آکاردئون بازه قیمتی (با اسلایدر دوگانه) */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <button 
          onClick={() => setIsPriceOpen(!isPriceOpen)} 
          className="flex items-center justify-between w-full group"
        >
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <DollarSign size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            Price Range
          </h3>
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isPriceOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className={`grid transition-all duration-300 ease-in-out ${isPriceOpen ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden px-1">
            
            {/* اسلایدر قیمت */}
            <div className="relative h-1.5 w-full bg-gray-200 rounded-full mb-8">
              {/* نوار آبی بین دو دستگیره */}
              <div 
                className="absolute h-full bg-blue-600 rounded-full" 
                style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
              ></div>
              
              <input 
                type="range" 
                min="0" 
                max={SLIDER_MAX} 
                value={minPrice || 0} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!maxPrice || val <= Number(maxPrice)) setMinPrice(val);
                }} 
                className="absolute w-full -top-1.5 h-1.5 appearance-none bg-transparent pointer-events-none dual-range" 
              />
              <input 
                type="range" 
                min="0" 
                max={SLIDER_MAX} 
                value={maxPrice || SLIDER_MAX} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!minPrice || val >= Number(minPrice)) setMaxPrice(val);
                }} 
                className="absolute w-full -top-1.5 h-1.5 appearance-none bg-transparent pointer-events-none dual-range" 
              />
            </div>

            {/* اینپوت‌های عددی */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input 
                  type="number" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)} 
                  className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-700"
                />
              </div>
              <span className="text-gray-300">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input 
                  type="number" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)} 
                  className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold text-gray-700"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ۴. آکاردئون برندها */}
      <div>
        <button 
          onClick={() => setIsBrandOpen(!isBrandOpen)} 
          className="flex items-center justify-between w-full group"
        >
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Tag size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            Brands
          </h3>
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isBrandOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <div className={`grid transition-all duration-300 ease-in-out ${isBrandOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {brands?.map((brand: any) => (
                <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedBrands.includes(brand.id)} 
                      onChange={() => toggleBrand(brand.id)} 
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all peer" 
                    />
                  </div>
                  <span className={`text-sm transition-colors ${selectedBrands.includes(brand.id) ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
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
      </div>
    </>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {/* 
        استایل‌های اختصاصی برای دستگیره‌های اسلایدر دوگانه
        این کد باعث میشه دستگیره‌ها روی هم قابل کلیک باشن
      */}
      <style>{`
        .dual-range::-webkit-slider-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          appearance: none;
          box-shadow: 0 0 0 3px white, 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transition: transform 0.1s;
        }
        .dual-range::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .dual-range::-moz-range-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 capitalize tracking-tight">
              {slug ? slug.replace('-', ' ') : 'Explore Products'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Find exactly what you're looking for.</p>
          </div>
          
          <div className="w-full md:w-[400px] relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
            <input
              type="text"
              placeholder="Search in products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-sm transition-all"
            />
            {searchInput && <button onClick={() => setSearchInput('')} className="absolute inset-y-0 right-0 pr-3"><X className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" /></button>}
          </div>

          <button onClick={() => setIsMobileFiltersOpen(true)} className="md:hidden w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm">
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* سایدبار دسکتاپ */}
          <div className="hidden md:block w-72 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
              {renderSidebarContent()}
            </div>
          </div>

          {/* مودال سایدبار موبایل */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)}></div>
              <div className="relative w-4/5 max-w-sm bg-white h-full p-6 overflow-y-auto">
                <button onClick={() => setIsMobileFiltersOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                {renderSidebarContent()}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col">
            
            {/* نوار مرتب‌سازی */}
            <div className="flex items-center gap-4 mb-6 bg-white p-2 md:p-3 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto hide-scrollbar">
              <span className="text-gray-500 font-bold text-sm flex items-center gap-1.5 ml-2 whitespace-nowrap">Sort by:</span>
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
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${ordering === opt.value ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* گرید محصولات */}
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Searching our catalog...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-red-100 text-red-500 shadow-sm font-bold">Failed to load products.</div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                <PackageOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search term.</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: Product) => {
                  const coverImage = product.images?.find(img => img.is_main) || product.images?.[0];
                  const defaultVariant = product.variants?.[0];
                  const originalPrice = defaultVariant ? defaultVariant.price : 0;
                  const discountPercent = defaultVariant?.discount_percent || 0;
                  const finalPrice = originalPrice - (originalPrice * (discountPercent / 100));
                  const matchedBrand = brands?.find((b: any) => b.id === product.brand);
                  const finalBrandName = product.brand_name || matchedBrand?.name || 'Unbranded';

                  return (
                    <Link to={`/product/${product.id}`} key={product.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                      <div className="relative p-4">
                        {discountPercent > 0 && <span className="absolute top-5 right-5 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg z-10 shadow-sm">{discountPercent}% OFF</span>}
                        <div className="h-52 rounded-2xl bg-gray-50/50 flex items-center justify-center overflow-hidden mb-4 p-4">
                          {coverImage ? (
                            <img src={coverImage.image} alt={coverImage.alt_text || product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="text-gray-400 font-medium text-sm">No Image</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-bold uppercase mb-1 tracking-wider">{finalBrandName}</p>
                          <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        </div>
                      </div>
                      <div className="px-5 pb-5 pt-0 flex justify-between items-end">
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