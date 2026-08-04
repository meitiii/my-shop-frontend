// src/pages/CartPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

interface CartItem {
  id: number;
  variant: number; // ID of the variant
  variant_name: string;
  price: number;
  quantity: number;
}

const fetchCartItems = async () => {
  const response = await api.get('/cart/items/');
  // فرض بر اینه که اگر صفحه‌بندی فعال باشه تو results هست، وگرنه خودِ آرایه برمیگرده
  return response.data.results || response.data;
};

const checkoutCart = async () => {
  const response = await api.post('/orders/checkout/');
  return response.data;
};

function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // گرفتن دیتای سبد خرید
  const { data: cartItems, isLoading, isError } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCartItems,
  });

  // انجام عملیات Checkout
  const checkoutMutation = useMutation({
    mutationFn: checkoutCart,
    onSuccess: (data) => {
      alert('Order successfully placed!');
      // پاک کردن کش ریکت‌کوئری برای سبد خرید (چون بعد از چک‌اوت سبد خالی میشه)
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // هدایت کاربر به صفحه اصلی (یا بعدا صفحه سفارشات)
      navigate('/');
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        alert(error.response.data?.error || 'Cart is empty or not enough stock.');
      } else if (error.response?.status === 401) {
        alert('Please login to checkout.');
      } else {
        alert('An error occurred during checkout.');
      }
    }
  });

  if (isLoading) return <div className="p-8 text-center text-xl">Loading your cart... ⏳</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load cart. Please login.</div>;

  // محاسبه مجموع قیمت کل سبد خرید
  const totalPrice = cartItems?.reduce((total: number, item: CartItem) => {
    return total + (item.price * item.quantity);
  }, 0) || 0;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Shopping Cart</h1>

      {!cartItems || cartItems.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-lg shadow-sm">
          <p className="text-gray-500 text-lg mb-6">Your cart is currently empty.</p>
          <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
          
          {/* لیست آیتم‌های سبد خرید */}
          <div className="md:w-2/3">
            <div className="bg-white rounded-lg shadow-sm divide-y">
              {cartItems.map((item: CartItem) => (
                <div key={item.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{item.variant_name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${item.price}</p>
                    <p className="text-sm text-gray-500">Total: ${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* خلاصه سبد خرید و دکمه Checkout */}
          <div className="md:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
              <h3 className="text-xl font-bold mb-4 border-b pb-2">Order Summary</h3>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between mb-6 border-b pb-4">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-500">Free</span>
              </div>
              
              <div className="flex justify-between mb-8 text-xl font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>

              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {checkoutMutation.isPending ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default CartPage;