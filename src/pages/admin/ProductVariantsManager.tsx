// src/pages/admin/ProductVariantsManager.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, Tag, LayoutList, Edit2, X } from 'lucide-react';
import { api } from '../../services/api';

interface Props { 
  productId: string; 
}

interface Variant {
  id: number;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  discount_percent: number;
}

export default function ProductVariantsManager({ productId }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [discount, setDiscount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  // گرفتن لیست تنوع‌های این محصول از سرور
  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}/`);
      return response.data;
    }
  });

  const variants: Variant[] = product?.variants || [];

  // تابع پر کردن فرم برای ویرایش
  const handleEditClick = (variant: Variant) => {
    setEditingId(variant.id);
    setColor(variant.color || '');
    setSize(variant.size || '');
    setPrice(variant.price.toString());
    setDiscount(variant.discount_percent.toString());
    setStock(variant.stock.toString());
  };

  // تابع لغو ویرایش و خالی کردن فرم
  const handleCancelEdit = () => {
    setEditingId(null);
    setColor('');
    setSize('');
    setPrice('');
    setDiscount('0');
    setStock('');
  };

  // تابع ذخیره (یا ایجاد جدید یا آپدیت قبلی)
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      product: productId,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      color: color || undefined,
      size: size || undefined,
      discount_percent: parseInt(discount, 10) || 0,
    };

    try {
      if (editingId) {
        // حالت آپدیت (PATCH)
        await api.patch(`/product-variants/${editingId}/`, payload);
      } else {
        // حالت ایجاد (POST)
        await api.post('/product-variants/', payload);
      }

      handleCancelEdit(); // فرم رو خالی میکنه و از حالت ویرایش خارج میشه
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    } catch (error: any) {
      console.error('Variant Error:', error.response?.data);
      alert('Failed to save product variant. Check the console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تابع حذف تنوع
  const deleteMutation = useMutation({
    mutationFn: async (variantId: number) => {
      await api.delete(`/product-variants/${variantId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      // اگر در حال ویرایش آیتمی بودیم که پاک شد، فرم رو هم ریست کن
      if (editingId) handleCancelEdit(); 
    },
    onError: () => {
      alert('Failed to delete the variant.');
    }
  });

  const handleDelete = (variantId: number) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      deleteMutation.mutate(variantId);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
          <Tag size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Pricing, Variants & Discounts</h3>
      </div>
      
      {/* 1. بخش نمایش لیست تنوع‌ها */}
      <div className="mb-10">
        <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
          <LayoutList size={18} />
          Current Variants
        </h4>
        
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading variants...</div>
        ) : variants.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Color</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Base Price</th>
                  <th className="px-4 py-3 font-semibold text-red-500">Discount</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Final Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((v) => {
                  const finalPrice = v.price - (v.price * (v.discount_percent / 100));
                  const isEditingThis = editingId === v.id;
                  
                  return (
                    <tr 
                      key={v.id} 
                      className={`transition-colors ${isEditingThis ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{v.color || '-'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{v.size || '-'}</td>
                      <td className="px-4 py-3">${v.price.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {v.discount_percent > 0 ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                            {v.discount_percent}% OFF
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">${finalPrice.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${v.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleEditClick(v)}
                            className={`p-2 rounded-lg transition-colors ${isEditingThis ? 'bg-blue-600 text-white' : 'text-blue-500 hover:bg-blue-50'}`}
                            title="Edit Variant"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Variant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500 font-medium">
            No variants added yet. Set your first price below!
          </div>
        )}
      </div>

      {/* 2. بخش فرم (ایجاد یا ویرایش) */}
      <div className={`p-5 rounded-xl border transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h4 className={`text-sm font-bold flex items-center gap-2 ${editingId ? 'text-blue-700' : 'text-gray-700'}`}>
            {editingId ? <Edit2 size={18} /> : <PlusCircle size={18} />}
            {editingId ? 'Edit Variant' : 'Add New Variant'}
          </h4>
          
          {editingId && (
            <button 
              onClick={handleCancelEdit}
              className="text-sm font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              <X size={16} /> Cancel Edit
            </button>
          )}
        </div>
        
        <form onSubmit={handleSaveVariant} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Color (Opt)</label>
            <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="e.g. Black" />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Size (Opt)</label>
            <input type="text" value={size} onChange={(e) => setSize(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="e.g. XL, 256GB" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Total Cash Price</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white" placeholder="0" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-red-500 mb-1 uppercase tracking-wider">Discount %</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} required min="0" max="100" className="w-full border border-red-200 bg-red-50 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400 text-red-700 font-bold" placeholder="0" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Stock Qty</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min="0" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" placeholder="0" />
          </div>

          <div className="md:col-span-5 pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`w-full py-3 text-white font-bold rounded-lg transition-all shadow-sm ${
                editingId 
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400' 
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
              }`}
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Variant' : 'Save Variant & Pricing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}