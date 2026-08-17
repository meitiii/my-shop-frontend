// src/pages/OrdersPage.tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { PackageOpen, CreditCard, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

interface OrderItem {
  id: number;
  variant_name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  total_price: string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const fetchOrders = async () => {
  const response = await api.get('/orders/');
  return response.data.results || response.data;
};

// 👈 اضافه کردن آیکون و استایل زیباتر برای وضعیت‌ها
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending': return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={16} /> };
    case 'paid': return { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle size={16} /> };
    case 'shipped': return { color: 'bg-purple-100 text-purple-800', icon: <Truck size={16} /> };
    case 'delivered': return { color: 'bg-green-100 text-green-800', icon: <PackageOpen size={16} /> };
    case 'canceled': return { color: 'bg-red-100 text-red-800', icon: <XCircle size={16} /> };
    default: return { color: 'bg-gray-100 text-gray-800', icon: <Clock size={16} /> };
  }
};

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });

  const payMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await api.post(`/payments/request/${orderId}/`);
      return response.data;
    },
    onSuccess: (data) => {
      const redirectUrl = data.url || data.payment_url;
      if (redirectUrl) {
        window.location.href = redirectUrl; // 👈 هدایت به درگاه شبیه‌سازی شده بک‌اند
      } else {
        alert("Payment URL not provided by the server.");
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Failed to initiate payment.");
    }
  });

  if (isLoading) return <div className="p-8 text-center text-xl text-gray-600 font-bold">Loading your orders... ⏳</div>;
  if (isError) return <div className="p-8 text-center text-red-500 font-bold">Failed to load orders. Please login.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-[85vh]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-3xl shadow-sm border border-gray-100">
            <PackageOpen size={64} className="mx-auto text-gray-300 mb-6" />
            <p className="text-gray-900 font-bold text-2xl mb-2">No orders yet</p>
            <p className="text-gray-500 mb-8">Looks like you haven't placed any orders.</p>
            <Link to="/search" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: Order) => {
              const statusBadge = getStatusBadge(order.status);
              
              return (
                <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                  
                  {/* Header */}
                  <div className="bg-gray-50/80 p-5 sm:p-6 flex flex-wrap justify-between items-center border-b border-gray-100 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">Order Placed</p>
                      <p className="font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">Total Price</p>
                      <p className="font-black text-gray-900">${order.total_price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">Order ID</p>
                      <p className="font-bold text-gray-900">#{order.id}</p>
                    </div>
                    <div>
                      <span className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold uppercase ${statusBadge.color}`}>
                        {statusBadge.icon} {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-5 sm:p-6 divide-y divide-gray-50">
                    {order.items?.map((item: OrderItem) => (
                      <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 text-lg mb-1">{item.variant_name}</p>
                          <p className="text-sm text-gray-500 font-medium">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-black text-gray-900 text-lg">${item.price}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer / Action */}
                  {order.status.toLowerCase() === 'pending' && (
                    <div className="bg-gray-50/50 p-5 sm:p-6 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => payMutation.mutate(order.id)}
                        disabled={payMutation.isPending}
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 hover:shadow-lg shadow-green-200 transition-all disabled:bg-gray-400 disabled:shadow-none"
                      >
                        <CreditCard size={20} />
                        {payMutation.isPending ? 'Connecting to Bank...' : 'Pay Now'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}