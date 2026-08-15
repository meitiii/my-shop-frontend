// src/pages/admin/AdminSlidersPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../services/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface SliderFormData {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  order: number;
  is_active: boolean;
  image?: FileList; // برای آپلود فایل
}

export default function AdminSlidersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<SliderFormData>({
    defaultValues: { is_active: true, order: 0, button_text: 'Shop Now', button_link: '/' }
  });

  // دریافت لیست اسلایدرها
  const { data: sliders, isLoading } = useQuery({
    queryKey: ['admin-sliders'],
    queryFn: async () => {
      const res = await api.get('/sliders/'); // مسیر API خودت رو چک کن
      return res.data.results || res.data;
    }
  });

  // حذف اسلایدر
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/sliders/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sliders'] });
      queryClient.invalidateQueries({ queryKey: ['hero-sliders'] }); // آپدیت صفحه هوم
    }
  });

  // ذخیره (ایجاد یا ویرایش) اسلایدر
  const saveMutation = useMutation({
    mutationFn: async (data: SliderFormData) => {
      // چون فایل داریم، باید از FormData استفاده کنیم
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('subtitle', data.subtitle || '');
      formData.append('description', data.description || '');
      formData.append('button_text', data.button_text || '');
      formData.append('button_link', data.button_link || '');
      formData.append('order', String(data.order));
      formData.append('is_active', String(data.is_active));

      if (data.image && data.image.length > 0) {
        formData.append('image', data.image[0]);
      }

      if (editingId) {
        return await api.patch(`/sliders/${editingId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        return await api.post('/sliders/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sliders'] });
      queryClient.invalidateQueries({ queryKey: ['hero-sliders'] }); // آپدیت صفحه هوم
      closeModal();
    }
  });

  const onSubmit = (data: SliderFormData) => {
    saveMutation.mutate(data);
  };

  const openEditModal = (slider: any) => {
    setEditingId(slider.id);
    reset({
      title: slider.title,
      subtitle: slider.subtitle,
      description: slider.description,
      button_text: slider.button_text,
      button_link: slider.button_link,
      order: slider.order,
      is_active: slider.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset({ title: '', subtitle: '', description: '', button_text: 'Shop Now', button_link: '/', order: 0, is_active: true });
  };

  if (isLoading) return <div className="p-8">Loading sliders...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Hero Sliders</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Add New Banner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Image</th>
              <th className="p-4 font-semibold text-gray-600">Title</th>
              <th className="p-4 font-semibold text-gray-600">Order</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sliders?.map((slider: any) => (
              <tr key={slider.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <img src={slider.image} alt={slider.title} className="w-24 h-12 object-cover rounded-lg shadow-sm" />
                </td>
                <td className="p-4 font-bold text-gray-800">
                  {slider.title}
                  <div className="text-xs text-gray-500 font-normal mt-1">{slider.subtitle}</div>
                </td>
                <td className="p-4 text-gray-600">{slider.order}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${slider.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {slider.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="p-4 flex justify-end gap-3">
                  <button onClick={() => openEditModal(slider)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg"><Edit size={18} /></button>
                  <button onClick={() => { if(window.confirm('Delete this banner?')) deleteMutation.mutate(slider.id) }} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {(!sliders || sliders.length === 0) && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No sliders found. Create one!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal برای فرم */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Banner' : 'Create New Banner'}</h2>
              <button onClick={closeModal} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Background Image {!editingId && '*'}</label>
                  <input type="file" accept="image/*" {...register('image', { required: !editingId })} className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Main Title *</label>
                  <input {...register('title', { required: true })} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Subtitle (Small text above)</label>
                  <input {...register('subtitle')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description (Text below title)</label>
                  <textarea {...register('description')} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Button Text</label>
                  <input {...register('button_text')} placeholder="e.g. Shop Now" className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Button Link</label>
                  <input {...register('button_link')} placeholder="e.g. /product/12" className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Display Order</label>
                  <input type="number" {...register('order')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex items-center pt-6">
                  <input type="checkbox" {...register('is_active')} id="is_active" className="w-5 h-5 text-blue-600 rounded border-gray-300" />
                  <label htmlFor="is_active" className="ml-2 font-bold text-gray-700">Active (Visible on homepage)</label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t mt-6">
                <button type="button" onClick={closeModal} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2 font-bold">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  {saveMutation.isPending ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}