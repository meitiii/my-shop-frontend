// src/pages/admin/AdminProductsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Plus, Image as ImageIcon } from 'lucide-react';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await api.get('/products/');
      return response.data.results || response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => alert('Failed to delete product. Please try again.'),
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-medium">Loading products catalogue...</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Manage Products</h1>
          <p className="text-gray-500 mt-1">View, edit, or remove products from your store catalogue.</p>
        </div>
        
        <Link 
          to="/dashboard/products/new" 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {products && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {products.map((product: any) => {
                  const isDeleting = deleteMutation.isPending && deleteMutation.variables === product.id;
                  
                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-gray-50 transition-all duration-200 ${isDeleting ? 'opacity-40 bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
                            {product.thumbnail ? (
                              <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="text-gray-400" size={20} />
                            )}
                          </div>
                          
                          {/* Name & Category */}
                          <div>
                            <div className="font-bold text-gray-900 text-sm md:text-base">{product.name}</div>
                            {product.category && (
                              <div className="text-xs text-gray-500 font-medium mt-0.5">{product.category.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                          {product.sku || 'No SKU'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full ${
                          product.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/dashboard/products/edit/${product.id}`} 
                            className={`p-2 rounded-lg transition-colors ${isDeleting ? 'pointer-events-none text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
                            title="Edit Product"
                          >
                            <Edit2 size={18} />
                          </Link>
                          
                          <button 
                            onClick={() => handleDelete(product.id, product.name)} 
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
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
          <div className="text-center py-16 px-4">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">You haven't added any products to your store yet. Get started by creating your first product.</p>
            <Link 
              to="/dashboard/products/new" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus size={20} /> Add First Product
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}