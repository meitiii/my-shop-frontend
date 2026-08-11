// src/pages/RegisterPage.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const payload = {
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
      };
      const response = await api.post('/users/register/', payload);
      return response.data;
    },
    onSuccess: () => {
      alert("Registration successful! Please login.");
      navigate('/login');
    },
    onError: (error: any) => {
      const responseData = error.response?.data;
      const errorMessage = responseData?.username?.[0] ||
                           responseData?.email?.[0] ||
                           responseData?.password?.[0] ||
                           responseData?.error ||
                           "An error occurred during registration.";
      alert(errorMessage);
    }
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 p-4 my-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
          <UserPlus size={24} />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Create an Account</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              {...register('username')}
              type="text"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-colors outline-none ${
                errors.username ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="johndoe"
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                {...register('first_name')}
                type="text"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-colors outline-none ${
                  errors.first_name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                placeholder="John"
              />
              {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                {...register('last_name')}
                type="text"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-colors outline-none ${
                  errors.last_name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
                placeholder="Doe"
              />
              {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-colors outline-none ${
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
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-colors outline-none ${
                errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="Min 8 characters"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-colors outline-none ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 mt-4 shadow-sm"
          >
            {registerMutation.isPending ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}