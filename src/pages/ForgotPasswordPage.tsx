// src/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ForgotFormData) => {
      const response = await api.post('/users/password-reset/', data);
      return response.data;
    },
    onSuccess: () => setIsSuccess(true),
    onError: () => alert("An error occurred. Please try again."),
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <KeyRound size={24} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
        
        {isSuccess ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 mt-6 text-center">
            <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-green-800 font-bold mb-1">Check your email</h3>
            <p className="text-green-600 text-sm">We've sent password reset instructions to your email address.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit((data) => resetMutation.mutate(data))} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                    errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {resetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}