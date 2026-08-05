// src/pages/ProfilePage.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// ۱. تعریف اسکیما برای اعتبارسنجی
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  // معمولا یوزرنیم و ایمیل رو تو پروفایل فقط‌خواندنی (Read-only) میذارن یا مسیر جدا دارن، ولی اگر بک‌اندت اجازه میده میتونی اینجا بذاری
});

type ProfileFormData = z.infer<typeof profileSchema>;

// توابع ارتباط با بک‌اند
const fetchProfile = async () => {
  const response = await api.get('/users/profile/');
  return response.data;
};

const updateProfile = async (data: ProfileFormData) => {
  const response = await api.patch('/users/profile/', data); // از PATCH استفاده میکنیم تا فقط فیلدهای تغییر یافته آپدیت بشن
  return response.data;
};

function ProfilePage() {
  const queryClient = useQueryClient();

  // ۲. گرفتن اطلاعات پروفایل
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  // ۳. تنظیمات فرم
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }, // isDirty یعنی آیا کاربر چیزی رو تغییر داده یا نه
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // پر کردن فرم به محض اینکه دیتای پروفایل از سرور رسید
  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      });
    }
  }, [profile, reset]);

  // ۴. ارسال تغییرات به سرور
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      alert("Profile updated successfully!");
      // رفرش کردن دیتای پروفایل تو کش ریکت‌کوئری
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => {
      alert("Failed to update profile. Please try again.");
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8 text-center text-xl">Loading profile... ⏳</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load profile. Please login.</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-[80vh]">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">My Profile</h1>

        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Account details</p>
          <p className="font-semibold text-gray-800">Email: {profile?.email}</p>
          <p className="font-semibold text-gray-800">Username: {profile?.username}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                {...register('first_name')}
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  errors.first_name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                {...register('last_name')}
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  errors.last_name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={!isDirty || updateMutation.isPending} // دکمه فقط وقتی فعاله که فرم تغییر کرده باشه
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;