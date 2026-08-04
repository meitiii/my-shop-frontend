// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';

function App() {
  return (
    // BrowserRouter کل اپلیکیشن رو قادر میسازه تا URL ها رو مدیریت کنه
    <BrowserRouter>
      {/* هدر سایت که تو همه صفحات ثابته */}
      <header className="bg-white shadow-sm p-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">فروشگاه من</Link>
          <div className="space-x-4 space-x-reverse">
            <Link to="/" className="text-gray-600 hover:text-blue-600">خانه</Link>
            <Link to="/cart" className="text-gray-600 hover:text-blue-600">سبد خرید</Link>
          </div>
        </nav>
      </header>

      {/* Routes: اینجا تصمیم میگیره کدوم صفحه رو نشون بده */}
      <main className="container mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* :id یک پارامتر متغیره که تو صفحه ProductDetailPage میخونیمش */}
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="*" element={<div className="p-8 text-center text-red-500">صفحه پیدا نشد (۴۰۴)</div>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;