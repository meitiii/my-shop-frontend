// src/pages/ProductDetailPage.tsx
 // useMutation اضافه شد
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';


// ۱. تعریف دقیق ساختار دیتایی که از بک‌اند جنگو میاد (Interface)
interface Variant {
  id: number;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
}

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface ProductDetailData {
  id: number;
  name: string;
  description: string;
  brand: string;
  category: { name: string };
  average_rating: number | null;
  images: ProductImage[];
  variants: Variant[];
}
const addToCart = async (variantId: number) => {
  const response = await api.post('/cart/items/', {
    variant: variantId,
    quantity: 1, // فعلا پیش‌فرض ۱ دونه اضافه می‌کنیم
  });
  return response.data;
};
function ProductDetailPage() {
  const { id } = useParams();
  
  // State برای نگهداری تنوع (Variant) انتخاب شده توسط کاربر
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  // ۲. استفاده از React Query برای گرفتن دیتای فقط همین محصول
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id], // کلید ترکیبی: اسم + آیدی محصول
    queryFn: async () => {
      const response = await api.get(`/products/${id}/`);
      return response.data as ProductDetailData;
    },
  });

  if (isLoading) return <div className="p-8 text-center text-xl">Loading product details... ⏳</div>;
  if (isError || !product) return <div className="p-8 text-center text-red-500">Failed to load product.</div>;

  // پیدا کردن دیتای کاملِ تنوعی که کاربر انتخاب کرده (یا اگر چیزی انتخاب نکرده، اولیش رو نشون بده)
  const currentVariant = selectedVariantId 
    ? product.variants.find(v => v.id === selectedVariantId) 
    : product.variants[0];
  const mutation = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      alert('Successfully added to cart!'); // فعلا یه alert ساده میذاریم
      // تو فازهای بعدی میتونیم اینجا یه پیام شیک (Toast) نشون بدیم
    },
    onError: (error: any) => {
      // اگر ارور 401 (لاگین نبودن) داد
      if (error.response?.status === 401) {
        alert('Please login to add items to your cart.');
      } else {
        alert('Failed to add to cart. Please try again.');
      }
    }
  });

  // تابعی که به دکمه وصل میشه
  const handleAddToCart = () => {
    if (currentVariant) {
      mutation.mutate(currentVariant.id);
    }
  };
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Link to="/" className="text-blue-500 hover:underline mb-6 inline-block">
        &larr; Back to Shop
      </Link>

      <div className="bg-white rounded-xl shadow-lg p-6 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* بخش تصویر محصول */}
        <div className="md:w-1/2">
          {product.images.length > 0 ? (
            <img 
              src={product.images[0].image} 
              alt={product.images[0].alt_text || product.name} 
              className="w-full h-auto rounded-lg object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg text-gray-500">
              No Image Available
            </div>
          )}
        </div>

        {/* بخش اطلاعات محصول */}
        <div className="md:w-1/2 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-4">
              Brand: {product.brand || 'N/A'} | Category: {product.category?.name}
            </p>
            
            {/* نمایش میانگین امتیاز که تو فاز قبل نوشتیم */}
            <div className="flex items-center mb-6">
              <span className="text-yellow-500 text-xl mr-1">★</span>
              <span className="font-semibold">{product.average_rating ? product.average_rating.toFixed(1) : 'No reviews yet'}</span>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
              {product.description}
            </p>

            {/* بخش انتخاب تنوع (Variants) */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Available Options:</h3>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-4 py-2 border rounded-md transition-colors ${
                        (selectedVariantId === variant.id) || (!selectedVariantId && product.variants[0].id === variant.id)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
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

          {/* بخش قیمت و دکمه افزودن به سبد */}
          <div className="border-t pt-6 mt-4">
            {currentVariant ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-3xl font-bold text-gray-900">${currentVariant.price}</p>
                </div>
                
                <button 
                  onClick={handleAddToCart} // این اضافه شد
                  disabled={currentVariant.stock === 0 || mutation.isPending} // isPending اضافه شد
                  className={`px-8 py-3 rounded-lg font-bold text-white transition-colors ${
                    currentVariant.stock > 0 && !mutation.isPending
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {mutation.isPending 
                    ? 'Adding...' 
                    : currentVariant.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            ) : (
              <p className="text-red-500">This product is currently unavailable.</p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;