// src/pages/ProductDetailPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';

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

function ProductDetailPage() {
  const { id } = useParams();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}/`);
      return response.data as ProductDetailData;
    },
  });

  // 👇 راه‌حل: هوک useMutation اومد بالایِ بالا!
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

  // حالا با خیال راحت return های زودهنگام رو میذاریم
  if (isLoading) return <div className="p-8 text-center text-xl">Loading product details... ⏳</div>;
  if (isError || !product) return <div className="p-8 text-center text-red-500">Failed to load product.</div>;

  const currentVariant = selectedVariantId 
    ? product.variants?.find(v => v.id === selectedVariantId) 
    : product.variants?.[0];

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
        
        <div className="md:w-1/2">
          {product.images?.length > 0 ? (
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

        <div className="md:w-1/2 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-4">
              Brand: {product.brand || 'N/A'} | Category: {product.category?.name || 'Uncategorized'}
            </p>
            
            <div className="flex items-center mb-6">
              <span className="text-yellow-500 text-xl mr-1">★</span>
              <span className="font-semibold">
                {product.average_rating ? Number(product.average_rating).toFixed(1) : 'No reviews yet'}
              </span>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
              {product.description}
            </p>

            {product.variants?.length > 0 && (
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

          <div className="border-t pt-6 mt-4">
            {currentVariant ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-3xl font-bold text-gray-900">${currentVariant.price}</p>
                </div>
                
                <button 
                  onClick={handleAddToCart} 
                  disabled={currentVariant.stock === 0 || mutation.isPending} 
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