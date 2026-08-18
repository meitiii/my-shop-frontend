// src/pages/CheckoutPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, CreditCard, Package, ArrowLeft, ShieldCheck, Banknote, CalendarDays, Ticket } from 'lucide-react';

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

// تابع برای ساخت تاریخ‌های ۳ روز آینده برای تحویل
const generateDeliveryDates = () => {
  const dates = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 1; i <= 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push({
      value: date.toISOString().split('T')[0], // فرمت YYYY-MM-DD برای بک‌اند
      label: `${days[date.getDay()]}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    });
  }
  return dates;
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // استیت‌های فرم
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [deliveryDate, setDeliveryDate] = useState<string>(generateDeliveryDates()[0].value);
  
  // استیت‌های کوپن
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, amount: number, percent: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const deliveryOptions = generateDeliveryDates();

  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get('/users/addresses/'); 
      const results = response.data.results || response.data;
      const defaultAddr = results.find((a: Address) => a.is_default);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (results.length > 0) setSelectedAddressId(results[0].id);
      return results;
    }
  });

  const { data: cartItems } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart/items/');
      return response.data.results || response.data;
    }
  });

  // محاسبه قیمت‌ها (مشابه بک‌اند)
  const itemsTotal = cartItems?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
  const shippingCost = 15.00; // این عدد رو با بک‌اند یکسان در نظر گرفتیم
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.percent > 0) {
      discountAmount = itemsTotal * (appliedCoupon.percent / 100);
    } else if (appliedCoupon.amount > 0) {
      discountAmount = appliedCoupon.amount;
    }
  }

  const finalTotal = (itemsTotal - discountAmount) + shippingCost;

  // اعمال کد تخفیف
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post('/orders/validate_coupon/', { code });
      return response.data;
    },
    onSuccess: (data) => {
      setAppliedCoupon({
        code: couponCode,
        amount: Number(data.discount_amount),
        percent: Number(data.discount_percent)
      });
      setCouponError('');
    },
    onError: (error: any) => {
      setCouponError(error.response?.data?.error || 'Invalid coupon.');
      setAppliedCoupon(null);
    }
  });

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCouponMutation.mutate(couponCode);
    }
  };

  // ثبت نهایی سفارش
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        delivery_date: deliveryDate,
        coupon_code: appliedCoupon?.code || undefined
      };
      const response = await api.post('/orders/checkout/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // اگر پرداخت آنلاین بود یا درب منزل، در هر صورت میفرستیمش سفارشات
      navigate('/orders');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to place order.');
    }
  });

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link to="/cart" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="lg:w-2/3 space-y-6">
            
            {/* ۱. آدرس‌ها */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="text-blue-600" /> 1. Delivery Address
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
                    <label key={address.id} className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddressId === address.id ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
                      <input type="radio" name="address" value={address.id} checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} className="sr-only" />
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">{address.title}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">{address.full_address}</p>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ۲. زمان تحویل (جدید) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CalendarDays className="text-blue-600" /> 2. Delivery Date
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {deliveryOptions.map((opt) => (
                  <label key={opt.value} className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${deliveryDate === opt.value ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold' : 'border-gray-200 hover:border-blue-300 text-gray-600'}`}>
                    <input type="radio" name="deliveryDate" value={opt.value} checked={deliveryDate === opt.value} onChange={() => setDeliveryDate(opt.value)} className="sr-only" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ۳. روش پرداخت (جدید) */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="text-blue-600" /> 3. Payment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <label className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="sr-only" />
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">Online Payment</span>
                    <ShieldCheck className={paymentMethod === 'online' ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <p className="text-sm text-gray-500">Pay securely via bank gateway</p>
                </label>

                <label className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="sr-only" />
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">Cash on Delivery</span>
                    <Banknote className={paymentMethod === 'cod' ? 'text-blue-600' : 'text-gray-400'} />
                  </div>
                  <p className="text-sm text-gray-500">Pay when you receive the package</p>
                </label>
                
              </div>
            </div>

          </div>

          {/* خلاصه فاکتور */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-black mb-6 text-gray-900 flex items-center gap-2">
                <Package className="text-gray-400" /> Order Summary
              </h3>

              {/* باکس کد تخفیف */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                  <Ticket size={16} /> Have a coupon code?
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)} 
                    placeholder="Enter code" 
                    disabled={!!appliedCoupon}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold text-gray-700"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || applyCouponMutation.isPending || !!appliedCoupon}
                    className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
                  >
                    {appliedCoupon ? 'Applied' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                {appliedCoupon && (
                  <div className="mt-2 text-sm text-green-600 font-bold flex justify-between items-center">
                    <span>Coupon '{appliedCoupon.code}' applied!</span>
                    <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="text-red-500 hover:underline text-xs">Remove</button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 mb-6 text-gray-600 font-medium border-b border-gray-100 pb-6">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span className="text-gray-900 font-bold">${itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="text-gray-900 font-bold">${shippingCost.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-gray-900 font-bold">Total to Pay</span>
                <span className="text-3xl font-black text-gray-900">${finalTotal > 0 ? finalTotal.toFixed(2) : '0.00'}</span>
              </div>

              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || !selectedAddressId}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg shadow-blue-200 transition-all disabled:bg-gray-400 active:scale-95"
              >
                {checkoutMutation.isPending ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}