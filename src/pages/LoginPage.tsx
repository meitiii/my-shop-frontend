// src/pages/LoginPage.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // 👈 useQueryClient اضافه شد
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore'; // 👈 استور سبد خرید اضافه شد
import { useNavigate, Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const setTokens = useAuthStore((state) => state.setTokens); 
  const { localItems, clearCart } = useCartStore(); // 👈 استخراج دیتای مرورگر و تابع پاکسازی
  const queryClient = useQueryClient(); // 👈 برای رفرش کردن دیتای ریکت‌کوئری
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post('/token/', data); 
      return response.data;
    },
    onSuccess: async (data) => {
      // ۱. ذخیره توکن‌ها
      setTokens(
        data.access,
        data.refresh,
        data.is_staff
      );

      // ۲. 👈 سینک کردن سبد خرید مهمان با دیتابیس بک‌اند
      if (localItems.length > 0) {
  try {
    await api.post('/cart/items/sync/', {
      items: localItems
    });

    // فقط اگر sync موفق بود localStorage را پاک کن
    clearCart();

    // دوباره سبد خرید سرور را بگیر
    await queryClient.invalidateQueries({
      queryKey: ['cart']
    });

  } catch (error) {
    console.error('Failed to sync cart:', error);
  }
}

      // ۳. هدایت کاربر به سبد خرید تا محصولات منتقل‌شده‌اش رو ببینه
      navigate('/cart');
    },
    onError: (error: any) => {
      if (error.response?.status === 401) {
          alert("Invalid email or password.");
      } else {
          alert("An error occurred during login.");
      }
    }
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Welcome Back</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
                Forgot your password?
              </Link>
            </div>
          </div>
              
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;