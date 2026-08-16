// src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ScrollToTop from './components/ScrollToTop';
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
import SearchPage from './pages/SearchPage';
import Footer from './components/Footer'; 
import Header from './components/Header'; 
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/dashboard');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ScrollToTop />
      {/* هدر جدید با مگامنو - فقط در صفحات غیر ادمین نمایش داده می‌شود */}
      {!isAdminRoute && <Header />}

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payment/verify" element={<PaymentVerifyPage />} />
           <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:slug" element={<SearchPage />} /> {/* 👈 این خط اضافه شد */}
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