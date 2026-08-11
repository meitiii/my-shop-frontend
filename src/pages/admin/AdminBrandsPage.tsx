// src/pages/admin/AdminBrandsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { api } from '../../services/api';

// اسکیما برای اعتبارسنجی (عکس رو جداگونه هندل می‌کنیم چون فایل هست)
const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  slug: z.string().min(1, 'Slug is required'),
});

type BrandFormData = z.infer<typeof brandSchema>;

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
  });

  // 1. دریافت لیست برندها
  const { data: brands, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const res = await api.get('/brands/'); // مسیر API جنگو رو چک کن که درست باشه
      return res.data.results || res.data;
    }
  });

  // 2. ساخت یا آپدیت برند (چون عکس داریم باید از FormData استفاده کنیم)
  const saveMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('slug', data.slug);
      
      // اگر عکس جدیدی انتخاب شده بود، به فرم اضافه کن
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      if (editingId) {
        return await api.patch(`/brands/${editingId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        return await api.post('/brands/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      closeForm();
    },
    onError: (err: any) => alert(err.response?.data?.slug?.[0] || 'Failed to save brand')
  });

  // 3. حذف برند
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/brands/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-brands'] }),
  });

  const onSubmit = (data: BrandFormData) => saveMutation.mutate(data);

  const handleEdit = (brand: any) => {
    setEditingId(brand.id);
    setValue('name', brand.name);
    setValue('slug', brand.slug);
    setSelectedFile(null); // عکس قبلی رو که از سرور میاد فعلا کاریش نداریم، مگه اینکه بخواد عوض کنه
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setSelectedFile(null);
    reset();
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading brands...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Manage Brands</h1>
          <p className="text-gray-500 mt-1">Add or edit product brands and logos.</p>
        </div>
        
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Add Brand
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* فرم اضافه/ویرایش (سمت چپ) */}
        {isFormOpen && (
          <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Brand' : 'New Brand'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input 
                  {...register('name')} 
                  onChange={(e) => {
                    // اتوماتیک اسلاگ رو بر اساس اسم میسازه (فقط برای راحتی کاربر)
                    if (!editingId) {
                       setValue('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL friendly)</label>
                <input 
                  {...register('slug')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Logo (Optional)</label>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                     {selectedFile ? (
                       <img src={URL.createObjectURL(selectedFile)} alt="preview" className="h-full w-full object-contain p-1" />
                     ) : (
                       <ImageIcon className="text-gray-400" size={24} />
                     )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saveMutation.isPending}
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 mt-4"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Brand'}
              </button>
            </form>
          </div>
        )}

        {/* جدول برندها (سمت راست) */}
        <div className={`${isFormOpen ? 'w-full md:w-2/3' : 'w-full'} bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
          {brands && brands.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Logo & Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brands.map((brand: any) => (
                  <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden p-1">
                          {brand.image ? (
                            <img src={brand.image} alt={brand.name} className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-gray-400 text-xs font-bold">{brand.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-bold text-gray-900">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      /{brand.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <button onClick={() => handleEdit(brand)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-2"><Edit2 size={16} /></button>
                       <button onClick={() => { if(window.confirm('Delete this brand?')) deleteMutation.mutate(brand.id) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div className="text-center py-12 text-gray-500">No brands found. Add your first brand.</div>
          )}
        </div>

      </div>
    </div>
  );
}