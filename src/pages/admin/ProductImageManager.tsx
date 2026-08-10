// src/pages/admin/ProductImageManager.tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

interface Props { productId: string; }

export default function ProductImageManager({ productId }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [order, setOrder] = useState('0');
  const [isMain, setIsMain] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('product', productId);
    formData.append('image', selectedFile);
    formData.append('alt_text', altText);
    formData.append('order', order);
    formData.append('is_main', String(isMain));

    try {
      await api.post('/product-images/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Image uploaded successfully!');
      setSelectedFile(null);
      setAltText('');
      setOrder('0');
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    } catch (error: any) {
      console.error("Upload Error:", error.response?.data);
      alert('Failed to upload image. Please check the console.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Manage Product Images</h3>
      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (SEO)</label>
          <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-blue-500" placeholder="Describe the image..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
          <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-blue-500" placeholder="0" />
        </div>
        <div className="md:col-span-2 flex items-center mt-2">
          <input type="checkbox" id="isMain" checked={isMain} onChange={(e) => setIsMain(e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-gray-300 cursor-pointer" />
          <label htmlFor="isMain" className="ml-2 font-medium text-gray-700 cursor-pointer">Set as Main Image (Cover)</label>
        </div>
        <div className="md:col-span-2 pt-2">
          <button type="submit" disabled={!selectedFile || isUploading} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </form>
    </div>
  );
}