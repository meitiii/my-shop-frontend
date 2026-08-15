// src/components/HeroSlider.tsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

// تعریف تایپ برای اسلایدرهایی که از بک‌اند میان
interface SliderData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  button_text: string;
  button_link: string;
}

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // دریافت اطلاعات اسلایدر از API بک‌اند
  const { data: slides, isLoading } = useQuery({
    queryKey: ['hero-sliders'],
    queryFn: async () => {
      // آدرس API خودت رو اینجا چک کن (مثلا /products/sliders/ یا /sliders/)
      const res = await api.get('/sliders/'); 
      return res.data.results || res.data;
    }
  });

  // منطق چرخش خودکار
  useEffect(() => {
    if (isPaused || !slides || slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, slides]);

  const nextSlide = () => {
    if (!slides) return;
    setCurrent(current === slides.length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    if (!slides) return;
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  // حالت لودینگ
  if (isLoading) {
    return <div className="w-full h-[350px] sm:h-[450px] lg:h-[500px] bg-gray-200 animate-pulse rounded-3xl"></div>;
  }

  // اگر اسلایدری در دیتابیس نبود، چیزی نشون نده
  if (!slides || slides.length === 0) {
    return null; 
  }

  return (
    <div 
      className="relative w-full h-[350px] sm:h-[450px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide: SliderData, index: number) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* عکس پس‌زمینه که از دیتابیس میاد */}
          <img 
            src={slide.image} 
            alt={slide.title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>

          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3 lg:w-1/2">
            {slide.subtitle && (
              <span className="text-blue-400 font-bold tracking-widest uppercase text-xs md:text-sm mb-2 transform translate-y-0 opacity-100 transition-all duration-700 delay-100">
                {slide.subtitle}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
              {slide.title}
            </h2>
            {slide.description && (
              <p className="text-gray-200 text-sm md:text-base lg:text-lg mb-8 max-w-lg line-clamp-3">
                {slide.description}
              </p>
            )}
            <div>
              <Link 
                to={slide.button_link || '/'}
                className="inline-block bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-300 shadow-lg"
              >
                {slide.button_text || 'Shop Now'}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* اگر فقط یک عکس بود، دکمه‌های چپ و راست رو مخفی کن */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {slides.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`transition-all duration-500 rounded-full ${
                  index === current 
                    ? 'w-10 h-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}