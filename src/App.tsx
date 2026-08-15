// src/App.tsx
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PaymentVerifyPage from './pages/PaymentVerifyPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductForm from './pages/admin/AdminProductForm';
import Footer from './components/Footer'; 
import type { ReactNode } from 'react';
import AdminSlidersPage from './pages/admin/AdminSlidersPage';
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// این کامپوننت حاوی محتوای اصلی سایت است تا useLocation به درستی کار کند
function AppContent() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!accessToken;
  const isAdminRoute = location.pathname.startsWith('/dashboard');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 mb-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">My Shop</Link>
          
          <div className="space-x-4 space-x-reverse flex items-center">
            <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-gray-600 hover:text-blue-600">Profile</Link>
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

      {/* Main Content */}
      <main className="container mx-auto flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payment/verify" element={<PaymentVerifyPage />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
          <Route path="/dashboard/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
          <Route path="/dashboard/products/edit/:id" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
          <Route path="/dashboard/brands" element={<AdminRoute><AdminBrandsPage /></AdminRoute>} />
          <Route path="/dashboard/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
          <Route path="/dashboard/sliders" element={<AdminRoute><AdminSlidersPage /></AdminRoute>} />
          
          {/* Auth Extras */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />  
          
          <Route path="*" element={<div className="p-8 text-center text-red-500 font-bold text-xl">Page Not Found (404)</div>} />
        </Routes>
      </main>

      {/* Footer - Only shows if NOT on an admin dashboard route */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

// کامپوننت اصلی که اکسپورت می‌شود
export default function App() {
  return <AppContent />;
}