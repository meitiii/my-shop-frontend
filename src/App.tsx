// src/App.tsx
import { useEffect, useState } from 'react';
import { api } from './services/api';

interface Product {
  id: number;
  name: string;
  price: number; 
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/')
      .then((response) => {
        setProducts(response.data.results);
      })
      .catch((error) => {
        console.error("خطا در دریافت اطلاعات:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">لیست محصولات فروشگاه</h1>
      
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold">{product.name}</h2>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;