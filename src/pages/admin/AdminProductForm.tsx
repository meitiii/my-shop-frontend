// src/pages/admin/AdminProductForm.tsx

import type { ReactNode } from 'react';
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
  brand_id: number | string;
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
      features: '',
      technical_specs: '',
      weight: '',
      dimensions: '',
      material: '',
      warranty: '',
      country_of_origin: '',
      is_active: true,
    },
  });

  // ==========================================
  // دریافت دسته‌بندی‌ها
  // ==========================================

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories/');
      return response.data.results || response.data;
    },
  });

  // ==========================================
  // دریافت برندها
  // ==========================================

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

  // ==========================================
  // ذخیره محصول
  // ==========================================

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // 👈 اینجا کلیدها رو به همون چیزی که جنگو می‌خواد تبدیل می‌کنیم
      const payload = {
        ...data,
        brand: data.brand_id ? Number(data.brand_id) : null,
        category: data.category_id ? Number(data.category_id) : null
      };
      
      // پاک کردن کلیدهای اضافی
      delete (payload as any).brand_id;
      delete (payload as any).category_id;

      if (isEditMode) return await api.patch(`/products/${id}/`, payload);
      return await api.post('/products/', payload);
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-products'],
      });

      alert('Product saved successfully!');

      if (!isEditMode) {
        navigate(
          `/dashboard/products/edit/${response.data.id}`
        );
      }
    },

    onError: (error: any) => {
      console.error(
        'Save Error:',
        error.response?.data
      );

      alert(
        'Failed to save product. Check the console for details.'
      );
    },
  });

  // ==========================================
  // Submit
  // ==========================================

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  // ==========================================
  // تغییر نام محصول و ساخت خودکار Slug
  // ==========================================

  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const name = e.target.value;

    setValue('name', name);

    if (!isEditMode) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-');

      setValue('slug', generatedSlug);
    }
  };

  // ==========================================
  // ساخت درخت Category برای Select
  // ==========================================

  const renderCategories = (
    cats: any[],
    prefix = ''
  ): ReactNode[] => {
    let result: ReactNode[] = [];

    cats?.forEach((cat) => {
      result.push(
        <option
          key={cat.id}
          value={cat.id}
        >
          {prefix}
          {cat.name}
        </option>
      );

      if (
        cat.subcategories &&
        cat.subcategories.length > 0
      ) {
        result = result.concat(
          renderCategories(
            cat.subcategories,
            prefix + '— '
          )
        );
      }
    });

    return result;
  };

  // ==========================================
  // فقط Category های اصلی
  // ==========================================

  const rootCategories =
    categories?.filter(
      (cat: any) => !cat.parent
    ) || [];

  // ==========================================
  // Loading
  // ==========================================

  if (
    isEditMode &&
    isLoadingProduct
  ) {
    return (
      <div className="p-8 text-gray-600">
        Loading product details...
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode
            ? 'Edit Product Details'
            : 'Create New Product'}
        </h1>

        <button
          type="button"
          onClick={() =>
            navigate('/dashboard/products')
          }
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Back to List
        </button>

      </div>

      {/* ==========================================
          Product Form
      ========================================== */}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >

        {/* ==========================================
            Section 1: General Information
        ========================================== */}

        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">

          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Product Name */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>

              <input
                {...register('name')}
                onChange={handleNameChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Slug */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) *
              </label>

              <input
                {...register('slug')}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-gray-50 text-gray-600"
              />

            </div>

            {/* Category */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>

              <select
                {...register('category_id', {
                  valueAsNumber: true,
                })}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white"
              >

                <option value="">
                  Select Category...
                </option>

                {renderCategories(
                  rootCategories
                )}

              </select>

            </div>

            {/* Brand */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>

              <select
                {...register('brand_id')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white"
              >

                <option value="">
                  No Brand
                </option>

                {brands?.map(
                  (brand: any) => (
                    <option
                      key={brand.id}
                      value={brand.id}
                    >
                      {brand.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* SKU */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base SKU
              </label>

              <input
                {...register('sku')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Active */}

            <div className="flex items-center mt-6">

              <input
                type="checkbox"
                {...register('is_active')}
                id="is_active"
                className="w-5 h-5 text-blue-600 rounded border-gray-300"
              />

              <label
                htmlFor="is_active"
                className="ml-2 font-medium text-gray-700"
              >
                Active (Visible in store)
              </label>

            </div>

          </div>

        </div>

        {/* ==========================================
            Section 2: Physical Properties
        ========================================== */}

        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">

          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">
            Physical Properties & Origin
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Weight */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>

              <input
                {...register('weight')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                placeholder="e.g. 1.5 kg"
              />

            </div>

            {/* Dimensions */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions
              </label>

              <input
                {...register('dimensions')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                placeholder="e.g. 10x20x5 cm"
              />

            </div>

            {/* Material */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>

              <input
                {...register('material')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Country */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country of Origin
              </label>

              <input
                {...register('country_of_origin')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Warranty */}

            <div className="md:col-span-2">

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty
              </label>

              <input
                {...register('warranty')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                placeholder="e.g. 18 Months Official Warranty"
              />

            </div>

          </div>

        </div>

        {/* ==========================================
            Section 3: Descriptions & Specifications
        ========================================== */}

        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">

          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">
            Descriptions & Specifications
          </h2>

          <div className="space-y-6">

            {/* Short Description */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>

              <textarea
                {...register('short_description')}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Full Description */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description
              </label>

              <textarea
                {...register('description')}
                rows={5}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Features */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Features
              </label>

              <textarea
                {...register('features')}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
                placeholder="Separated by commas..."
              />

            </div>

            {/* Technical Specs */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical Specifications
              </label>

              <textarea
                {...register('technical_specs')}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none"
              />

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
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400"
          >
            {saveMutation.isPending
              ? 'Saving...'
              : 'Save Product Details'}
          </button>

        </div>

      </form>

      {/* ==========================================
          Product Images & Variants
      ========================================== */}

      {isEditMode && id && (
        <div className="mt-12 space-y-8">

          <hr className="border-gray-300" />

          <ProductImageManager
            productId={id}
          />

          <ProductVariantsManager
            productId={id}
          />

        </div>
      )}

    </div>
  );
}