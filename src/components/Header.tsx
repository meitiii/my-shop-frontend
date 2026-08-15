import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Menu,
  User,
  ShoppingCart,
  LogOut,
  Package,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

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

  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  const navigate = useNavigate();
  const isAuthenticated = !!accessToken;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-header'],
    queryFn: async () => {
      const response = await api.get('/categories/');
      return response.data.results || response.data;
    },
  });

  const rootCategories = categories.filter(
    (cat: Category) => !cat.parent
  );

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

          {/* Logo + Mega Menu */}
          <div className="flex items-center gap-8">

            <Link
              to="/"
              className="text-3xl font-black text-blue-600 tracking-tighter"
            >
              MyShop<span className="text-yellow-500">.</span>
            </Link>

            {/* Mega Menu Container */}
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

              {/* Mega Menu */}
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
                  {/* Left Column */}
                  <div className="w-1/4 bg-gray-50 border-r border-gray-100 py-4 overflow-y-auto">
                    {rootCategories.map((cat: Category) => (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setActiveCategoryId(cat.id)}
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

                  {/* Right Column */}
                  <div className="w-3/4 p-8 overflow-y-auto bg-white">
                    {activeCategory && (
                      <div>

                        {/* Category Header */}
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                          <h3 className="text-xl font-black text-gray-900">
                            {activeCategory.name}
                          </h3>

                          <Link
                            to={`/category/${activeCategory.slug}`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors group"
                            onClick={() => setIsMegaMenuOpen(false)}
                          >
                            View all {activeCategory.name}
                            <ChevronRight
                              size={16}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </Link>
                        </div>

                        {/* Subcategories */}
                        {activeCategory.subcategories &&
                        activeCategory.subcategories.length > 0 ? (
                          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
                            {activeCategory.subcategories.map(
                              (sub: Category) => (
                                <div
                                  key={sub.id}
                                  className="break-inside-avoid flex flex-col gap-3"
                                >
                                  {/* Level 2 */}
                                  <Link
                                    to={`/category/${sub.slug}`}
                                    className="flex items-center font-black text-gray-900 hover:text-blue-600 transition-colors group"
                                    onClick={() =>
                                      setIsMegaMenuOpen(false)
                                    }
                                  >
                                    <div className="w-1 h-4 bg-red-500 mr-2 rounded-sm" />

                                    {sub.name}

                                    <ChevronRight
                                      size={16}
                                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
                                    />
                                  </Link>

                                  {/* Level 3 */}
                                  {sub.subcategories &&
                                    sub.subcategories.length > 0 && (
                                      <ul className="flex flex-col gap-3 pl-3">
                                        {sub.subcategories.map(
                                          (subSub: Category) => (
                                            <li key={subSub.id}>
                                              <Link
                                                to={`/category/${subSub.slug}`}
                                                className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
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
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Package
                              size={48}
                              className="mb-4 opacity-20"
                            />
                            <p>No subcategories found.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Section */}
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

                  <span
                    className="
                      absolute
                      top-1
                      left-5
                      w-2
                      h-2
                      bg-red-500
                      rounded-full
                    "
                  />
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
                  <div
                    className="
                      w-8
                      h-8
                      bg-blue-100
                      text-blue-600
                      rounded-full
                      flex
                      items-center
                      justify-center
                    "
                  >
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
                {/* Login */}
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

                {/* Sign Up */}
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

      {/* Backdrop */}
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