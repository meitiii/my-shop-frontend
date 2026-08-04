// src/App.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
interface Product {
  id: number;
  name: string;
}

// تابعی که درخواست رو میزنه (QueryFn)
const fetchProducts = async () => {
  const response = await api.get('/products/');
  return response.data.results;
};

function HomePage() {
  // استفاده از هوشِ React Query
  const { data: products, isLoading, isError, error } = useQuery({
    queryKey: ['products'], // کلید منحصر‌به‌فرد
    queryFn: fetchProducts,
  });

  if (isLoading) return <div className="p-8 text-center text-xl">در حال بارگذاری... ⏳</div>;
  
  if (isError) return <div className="p-8 text-center text-red-500">خطا: {error.message}</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">لیست محصولات فروشگاه</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products?.map((product: Product) => (
          // به جای div از Link استفاده کردیم تا قابل کلیک بشه
          <Link 
            to={`/product/${product.id}`} 
            key={product.id} 
            className="block bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
            <p className="text-sm text-blue-500 mt-2">مشاهده جزئیات</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage ;