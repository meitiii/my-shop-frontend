// src/pages/admin/AdminProductForm.tsx
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import ProductImageManager from './ProductImageManager';
import ProductVariantsManager from './ProductVariantsManager';

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category_id: number;
  short_description: string;
  description: string;
  features: string;
  technical_specs: string;
  weight: string;
  dimensions: string;
  material: string;
  warranty: string;
  country_of_origin: string;
  is_active: boolean;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue } = useForm<ProductFormData>({
    defaultValues: { is_active: true },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories/');
      return response.data.results || response.data;
    },
  });

  const { isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}/`);
      const data = response.data;
      reset({
        name: data.name || '',
        slug: data.slug || '',
        sku: data.sku || '',
        brand: data.brand || '',
        category_id: data.category?.id || '',
        short_description: data.short_description || '',
        description: data.description || '',
        features: data.features || '',
        technical_specs: data.technical_specs || '',
        weight: data.weight || '',
        dimensions: data.dimensions || '',
        material: data.material || '',
        warranty: data.warranty || '',
        country_of_origin: data.country_of_origin || '',
        is_active: data.is_active ?? true,
      });
      return data;
    },
    enabled: isEditMode,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (isEditMode) return await api.patch(`/products/${id}/`, data);
      return await api.post('/products/', data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      alert('Product saved successfully!');
      if (!isEditMode) navigate(`/dashboard/products/edit/${response.data.id}`);
    },
    onError: (error: any) => {
      console.error("Save Error:", error.response?.data);
      alert('Failed to save product. Check the console for details.');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    if (!isEditMode) {
      const generatedSlug = name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
      setValue('slug', generatedSlug);
    }
  };

  if (isEditMode && isLoadingProduct) return <div className="p-8">Loading product details...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditMode ? 'Edit Product Details' : 'Create New Product'}
        </h1>
        <button onClick={() => navigate('/dashboard/products')} className="text-gray-500 hover:text-gray-800 transition-colors">
          &larr; Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: General Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input {...register('name')} onChange={handleNameChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
              <input {...register('slug')} required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('category_id', { valueAsNumber: true })} required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none">
                <option value="">Select Category...</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input {...register('brand')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="e.g. Samsung, Nike" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base SKU</label>
              <input {...register('sku')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex items-center mt-6">
              <input type="checkbox" {...register('is_active')} id="is_active" className="w-5 h-5 text-blue-600 rounded border-gray-300" />
              <label htmlFor="is_active" className="ml-2 font-medium text-gray-700">Active (Visible in store)</label>
            </div>
          </div>
        </div>

        {/* Section 2: Physical Properties */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Physical Properties & Origin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight</label><input {...register('weight')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="e.g. 1.5 kg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label><input {...register('dimensions')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="e.g. 10x20x5 cm" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Material</label><input {...register('material')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label><input {...register('country_of_origin')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label><input {...register('warranty')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="e.g. 18 Months Official Warranty" /></div>
          </div>
        </div>

        {/* Section 3: Specs */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Descriptions & Specifications</h2>
          <div className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label><textarea {...register('short_description')} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label><textarea {...register('description')} rows={5} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Key Features</label><textarea {...register('features')} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="Separated by commas..." /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Technical Specifications</label><textarea {...register('technical_specs')} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" /></div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saveMutation.isPending} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            {saveMutation.isPending ? 'Saving...' : 'Save Product Details'}
          </button>
        </div>
      </form>

      {isEditMode && id && (
        <div className="mt-12 space-y-8">
          <hr className="border-gray-300" />
          <ProductImageManager productId={id} />
          <ProductVariantsManager productId={id} />
        </div>
      )}
    </div>
  );
}