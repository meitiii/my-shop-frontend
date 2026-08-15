// src/components/Header.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  User,
  ShoppingCart,
  LogOut,
  Package,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

// تعریف تایپ‌های دسته‌بندی
interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  subcategories: Category[];
}

export default function Header() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // استخراج اطلاعات Auth از استور
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  const navigate = useNavigate();
  const isAuthenticated = !!accessToken;

  // دریافت دسته‌بندی‌ها از API
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-header'],
    queryFn: async () => {
      const response = await api.get('/categories/');
      return response.data.results || response.data;
    },
  });

  // فیلتر کردن دسته‌های اصلی
  const rootCategories = categories.filter(
    (cat: Category) => !cat.parent
  );

  // پیدا کردن دسته فعال
  const activeCategory =
    rootCategories.find(
      (cat: Category) => cat.id === activeCategoryId
    ) || rootCategories[0];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 relative z-50">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-20">

          {/* =========================================
              لوگو و مگامنو
          ========================================= */}

          <div className="flex items-center gap-8">

            <Link
              to="/"
              className="text-3xl font-black text-blue-600 tracking-tighter"
            >
              MyShop<span className="text-yellow-500">.</span>
            </Link>

            {/* کانتینر مگامنو */}
            <div
              className="hidden md:block h-20"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >

              <button
                className="flex items-center gap-2 h-full text-gray-700 font-semibold hover:text-blue-600 transition-colors"
              >
                <Menu size={20} />
                Categories
              </button>

              {/* =========================================
                  مگامنو
              ========================================= */}

              {isMegaMenuOpen && rootCategories.length > 0 && (

                <div
                  className="
                    absolute
                    top-20
                    left-0
                    w-full
                    h-[450px]
                    bg-white
                    shadow-2xl
                    border-t
                    border-gray-100
                    flex
                    z-[60]
                    animate-in
                    fade-in
                    slide-in-from-top-2
                    duration-200
                  "
                >

                  {/* =========================================
                      ستون سمت چپ: دسته‌های اصلی
                  ========================================= */}

                  <div className="w-1/4 bg-gray-50 border-r border-gray-100 py-4 overflow-y-auto">

                    {rootCategories.map((cat: Category) => (

                      <div
                        key={cat.id}
                        onMouseEnter={() =>
                          setActiveCategoryId(cat.id)
                        }
                        className={`
                          flex
                          items-center
                          justify-between
                          px-6
                          py-3
                          cursor-pointer
                          transition-colors
                          ${
                            activeCategory?.id === cat.id
                              ? 'bg-white text-blue-600 font-bold border-l-4 border-blue-600 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                          }
                        `}
                      >

                        <span>{cat.name}</span>

                        {cat.subcategories &&
                          cat.subcategories.length > 0 && (

                            <ChevronRight
                              size={16}
                              className={
                                activeCategory?.id === cat.id
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }
                            />

                          )}

                      </div>

                    ))}

                  </div>

                  {/* =========================================
                      ستون سمت راست: زیردسته‌ها
                  ========================================= */}

                  <div className="w-3/4 p-8 overflow-y-auto bg-white">

                    {activeCategory && (

                      <div>

                        <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                          All in {activeCategory.name}
                        </h3>

                        {activeCategory.subcategories &&
                        activeCategory.subcategories.length > 0 ? (

                          <div className="grid grid-cols-3 gap-x-8 gap-y-6">

                            {activeCategory.subcategories.map(
                              (sub: Category) => (

                                <div
                                  key={sub.id}
                                  className="flex flex-col gap-3"
                                >

                                  {/* لینک زیردسته */}

                                  <Link
                                    to={`/?category=${sub.id}`}
                                    className="
                                      font-bold
                                      text-gray-800
                                      hover:text-blue-600
                                      border-l-2
                                      border-transparent
                                      hover:border-blue-600
                                      pl-2
                                      transition-all
                                    "
                                    onClick={() =>
                                      setIsMegaMenuOpen(false)
                                    }
                                  >
                                    {sub.name}
                                  </Link>

                                  {/* سطح سوم */}

                                  {sub.subcategories &&
                                    sub.subcategories.length > 0 && (

                                      <ul className="flex flex-col gap-2 pl-2">

                                        {sub.subcategories.map(
                                          (subSub: Category) => (

                                            <li key={subSub.id}>

                                              <Link
                                                to={`/?category=${subSub.id}`}
                                                className="
                                                  text-sm
                                                  text-gray-500
                                                  hover:text-blue-600
                                                  transition-colors
                                                "
                                                onClick={() =>
                                                  setIsMegaMenuOpen(false)
                                                }
                                              >
                                                {subSub.name}
                                              </Link>

                                            </li>

                                          )
                                        )}

                                      </ul>

                                    )}

                                </div>

                              )
                            )}

                          </div>

                        ) : (

                          <p className="text-gray-500">
                            No subcategories found.
                          </p>

                        )}

                      </div>

                    )}

                  </div>

                </div>

              )}

            </div>

          </div>

          {/* =========================================
              بخش کاربر
          ========================================= */}

          <div className="flex items-center gap-4">

            {isAuthenticated ? (

              <>

                {/* Orders */}

                <Link
                  to="/orders"
                  className="
                    hidden
                    md:flex
                    items-center
                    gap-1.5
                    text-gray-600
                    hover:text-blue-600
                    font-medium
                    px-2
                    py-2
                    rounded-lg
                    hover:bg-blue-50
                    transition-colors
                  "
                >
                  <Package size={20} />
                  <span>Orders</span>
                </Link>

                {/* Cart */}

                <Link
                  to="/cart"
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-gray-600
                    hover:text-blue-600
                    font-medium
                    px-2
                    py-2
                    rounded-lg
                    hover:bg-blue-50
                    transition-colors
                    relative
                  "
                >
                  <ShoppingCart size={20} />
                  <span>Cart</span>

                  {/* نقطه قرمز تستی */}

                  <span className="
                    absolute
                    top-1
                    left-5
                    w-2
                    h-2
                    bg-red-500
                    rounded-full
                  " />

                </Link>

                <div className="h-6 w-px bg-gray-200 mx-1" />

                {/* Profile */}

                <Link
                  to="/profile"
                  className="
                    flex
                    items-center
                    gap-2
                    text-gray-700
                    hover:text-blue-600
                    font-bold
                    px-3
                    py-2
                    rounded-lg
                    hover:bg-gray-50
                    transition-colors
                  "
                >

                  <div className="
                    w-8
                    h-8
                    bg-blue-100
                    text-blue-600
                    rounded-full
                    flex
                    items-center
                    justify-center
                  ">
                    <User size={18} />
                  </div>

                  <span className="hidden sm:block">
                    Profile
                  </span>

                </Link>

                {/* Logout */}

                <button
                  onClick={handleLogout}
                  className="
                    p-2
                    text-red-500
                    hover:bg-red-50
                    rounded-lg
                    transition-colors
                  "
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>

              </>

            ) : (

              <>

                <Link
                  to="/login"
                  className="
                    px-5
                    py-2
                    text-blue-600
                    font-bold
                    hover:bg-blue-50
                    rounded-lg
                    transition-colors
                  "
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="
                    px-5
                    py-2
                    bg-blue-600
                    text-white
                    font-bold
                    rounded-lg
                    hover:bg-blue-700
                    shadow-sm
                    shadow-blue-200
                    transition-colors
                  "
                >
                  Sign Up
                </Link>

              </>

            )}

          </div>

        </div>

      </div>

      {/* =========================================
          بک‌دراپ
      ========================================= */}

      {isMegaMenuOpen && (

        <div
          className="
            fixed
            inset-0
            top-[80px]
            bg-black/40
            backdrop-blur-sm
            z-40
          "
        />

      )}

    </header>
  );
}