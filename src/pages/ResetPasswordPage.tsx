// src/pages/ResetPasswordPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';

const resetSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  new_password_confirm: z.string()
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords do not match",
  path: ["new_password_confirm"],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string, token: string }>();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ResetFormData) => {
      const response = await api.post('/users/password-reset-confirm/', {
        uidb64: uid,
        token: token,
        new_password: data.new_password
      });
      return response.data;
    },
    onSuccess: () => setIsSuccess(true),
    onError: (error: any) => alert(error.response?.data?.error || "Link is invalid or expired."),
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Lock size={24} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
        
        {isSuccess ? (
          <div className="text-center mt-6">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold text-xl mb-2">Password Updated!</h3>
            <p className="text-gray-500 mb-6">Your password has been changed successfully.</p>
            <Link to="/login" className="block w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">Must be at least 8 characters long.</p>
            <form onSubmit={handleSubmit((data) => resetMutation.mutate(data))} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  {...register('new_password')}
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
                {errors.new_password && <p className="text-red-500 text-sm mt-1">{errors.new_password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  {...register('new_password_confirm')}
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
                {errors.new_password_confirm && <p className="text-red-500 text-sm mt-1">{errors.new_password_confirm.message}</p>}
              </div>

              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 mt-4"
              >
                {resetMutation.isPending ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}