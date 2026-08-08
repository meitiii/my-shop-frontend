// src/pages/OrdersPage.tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'paid': return 'bg-blue-100 text-blue-800';
    case 'shipped': return 'bg-purple-100 text-purple-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'canceled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

function OrdersPage() {
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });

  // توابع مربوط به پرداخت باید حتما داخل کامپوننت باشن
  const payMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await api.post(`/payments/request/${orderId}/`);
      return response.data;
    },
    onSuccess: (data) => {
      const redirectUrl = data.url || data.payment_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        alert("Payment URL not provided by the server.");
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Failed to initiate payment.");
    }
  });

  const handlePayment = (orderId: number) => {
    payMutation.mutate(orderId);
  };

  if (isLoading) return <div className="p-8 text-center text-xl">Loading your orders... ⏳</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load orders. Please login.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-[85vh]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg mb-6">You haven't placed any orders yet.</p>
            <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: Order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* هدرِ کارتِ سفارش */}
                <div className="bg-gray-100 p-4 flex flex-wrap justify-between items-center border-b gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Placed</p>
                    <p className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Price</p>
                    <p className="font-semibold">${order.total_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold">#{order.id}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* لیست آیتم‌های داخل این سفارش */}
                <div className="p-4 divide-y">
                  {order.items?.map((item: OrderItem) => (
                    <div key={item.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{item.variant_name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold">${item.price}</p>
                    </div>
                  ))}
                </div>

                {/* دکمه پرداخت (فقط برای سفارش‌های پرداخت نشده) */}
                {order.status.toLowerCase() === 'pending' && (
                  <div className="bg-gray-50 p-4 border-t flex justify-end">
                    <button
                      onClick={() => handlePayment(order.id)}
                      disabled={payMutation.isPending}
                      className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {payMutation.isPending ? 'Connecting to Bank...' : 'Pay Now'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;