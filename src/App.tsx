// src/App.tsx
import OrdersPage from './pages/OrdersPage';
import { Routes, Route, Link } from 'react-router-dom'; // BrowserRouter پاک شد
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
function App() {
  return (
    // به جای BrowserRouter از یک تگ خالی (Fragment) استفاده می‌کنیم
    <> 
      <header className="bg-white shadow-sm p-4 mb-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">فروشگاه من</Link>
          <div className="space-x-4 space-x-reverse">
            <Link to="/" className="text-gray-600 hover:text-blue-600">خانه</Link>
            <Link to="/cart" className="text-gray-600 hover:text-blue-600">سبد خرید</Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<div className="p-8 text-center text-red-500">صفحه پیدا نشد (۴۰۴)</div>} />
        </Routes>
      </main>
    </>
  );
}

export default App;