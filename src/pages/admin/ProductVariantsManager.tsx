// src/pages/admin/ProductVariantsManager.tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

interface Props { productId: string; }

export default function ProductVariantsManager({ productId }: Props) {
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/product-variants/', {
        product: productId,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        color: color || undefined,
        size: size || undefined,
      });

      alert('Product variant added successfully!');
      setPrice('');
      setStock('');
      setColor('');
      setSize('');
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    } catch (error: any) {
      console.error('Variant Error:', error.response?.data);
      alert('Failed to add product variant. Check the console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Manage Pricing & Variants</h3>
      
      <form onSubmit={handleAddVariant} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-blue-500" placeholder="e.g. Black, Silver" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
          <input type="text" value={size} onChange={(e) => setSize(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-blue-500" placeholder="e.g. XL, 256GB" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Cash Price</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-blue-500" placeholder="e.g. 150000" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min="0" className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-blue-500" placeholder="e.g. 50" />
        </div>

        <div className="md:col-span-4 pt-2">
          <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
            {isSubmitting ? 'Saving...' : 'Add Variant'}
          </button>
        </div>
      </form>
    </div>
  );
}