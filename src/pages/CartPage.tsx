// src/pages/CartPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Trash2, Plus, Minus, PackageOpen } from 'lucide-react';

interface CartItem {
  id?: number; // فقط برای حالت لاگین شده وجود دارد
  variant: number; // ID of the variant
  variant_name: string;
  price: number;
  quantity: number;
  stock: number;
  image: string | null;
  product_id: number;
}

const fetchCartItems = async () => {
  const response = await api.get('/cart/items/');
  return response.data.results || response.data;
};

const checkoutCart = async () => {
  const response = await api.post('/orders/checkout/');
  return response.data;
};

export default function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // وضعیت کاربر
  const { accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;

  // توابع سبد خرید لوکال (برای مهمان)
  const { localItems, updateQuantity, removeItem: removeLocalItem, clearCart } = useCartStore();

  // گرفتن دیتای سبد خرید (فقط اگر لاگین بود ریکوئست میزنه)
  const { data: remoteCartItems, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCartItems,
    enabled: isAuthenticated,
  });

  // تصمیم‌گیری برای نمایش دیتا: دیتای سرور یا دیتای مرورگر؟
  const displayItems: CartItem[] = isAuthenticated ? (remoteCartItems || []) : localItems;

  // ==========================================
  // توابع مربوط به آپدیت و حذف در بک‌اند (کاربر لاگین)
  // ==========================================
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number, quantity: number }) => {
      await api.patch(`/cart/items/${id}/`, { quantity });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/cart/items/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] })
  });

  // ==========================================
  // هندلرهای نهایی دکمه‌ها
  // ==========================================
  const handleIncrease = (item: CartItem) => {
    if (item.quantity >= item.stock) return;

    if (isAuthenticated && item.id) {
      updateItemMutation.mutate({ id: item.id, quantity: item.quantity + 1 });
    } else {
      updateQuantity(item.variant, item.quantity + 1);
    }
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity <= 1) return;

    if (isAuthenticated && item.id) {
      updateItemMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
    } else {
      updateQuantity(item.variant, item.quantity - 1);
    }
  };

  const handleRemove = (item: CartItem) => {
    if (isAuthenticated && item.id) {
      removeItemMutation.mutate(item.id);
    } else {
      removeLocalItem(item.variant);
    }
  };

  // انجام عملیات Checkout
  const checkoutMutation = useMutation({
    mutationFn: checkoutCart,
    onSuccess: () => {
      alert('Order successfully placed!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/orders');
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        alert(error.response.data?.error || 'Cart is empty or not enough stock.');
      } else {
        alert('An error occurred during checkout.');
      }
    }
  });

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      alert("Please login to proceed to checkout.");
      navigate('/login'); // کاربر مهمان باید لاگین کند
    } else {
      checkoutMutation.mutate();
    }
  };

  if (isAuthenticated && isLoading) {
    return <div className="p-8 text-center text-xl text-gray-600">Loading your cart... ⏳</div>;
  }

  const totalPrice = displayItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Shopping Cart</h1>

        {!displayItems || displayItems.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-gray-100">
            <PackageOpen size={64} className="mx-auto text-gray-300 mb-6" />
            <p className="text-gray-900 font-bold text-2xl mb-2">Your cart is empty</p>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/search" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* لیست آیتم‌های سبد خرید */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                {displayItems.map((item: CartItem) => (
                  <div key={item.id || item.variant} className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start group">
                    
                    {/* عکس محصول */}
                    <div className="w-28 h-28 flex-shrink-0 bg-gray-50 rounded-2xl flex items-center justify-center p-2">
                      {item.image ? (
                        <img src={item.image} alt={item.variant_name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-2">
                        <Link to={`/product/${item.product_id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                          {item.variant_name}
                        </Link>
                        <p className="text-xl font-black text-gray-900 ml-4">${item.price}</p>
                      </div>

                      <div className="flex flex-wrap justify-between items-end mt-6 gap-4">
                        {/* کنترل تعداد (Quantity) */}
                        <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
                          <button 
                            onClick={() => handleDecrease(item)} 
                            disabled={item.quantity <= 1 || updateItemMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-50 transition-all"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                          <button 
                            onClick={() => handleIncrease(item)} 
                            disabled={item.quantity >= item.stock || updateItemMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-50 transition-all"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {/* اطلاعات موجودی و دکمه حذف */}
                        <div className="flex items-center gap-6">
                          <span className={`text-sm font-medium ${item.stock <= 3 ? 'text-red-500' : 'text-green-600'}`}>
                            {item.stock} left in stock
                          </span>
                          <button 
                            onClick={() => handleRemove(item)}
                            disabled={removeItemMutation.isPending}
                            className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* خلاصه سفارش و دکمه Checkout */}
            <div className="lg:w-1/3">
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                <h3 className="text-xl font-black mb-6 text-gray-900">Order Summary</h3>
                
                <div className="space-y-4 mb-6 text-gray-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal ({displayItems.length} items)</span>
                    <span className="text-gray-900 font-bold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="text-gray-900 font-bold">$0.00</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-6 mb-8 flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Total</span>
                  <span className="text-3xl font-black text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  disabled={checkoutMutation.isPending}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg shadow-blue-200 transition-all disabled:bg-gray-400 active:scale-95"
                >
                  {checkoutMutation.isPending ? 'Processing...' : 'Proceed to Checkout'}
                </button>
                
                {!isAuthenticated && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    You will be asked to sign in to complete your order.
                  </p>
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}