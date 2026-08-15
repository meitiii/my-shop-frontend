// src/components/Footer.tsx
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Truck,
  ShieldCheck,
  Headphones,
  RefreshCw
} from 'lucide-react';

import {
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter
} from 'react-icons/fa6';
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* =========================================
            1. Trust Features (نوار ویژگی‌های اعتماد)
        ========================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-200 mb-12">
          <div className="flex flex-col items-center text-center gap-3 group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Truck size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Fast Delivery</h4>
              <p className="text-sm text-gray-500">Free shipping on orders over $100</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center gap-3 group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Original Products</h4>
              <p className="text-sm text-gray-500">100% guarantee of authenticity</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3 group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <RefreshCw size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">7 Days Return</h4>
              <p className="text-sm text-gray-500">No questions asked return policy</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3 group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Headphones size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">24/7 Support</h4>
              <p className="text-sm text-gray-500">Dedicated support via phone & chat</p>
            </div>
          </div>
        </div>

        {/* =========================================
            2. Main Links & Newsletter (بخش لینک‌ها)
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Customer Service */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Customer Service</h3>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-gray-500 hover:text-blue-600 transition-colors">FAQ</Link></li>
              <li><Link to="/returns" className="text-gray-500 hover:text-blue-600 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/privacy" className="text-gray-500 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-500 hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/report-bug" className="text-gray-500 hover:text-blue-600 transition-colors">Report a Bug</Link></li>
            </ul>
          </div>

          {/* Shopping Guide */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Shopping Guide</h3>
            <ul className="space-y-3">
              <li><Link to="/how-to-buy" className="text-gray-500 hover:text-blue-600 transition-colors">How to Place an Order</Link></li>
              <li><Link to="/shipping" className="text-gray-500 hover:text-blue-600 transition-colors">Shipping Methods</Link></li>
              <li><Link to="/payment" className="text-gray-500 hover:text-blue-600 transition-colors">Payment Methods</Link></li>
              <li><Link to="/gift-cards" className="text-gray-500 hover:text-blue-600 transition-colors">Gift Cards</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-500">
                <Phone size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-700">021 - 9100 0100</p>
                  <p className="text-sm">24/7 Support Center</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-gray-500">
                <Mail size={20} className="text-blue-600" />
                <a href="mailto:support@mystore.com" className="hover:text-blue-600">support@mystore.com</a>
              </li>
              <li className="flex items-start gap-3 text-gray-500">
                <MapPin size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">123 Tech Avenue, Innovation District, City Center</span>
              </li>
            </ul>
          </div>

          {/* Newsletter & Socials */}
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Stay with us!</h3>
            <p className="text-gray-500 text-sm mb-4">Subscribe to our newsletter for the latest discounts and news.</p>
            <form className="flex gap-2 mb-6">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                <Send size={18} />
              </button>
            </form>

            <div className="flex gap-4">
  <a
    href="#"
    className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
  >
    <FaInstagram size={20} />
  </a>

  <a
    href="#"
    className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
  >
    <FaXTwitter size={20} />
  </a>

  <a
    href="#"
    className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
  >
    <FaLinkedinIn size={20} />
  </a>
</div>
          </div>

        </div>

        {/* =========================================
            3. SEO Text & Trust Badges (بخش سئو)
        ========================================= */}
        <div className="flex flex-col md:flex-row items-center justify-between py-8 border-t border-b border-gray-200 mb-8 gap-8">
          <div className="md:w-2/3">
            <h2 className="text-xl font-bold text-gray-900 mb-3">MyStore: The Ultimate Online Shopping Experience</h2>
            <p className="text-sm text-gray-500 leading-relaxed text-justify">
              Just like the top global e-commerce platforms, MyStore has become the first choice for many online shoppers. Offering an unparalleled variety of products across multiple categories—from the latest smartphones like iPhone and Samsung, to high-performance laptops, fashion, and everyday essentials. We guarantee original products, fast shipping, and 24/7 customer support. Experience a new standard of online shopping where everything you need is just a click away.
            </p>
          </div>
          
          <div className="md:w-1/3 flex justify-center md:justify-end gap-4">
            {/* جایگاه نماد اعتماد الکترونیک (ای‌نماد) و درگاه‌ها */}
            <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 text-center p-2">
              Trust Badge 1
            </div>
            <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 text-center p-2">
              Trust Badge 2
            </div>
          </div>
        </div>

        {/* =========================================
            4. Copyright (کپی‌رایت)
        ========================================= */}
        <div className="text-center text-sm text-gray-500">
          <p>For non-commercial purposes, mentioning the source is sufficient. All rights reserved for MyStore © {new Date().getFullYear()}</p>
        </div>

      </div>
    </footer>
  );
}