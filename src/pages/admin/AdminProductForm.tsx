// src/pages/admin/AdminProductForm.tsx

import { useState, useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../services/api';
import ProductImageManager from './ProductImageManager';
import ProductVariantsManager from './ProductVariantsManager';
import { Plus, Trash2 } from 'lucide-react'; // آیکون‌های جذاب برای دکمه‌ها

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  brand_id: number | string;
  category_id: number;
  short_description: string;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  warranty: string;
  country_of_origin: string;
  is_active: boolean;
  is_featured: boolean;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ==========================================
  // استیت‌های داینامیک برای Features و Tech Specs
  // ==========================================
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [techSpecs, setTechSpecs] = useState<{ key: string; value: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
  } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      slug: '',
      sku: '',
      brand_id: '',
      category_id: 0,
      short_description: '',
      description: '',
      weight: '',
      dimensions: '',
      material: '',
      warranty: '',
      country_of_origin: '',
      is_active: true,
      is_featured: false,
    },
  });

  // ==========================================
  // دریافت دسته‌بندی‌ها و برندها
  // ==========================================

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories/');
      return response.data.results || response.data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands/');
      return response.data.results || response.data;
    },
  });

  // ==========================================
  // دریافت اطلاعات محصول در حالت Edit
  // ==========================================

  const { isLoading: isLoadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}/`);
      const data = response.data;

      reset({
        name: data.name || '',
        slug: data.slug || '',
        sku: data.sku || '',
        brand_id: data.brand?.id || '',
        category_id: data.category?.id || 0,
        short_description: data.short_description || '',
        description: data.description || '',
        weight: data.weight || '',
        dimensions: data.dimensions || '',
        material: data.material || '',
        warranty: data.warranty || '',
        country_of_origin: data.country_of_origin || '',
        is_active: data.is_active ?? true,
        is_featured: data.is_featured ?? false,
      });

      // پر کردن استیت ویژگی‌های کلیدی (Features)
      if (Array.isArray(data.features)) {
        setFeaturesList(data.features);
      } else if (typeof data.features === 'string' && data.features) {
        setFeaturesList(data.features.split(',').map((s: string) => s.trim()));
      }

      // پر کردن استیت مشخصات فنی (Technical Specs)
      if (data.technical_specs && typeof data.technical_specs === 'object' && !Array.isArray(data.technical_specs)) {
        const specsArray = Object.entries(data.technical_specs).map(([k, v]) => ({
          key: k,
          value: String(v)
        }));
        setTechSpecs(specsArray);
      }

      return data;
    },
    enabled: isEditMode,
  });

  // ==========================================
  // توابع مدیریت لیست‌های داینامیک
  // ==========================================

  const addFeature = () => setFeaturesList([...featuresList, '']);
  const updateFeature = (index: number, val: string) => {
    const newFeatures = [...featuresList];
    newFeatures[index] = val;
    setFeaturesList(newFeatures);
  };
  const removeFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
  };

  const addSpec = () => setTechSpecs([...techSpecs, { key: '', value: '' }]);
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...techSpecs];
    newSpecs[index][field] = val;
    setTechSpecs(newSpecs);
  };
  const removeSpec = (index: number) => {
    setTechSpecs(techSpecs.filter((_, i) => i !== index));
  };

  // ==========================================
  // ذخیره محصول
  // ==========================================

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // ۱. تبدیل آرایه TechSpecs به دیکشنری (آبجکت)
      const specsObject = techSpecs.reduce((acc: any, curr) => {
        if (curr.key.trim() && curr.value.trim()) {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {});

      // ۲. پاکسازی ویژگی‌های خالی از Features
      const validFeatures = featuresList.map(f => f.trim()).filter(f => f.length > 0);

      const payload = {
        ...data,
        brand: data.brand_id ? Number(data.brand_id) : null,
        category_id: data.category_id ? Number(data.category_id) : null,
        features: validFeatures,           // 👈 ارسال به عنوان لیست
        technical_specs: specsObject       // 👈 ارسال به عنوان آبجکت
      };
      
      delete (payload as any).brand_id;

      if (isEditMode) return await api.patch(`/products/${id}/`, payload);
      return await api.post('/products/', payload);
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      alert('Product saved successfully!');
      if (!isEditMode) {
        navigate(`/dashboard/products/edit/${response.data.id}`);
      }
    },

    onError: (error: any) => {
      console.error('Save Error:', error.response?.data);
      alert('Failed to save product. Check the console for details.');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  // ==========================================
  // تغییر نام محصول و ساخت خودکار Slug
  // ==========================================

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);

    if (!isEditMode) {
      const generatedSlug = name.toLowerCase().trim().replace(/[\s\W-]+/g, '-');
      setValue('slug', generatedSlug);
    }
  };

  // ==========================================
  // ساخت درخت Category برای Select
  // ==========================================

  const renderCategories = (cats: any[], prefix = ''): ReactNode[] => {
    let result: ReactNode[] = [];
    cats?.forEach((cat) => {
      result.push(
        <option key={cat.id} value={cat.id}>
          {prefix}{cat.name}
        </option>
      );
      if (cat.subcategories && cat.subcategories.length > 0) {
        result = result.concat(renderCategories(cat.subcategories, prefix + '— '));
      }
    });
    return result;
  };

  const rootCategories = categories?.filter((cat: any) => !cat.parent) || [];

  // ==========================================
  // Loading
  // ==========================================

  if (isEditMode && isLoadingProduct) {
    return <div className="p-8 text-gray-600 font-bold text-center">Loading product details...</div>;
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="max-w-6xl mx-auto p-6">

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Product Details' : 'Create New Product'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/dashboard/products')}
          className="text-gray-500 hover:text-gray-800 transition-colors font-medium"
        >
          ← Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ==========================================
            Section 1: General Information
        ========================================== */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input {...register('name')} onChange={handleNameChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL) *</label>
              <input {...register('slug')} required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-gray-50 text-gray-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('category_id', { valueAsNumber: true })} required className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white">
                <option value="">Select Category...</option>
                {renderCategories(rootCategories)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select {...register('brand_id')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white">
                <option value="">No Brand</option>
                {brands?.map((brand: any) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base SKU</label>
              <input {...register('sku')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-8 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center cursor-pointer group">
                <input type="checkbox" {...register('is_active')} id="is_active" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                <label htmlFor="is_active" className="ml-2 font-semibold text-gray-700 cursor-pointer group-hover:text-blue-600 transition-colors">Active (Visible in store)</label>
              </div>
              <div className="flex items-center cursor-pointer group">
                <input type="checkbox" {...register('is_featured')} id="is_featured" className="w-5 h-5 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500 cursor-pointer" />
                <label htmlFor="is_featured" className="ml-2 font-semibold text-gray-700 cursor-pointer group-hover:text-yellow-600 transition-colors">Featured Product (Shows in special lists)</label>
              </div>
            </div>

          </div>
        </div>

        {/* ==========================================
            Section 2: Physical Properties
        ========================================== */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Physical Properties & Origin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <input {...register('weight')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="e.g. 1.5 kg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <input {...register('dimensions')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="e.g. 10x20x5 cm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input {...register('material')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
              <input {...register('country_of_origin')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
              <input {...register('warranty')} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="e.g. 18 Months Official Warranty" />
            </div>
          </div>
        </div>

        {/* ==========================================
            Section 3: Descriptions & Dynamic Specs
        ========================================== */}
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Descriptions & Specifications</h2>
          <div className="space-y-8">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea {...register('short_description')} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
              <textarea {...register('description')} rows={5} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>

            <hr className="border-gray-100" />

            {/* Dynamic Features (List) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Key Features (Bullet Points)</label>
              <div className="space-y-3">
                {featuresList.map((feature, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="e.g. 5000mAh Battery"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                    />
                    <button type="button" onClick={() => removeFeature(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addFeature} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                  <Plus size={16} /> Add Feature
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Dynamic Technical Specs (Key-Value) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Technical Specifications</label>
              <div className="space-y-3">
                {techSpecs.map((spec, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Key (e.g. RAM)"
                      value={spec.key}
                      onChange={(e) => updateSpec(index, 'key', e.target.value)}
                      className="w-1/3 px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none font-semibold text-gray-700"
                    />
                    <span className="text-gray-400 font-bold">:</span>
                    <input
                      type="text"
                      placeholder="Value (e.g. 8GB)"
                      value={spec.value}
                      onChange={(e) => updateSpec(index, 'value', e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                    />
                    <button type="button" onClick={() => removeSpec(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSpec} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                  <Plus size={16} /> Add Specification
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ==========================================
            Save Button
        ========================================== */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:bg-gray-400"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Product Details'}
          </button>
        </div>

      </form>

      {/* ==========================================
          Product Images & Variants
      ========================================== */}
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