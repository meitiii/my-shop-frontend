// src/pages/admin/AdminProductForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';

// تایپِ فیلدهای فرم
interface ProductFormData {
  name: string;
    slug: string;
    sku: string;
    brand: string;
    category_id: number;
    short_description: string;
    description: string;
    is_active: boolean;
}

export default function AdminProductForm() {
  const { id } = useParams(); // اگه آیدی باشه یعنی تو حالت "ویرایش" هستیم
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
} = useForm<ProductFormData>({
    defaultValues: {
        is_active: true,
    },
});

  // دریافت لیست دسته‌بندی‌ها برای Dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories/');
      return response.data.results || response.data;
    },
  });

  // اگر تو حالت ویرایش هستیم، دیتای محصول رو بگیر و فرم رو پر کن
  const { isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}/`);
      const data = response.data;
      // پر کردن خودکار فرم
      reset({
    name: data.name,
    slug: data.slug,
    sku: data.sku,
    brand: data.brand,
    category_id: data.category?.id || '',
    short_description: data.short_description,
    description: data.description,
    is_active: data.is_active,
});
      return data;
    },
    enabled: isEditMode, // فقط وقتی آیدی داریم این ریکوئست رو بزن
  });

  // ذخیره محصول (چه جدید، چه ویرایش)
  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (isEditMode) {
        return await api.patch(`/products/${id}/`, data); // آپدیت
      } else {
        return await api.post('/products/', data); // ایجاد جدید
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      alert('Product saved successfully!');
      
      // اگر محصول جدید ساخته شد، بفرستش به صفحه ویرایش همون محصول تا بتونه عکس و واریانت اضافه کنه
      if (!isEditMode) {
        navigate(`/admin/products/edit/${response.data.id}`);
      }
    },
    onError: (error: any) => {
      console.error(error.response?.data);
      alert('Failed to save product. Check the console.');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    console.log("PRODUCT DATA:", data);

    saveMutation.mutate(data);
  };

  // قابلیت تولید خودکار Slug از روی نام محصول
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    if (!isEditMode) { // فقط در زمان ایجاد، اسلاگ رو اتوماتیک بساز
      const generatedSlug = name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
      setValue('slug', generatedSlug);
    }
  };

  if (isEditMode && isLoadingProduct) return <div className="p-8">Loading product details...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Product' : 'Create New Product'}</h1>
        <button onClick={() => navigate('/admin/products')} className="text-gray-500 hover:text-gray-800">
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              {...register('name')}
              onChange={handleNameChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <input
              {...register('slug')}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
    {...register('category_id', { valueAsNumber: true })}
    required
    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
>
              <option value="">Select Category...</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              {...register('brand')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
            <input
              {...register('sku')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              {...register('is_active')}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <label className="ml-2 font-medium text-gray-700">Active (Visible in store)</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <textarea
            {...register('short_description')}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
          <textarea
            {...register('description')}
            rows={5}
            className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>

      {/* بخش تنوع‌ها و عکس‌ها فقط در حالت ویرایش نمایش داده می‌شود */}
      {isEditMode && (
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Product Images & Variants</h2>
          <p className="text-gray-600">
            Product details saved. Now you can upload WebP images and add variants (sizes/colors).
          </p>
          {/* بعداً کامپوننت‌های این بخش رو اینجا قرار می‌دیم */}
        </div>
      )}
    </div>
  );
}