// src/App.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from './services/api';

interface Product {
  id: number;
  name: string;
}

// تابعی که درخواست رو میزنه (QueryFn)
const fetchProducts = async () => {
  const response = await api.get('/products/');
  return response.data.results;
};

function App() {
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
          <div key={product.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;