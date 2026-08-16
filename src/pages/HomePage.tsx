// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Zap } from 'lucide-react';
import HeroSlider from '../components/HeroSlider';

export default function HomePage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      
      {/* =========================================
          ۱. اسلایدر اصلی سایت
      ========================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <HeroSlider />
      </div>

      {/* =========================================
          ۲. دسترسی سریع (میانبرها)
      ========================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/category/mobile" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={28} />
            </div>
            <span className="font-bold text-gray-700">Digital Goods</span>
          </Link>
          
          <Link to="/category/laptop" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={28} />
            </div>
            <span className="font-bold text-gray-700">Laptops</span>
          </Link>

          <Link to="/search" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star size={28} />
            </div>
            <span className="font-bold text-gray-700">Best Sellers</span>
          </Link>

          <Link to="/search?ordering=-created_at" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:shadow-md transition-shadow group">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag size={28} />
            </div>
            <span className="font-bold text-gray-700">New Arrivals</span>
          </Link>
        </div>
      </div>

      {/* =========================================
          ۳. جایگاه اسلایدر پیشنهاد شگفت‌انگیز (فاز بعدی)
      ========================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-red-500 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between text-white shadow-lg">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-3xl font-black mb-2">Amazing Offers</h2>
            <p className="text-red-100">Up to 70% discount on selected items</p>
            <Link to="/search" className="inline-block mt-4 px-6 py-2 bg-white text-red-600 font-bold rounded-full hover:bg-gray-50 transition-colors">
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto w-full md:w-2/3 hide-scrollbar pb-4">
            {/* اینجا بعداً کارت‌های افقی محصولات تخفیف‌دار قرار می‌گیره */}
            <div className="min-w-[200px] h-[250px] bg-white/10 rounded-2xl border border-white/20 animate-pulse flex items-center justify-center">
              Product Card
            </div>
            <div className="min-w-[200px] h-[250px] bg-white/10 rounded-2xl border border-white/20 animate-pulse flex items-center justify-center">
              Product Card
            </div>
            <div className="min-w-[200px] h-[250px] bg-white/10 rounded-2xl border border-white/20 animate-pulse flex items-center justify-center hidden sm:flex">
              Product Card
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}