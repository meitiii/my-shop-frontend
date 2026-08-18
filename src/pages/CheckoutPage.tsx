// src/pages/CheckoutPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, CreditCard, Package, ArrowLeft, ShieldCheck } from 'lucide-react';

interface Address {
  id: number;
  title: string;
  full_address: string;
  city: string;
  state: string;
  postal_code: string;
  receiver_name: string;
  receiver_phone: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // ۱. گرفتن لیست آدرس‌های کاربر
  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      // 👈 فرض بر اینه که API آدرس‌ها رو تو مسیر /addresses/ داری
      const response = await api.get('users/addresses/'); 
      const results = response.data.results || response.data;
      
      // اگر آدرس دیفالتی وجود داشت، پیش‌فرض همون انتخاب بشه
      const defaultAddr = results.find((a: Address) => a.is_default);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (results.length > 0) setSelectedAddressId(results[0].id);

      return results;
    }
  });

  // ۲. گرفتن مجدد سبد خرید برای نمایش صورتحساب نهایی
  const { data: cartItems } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart/items/');
      return response.data.results || response.data;
    }
  });

  // ۳. ثبت نهایی سفارش به همراه آدرس
  const checkoutMutation = useMutation({
    mutationFn: async (addressId: number) => {
      const response = await api.post('/orders/checkout/', { address_id: addressId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // بعد از ثبت موفق، کاربر رو مستقیم می‌فرستیم به صفحه سفارشات تا دکمه "پرداخت" رو بزنه
      navigate('/orders');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to place order.');
    }
  });

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }
    checkoutMutation.mutate(selectedAddressId);
  };

  const totalPrice = cartItems?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link to="/cart" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="lg:w-2/3 space-y-6">
            {/* بخش ۱: آدرس‌ها */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="text-blue-600" /> Shipping Address
              </h2>

              {loadingAddresses ? (
                <p className="text-gray-500 animate-pulse">Loading addresses...</p>
              ) : !addresses || addresses.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                  <p className="text-yellow-800 font-medium mb-4">You don't have any saved addresses.</p>
                  <Link to="/profile/addresses" className="px-6 py-2 bg-yellow-500 text-white font-bold rounded-lg shadow hover:bg-yellow-600">
                    Add New Address
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address: Address) => (
                    <label 
                      key={address.id} 
                      className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedAddressId === address.id 
                          ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="address" 
                        value={address.id} 
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="sr-only" 
                      />
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">{address.title}</span>
                        {address.is_default && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-md font-bold">Default</span>}
                      </div>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">{address.full_address}</p>
                      <div className="mt-auto flex flex-col text-sm text-gray-500 gap-1">
                        <span>{address.receiver_name}</span>
                        <span>{address.receiver_phone}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* بخش ۲: روش پرداخت (در اینجا فعلاً آنلاینه) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="text-blue-600" /> Payment Method
              </h2>
              <div className="p-5 border-2 border-blue-600 bg-blue-50 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-blue-900">Online Payment</p>
                  <p className="text-sm text-blue-700 mt-1">Pay securely via bank gateway</p>
                </div>
                <ShieldCheck size={28} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* خلاصه فاکتور نهایی */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-black mb-6 text-gray-900 flex items-center gap-2">
                <Package className="text-gray-400" /> Order Summary
              </h3>
              
              <div className="space-y-4 mb-6 text-gray-600 font-medium border-b border-gray-100 pb-6">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span className="text-gray-900 font-bold">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="text-green-600 font-bold">Free</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-gray-900 font-bold">Total to Pay</span>
                <span className="text-3xl font-black text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={checkoutMutation.isPending || !selectedAddressId}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 hover:shadow-lg shadow-green-200 transition-all disabled:bg-gray-400 active:scale-95"
              >
                {checkoutMutation.isPending ? 'Placing Order...' : 'Place Order & Pay'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}