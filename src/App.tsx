// src/App.tsx
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/authStore'; // ایمپورت کردن استور
import RegisterPage from './pages/RegisterPage';

function App() {
  // گرفتن توکن و تابع خروج از استور Zustand
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // تبدیل توکن به یک مقدار بولین (True/False): اگر توکن باشه میشه true، اگر null باشه میشه false
  const isAuthenticated = !!accessToken;

  const handleLogout = () => {
    logout(); // پاک کردن توکن
    navigate('/'); // هدایت به صفحه اصلی بعد از خروج
  };

  return (
    <> 
      <header className="bg-white shadow-sm p-4 mb-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">My Shop</Link>
          
          <div className="space-x-4 space-x-reverse flex items-center">
            <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            
            {/* شرط‌گذاری: اگر کاربر لاگین کرده بود */}
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="text-gray-600 hover:text-blue-600">Cart</Link>
                <Link to="/orders" className="text-gray-600 hover:text-blue-600">My Orders</Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              /* اگر کاربر لاگین نکرده بود */
              <>
                <Link to="/login" className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-colors">
                  Login
                </Link>
                <Link to="/register" className="text-gray-600 hover:text-blue-600 font-semibold">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="container mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* صفحه Register رو هم به زودی می‌سازیم، پس فعلا خطاش 404 میده که طبیعیه */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<div className="p-8 text-center text-red-500">Page Not Found (404)</div>} />
        </Routes>
      </main>
    </>
  );
}

export default App;