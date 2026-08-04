// src/pages/RegisterPage.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

// ۱. تعریف اسکیما با ۳ فیلد + اعتبارسنجی تطابق پسوردها
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // ارور رو به فیلد تایید پسورد وصل میکنه
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // ۲. ارسال ریکوئست ثبت‌نام به جنگو
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // بک‌اند فقط ایمیل و پسورد رو نیاز داره، confirmPassword رو نمیفرستیم
      const payload = {
        email: data.email,
        password: data.password,
      };
      const response = await api.post('/users/register/', payload); // مسیر API خودت رو چک کن. من فرض کردم /users/register/ هست
      return response.data;
    },
    onSuccess: () => {
      alert("Registration successful! Please login.");
      // هدایت به صفحه لاگین
      navigate('/login');
    },
    onError: (error: any) => {
      // نمایش ارورهای برگشتی از جنگو (مثلا اگر ایمیل تکراری باشه)
      const errorMessage = error.response?.data?.email?.[0] || 
                           error.response?.data?.error || 
                           "An error occurred during registration.";
      alert(errorMessage);
    }
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Create an Account</h2>
        
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
              placeholder="Min 6 characters"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {registerMutation.isPending ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;