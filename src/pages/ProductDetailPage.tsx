// src/pages/ProductDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import ProductReviews from '../components/ProductReviews';

interface Variant {
  id: number;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  discount_percent: number;
}

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  is_main: boolean;
}

interface ProductDetailData {
  id: number;
  name: string;
  short_description: string;
  description: string;
  // 👈 آپدیت تایپ‌ها برای پشتیبانی از دیتای جدید و قدیم
  features: string[] | string; 
  technical_specs: Record<string, string> | string; 
  brand: number | null;
  brand_name: string | null;
  weight: string;
  dimensions: string;
  material: string;
  warranty: string;
  country_of_origin: string;
  category: { name: string } | null;
  average_rating: number | string | null;
  images: ProductImage[];
  variants: Variant[];
}

const addToCart = async (variantId: number) => {
  const response = await api.post('/cart/items/', {
    variant: variantId,
    quantity: 1, 
  });
  return response.data;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}/`);
      return response.data as ProductDetailData;
    },
  });

  useEffect(() => {
    if (product?.images) {
      const mainIndex = product.images.findIndex(img => img.is_main);
      setActiveImageIndex(mainIndex >= 0 ? mainIndex : 0);
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      alert('Successfully added to cart!'); 
    },
    onError: (error: any) => {
      if (error.response?.status === 401) {
        alert('Please login to add items to your cart.');
      } else {
        alert('Failed to add to cart. Please try again.');
      }
    }
  });

  if (isLoading) return <div className="p-8 text-center text-xl text-gray-600">Loading product details... ⏳</div>;
  if (isError || !product) return <div className="p-8 text-center text-red-500 font-bold">Failed to load product.</div>;

  const currentVariant = selectedVariantId 
    ? product.variants?.find(v => v.id === selectedVariantId) 
    : product.variants?.[0];

  const handleAddToCart = () => {
    if (currentVariant) {
      mutation.mutate(currentVariant.id);
    }
  };

  const originalPrice = currentVariant ? currentVariant.price : 0;
  const discountPercent = currentVariant?.discount_percent || 0;
  const finalPrice = originalPrice - (originalPrice * (discountPercent / 100));

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white shadow-sm mb-8">
        <div className="max-w-6xl mx-auto px-4 py-4 flex text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-10">
          
          <div className="md:w-1/2 flex flex-col gap-4">
            <div className="aspect-square bg-white border rounded-2xl overflow-hidden flex items-center justify-center p-4 relative">
              {discountPercent > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-md z-10">
                  {discountPercent}% OFF
                </span>
              )}
              {product.images?.length > 0 ? (
                <img 
                  src={product.images[activeImageIndex]?.image} 
                  alt={product.images[activeImageIndex]?.alt_text || product.name} 
                  className="w-full h-full object-contain transition-opacity duration-300"
                />
              ) : (
                <div className="text-gray-400 font-medium">No Image Available</div>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
                {product.images.map((img, index) => (
                  <button 
                    key={img.id}
                    onClick={() => setActiveImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded-xl overflow-hidden p-1 ${
                      activeImageIndex === index ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img.image} alt="thumbnail" className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:w-1/2 flex flex-col justify-between">
            <div>
              <div className="mb-2">
                <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md">
                  {product.category?.name || 'Category'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <p className="text-sm text-gray-500 font-medium">Brand: <span className="text-gray-800">{product.brand_name || 'N/A'}</span></p>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-400 text-lg mr-1">★</span>
                  <span className="font-bold text-gray-800">
                    {product.average_rating ? Number(product.average_rating).toFixed(1) : 'No ratings'}
                  </span>
                </div>
              </div>

              {product.short_description && (
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {product.variants?.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Available Options</h3>
                  <div className="flex gap-3 flex-wrap">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                        disabled={variant.stock === 0}
                        className={`px-5 py-2.5 border-2 rounded-xl font-medium transition-all ${
                          (selectedVariantId === variant.id) || (!selectedVariantId && product.variants[0].id === variant.id)
                            ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                            : variant.stock === 0
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 text-gray-700'
                        }`}
                      >
                        {variant.color && <span>{variant.color} </span>}
                        {variant.size && <span>({variant.size})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 mt-4">
              {currentVariant ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Price</p>
                    <div className="flex items-end gap-3">
                      <p className={`text-4xl font-extrabold ${discountPercent > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        ${finalPrice.toLocaleString()}
                      </p>
                      {discountPercent > 0 && (
                        <p className="text-xl text-gray-400 line-through mb-1">
                          ${originalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {currentVariant.stock > 0 && currentVariant.stock < 5 && (
                      <p className="text-orange-500 text-sm font-medium mt-2">
                        Only {currentVariant.stock} left in stock - order soon.
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleAddToCart} 
                    disabled={currentVariant.stock === 0 || mutation.isPending} 
                    className={`px-10 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-md ${
                      currentVariant.stock > 0 && !mutation.isPending
                        ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {mutation.isPending ? 'Adding to Cart...' : currentVariant.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              ) : (
                <p className="text-red-500 font-medium">This product is currently unavailable.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Product Overview</h2>
              <p className="text-gray-700 leading-loose whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* 👈 آپدیت رندر ویژگی‌ها */}
            {product.features && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Key Features</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {Array.isArray(product.features) ? (
                    product.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))
                  ) : (
                    <li className="whitespace-pre-line">{product.features}</li>
                  )}
                </ul>
              </div>
            )}
            
            {/* 👈 آپدیت رندر مشخصات فنی به صورت گرید منظم */}
            {product.technical_specs && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Technical Specifications</h2>
                {typeof product.technical_specs === 'object' && !Array.isArray(product.technical_specs) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    {Object.entries(product.technical_specs).map(([key, value], idx) => (
                      <div key={idx} className="flex flex-col border-b border-gray-100 pb-3">
                        <span className="text-sm text-gray-500 font-medium">{key}</span>
                        <span className="text-gray-900 font-semibold mt-1">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 leading-loose whitespace-pre-line">
                    {product.technical_specs}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Specifications</h2>
              <div className="space-y-4 text-sm">
                
                {product.brand_name && (
                  <div className="flex justify-between border-b border-gray-50 pb-3">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-semibold text-gray-900">
                      {product.brand_name}
                    </span>
                  </div>
                )}
                
                {product.weight && (
                  <div className="flex justify-between border-b border-gray-50 pb-3">
                    <span className="text-gray-500">Weight</span>
                    <span className="font-semibold text-gray-900">{product.weight}</span>
                  </div>
                )}

                {product.dimensions && (
                  <div className="flex justify-between border-b border-gray-50 pb-3">
                    <span className="text-gray-500">Dimensions</span>
                    <span className="font-semibold text-gray-900">{product.dimensions}</span>
                  </div>
                )}

                {product.material && (
                  <div className="flex justify-between border-b border-gray-50 pb-3">
                    <span className="text-gray-500">Material</span>
                    <span className="font-semibold text-gray-900">{product.material}</span>
                  </div>
                )}

                {product.country_of_origin && (
                  <div className="flex justify-between border-b border-gray-50 pb-3">
                    <span className="text-gray-500">Origin</span>
                    <span className="font-semibold text-gray-900">{product.country_of_origin}</span>
                  </div>
                )}

                {product.warranty && (
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-500">Warranty</span>
                    <span className="font-semibold text-gray-900 text-right">{product.warranty}</span>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <ProductReviews productId={id} />
        </div>

      </div>
    </div>
  );
}