// src/pages/admin/AdminCategoriesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, FolderTree, CornerDownRight } from 'lucide-react';
import { api } from '../../services/api';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  parent: z.string().optional().nullable(), // آیدیِ دسته‌بندی پدر (اگر داشته باشه)
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  // ۱. دریافت تمام دسته‌بندی‌ها
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/categories/');
      return res.data.results || res.data;
    }
  });

  // فیلتر کردن دسته‌هایی که "پدر" هستند (یعنی خودشون زیرمجموعه کسی نیستند)
  const rootCategories = categories?.filter((cat: any) => !cat.parent) || [];

  // ۲. ساخت یا آپدیت دسته‌بندی
  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('slug', data.slug);
      
      // اگر parent انتخاب شده بود (خالی نبود)، اضافه کن
      if (data.parent) {
        formData.append('parent', data.parent);
      } else {
        // برای اینکه به سرور بفهمونیم این دسته اصلیه و parent نداره
        formData.append('parent', ''); 
      }
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      if (editingId) {
        return await api.patch(`/categories/${editingId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        return await api.post('/categories/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeForm();
    },
    onError: (err: any) => alert(err.response?.data?.slug?.[0] || 'Failed to save category')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/categories/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
    onError: () => alert('Cannot delete this category. It might have products or subcategories attached.')
  });

  const onSubmit = (data: CategoryFormData) => saveMutation.mutate(data);

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setValue('name', category.name);
    setValue('slug', category.slug);
    setValue('parent', category.parent ? category.parent.toString() : '');
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setSelectedFile(null);
    reset();
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading categories...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Manage Categories</h1>
          <p className="text-gray-500 mt-1">Organize your store with multi-level categories.</p>
        </div>
        
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} /> Add Category
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* =========================================
            فرم ایجاد / ویرایش دسته‌بندی (سمت چپ)
        ========================================= */}
        {isFormOpen && (
          <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FolderTree size={20} className="text-blue-600"/> 
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 bg-gray-50 p-1 rounded-md"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  {...register('name')} 
                  onChange={(e) => {
                    if (!editingId) setValue('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Laptops"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input 
                  {...register('slug')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-gray-50 text-gray-600" 
                />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
              </div>

              {/* دراپ‌داون برای انتخاب دسته پدر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select 
                  {...register('parent')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">-- None (Main Category) --</option>
                  {rootCategories.map((cat: any) => (
                    // جلوگیری از اینکه کاربر یک دسته رو به عنوان پدر خودش انتخاب کنه!
                    cat.id !== editingId && (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    )
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave empty to create a main category.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image (Optional)</label>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                     {selectedFile ? (
                       <img src={URL.createObjectURL(selectedFile)} alt="preview" className="h-full w-full object-cover" />
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
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 mt-6 shadow-sm"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Category'}
              </button>
            </form>
          </div>
        )}

        {/* =========================================
            نمایش درختی دسته‌بندی‌ها (سمت راست)
        ========================================= */}
        <div className={`${isFormOpen ? 'w-full md:w-2/3' : 'w-full'} bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
          {rootCategories.length > 0 ? (
            <div className="divide-y divide-gray-100">
              
              {/* هدر جدول مانند */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                 <div className="col-span-8">Category Name</div>
                 <div className="col-span-4 text-right">Actions</div>
              </div>

              {/* لیست درختی */}
              <div className="flex flex-col">
                {rootCategories.map((rootCat: any) => (
                  <div key={rootCat.id} className="border-b border-gray-100 last:border-0">
                    
                    {/* ردیف دسته اصلی */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors group">
                      <div className="col-span-8 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 overflow-hidden">
                          {rootCat.image ? (
                            <img src={rootCat.image} alt={rootCat.name} className="h-full w-full object-cover" />
                          ) : (
                            <FolderTree className="text-blue-500" size={18} />
                          )}
                        </div>
                        <div>
                           <span className="font-bold text-gray-900 text-base">{rootCat.name}</span>
                           <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">/{rootCat.slug}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(rootCat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                         <button onClick={() => { if(window.confirm(`Delete ${rootCat.name}?`)) deleteMutation.mutate(rootCat.id) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    {/* ردیف زیردسته‌ها (اگر داشته باشه) */}
                    {rootCat.subcategories && rootCat.subcategories.length > 0 && (
                      <div className="bg-gray-50/50 flex flex-col pl-14 pr-6 pb-2">
                        {rootCat.subcategories.map((subCat: any) => (
                          <div key={subCat.id} className="grid grid-cols-12 gap-4 py-3 items-center hover:bg-gray-100 transition-colors border-l-2 border-gray-200 pl-4 group">
                            
                            <div className="col-span-8 flex items-center gap-2">
                              <CornerDownRight size={16} className="text-gray-400" />
                              <span className="font-semibold text-gray-700">{subCat.name}</span>
                              <span className="ml-2 text-xs text-gray-400">/{subCat.slug}</span>
                            </div>
                            
                            <div className="col-span-4 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEdit(subCat)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"><Edit2 size={14} /></button>
                               <button onClick={() => { if(window.confirm(`Delete subcategory ${subCat.name}?`)) deleteMutation.mutate(subCat.id) }} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md"><Trash2 size={14} /></button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          ) : (
             <div className="text-center py-16 px-4">
               <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FolderTree size={32} className="text-blue-500" />
               </div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">No categories found</h3>
               <p className="text-gray-500 mb-6">Start organizing your products by creating your first main category.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}