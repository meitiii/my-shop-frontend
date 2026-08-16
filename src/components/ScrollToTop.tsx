// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // هر بار که مسیر (pathname) تغییر کرد، اسکرول رو می‌بره بالای صفحه
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // اگر می‌خوای درجا بره بالا، این رو بردار
    });
  }, [pathname]);

  return null; // این کامپوننت هیچ ظاهر گرافیکی نداره
}