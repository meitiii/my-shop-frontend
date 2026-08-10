// src/pages/admin/ProductImageManager.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type {DropResult} from '@hello-pangea/dnd';
import { Star, Trash2, ImagePlus, GripHorizontal, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface Props { 
  productId: string; 
}

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  is_main: boolean;
  order: number;
}

export default function ProductImageManager({ productId }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Local state for smooth drag and drop UI updates
  const [localImages, setLocalImages] = useState<ProductImage[]>([]);

  // 1. Fetch current images
  const { data: images, isLoading } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const response = await api.get(`/products/${productId}/`);
      return response.data.images as ProductImage[];
    }
  });

  // Sync local state when server data changes
  useEffect(() => {
    if (images) {
      const sorted = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));
      setLocalImages(sorted);
    }
  }, [images]);

  // 2. Handle Drag End (Reordering)
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    // Smooth UI update
    const items = Array.from(localImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalImages(items);

    // Background API update
    try {
      await Promise.all(
        items.map((img, index) => 
          api.patch(`/product-images/${img.id}/`, { order: index })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    } catch (error) {
      console.error('Order update failed:', error);
      alert('Failed to save the new order. Please refresh the page.');
    }
  };

  // 3. Set as Main Image (Cover)
  const setMainMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await api.patch(`/product-images/${imageId}/`, { is_main: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    }
  });

  // 4. Delete Image
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await api.delete(`/product-images/${imageId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    }
  });

  const handleDelete = (imageId: number) => {
    if (window.confirm('Are you sure you want to delete this beautiful image?')) {
      deleteMutation.mutate(imageId);
    }
  };

  // 5. Upload New Image
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('product', productId);
    formData.append('image', selectedFile);
    formData.append('alt_text', altText);
    formData.append('order', String(localImages.length));
    formData.append('is_main', String(localImages.length === 0)); // Auto-set cover if it's the first image

    try {
      await api.post('/product-images/', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setSelectedFile(null);
      setAltText('');
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    } catch (error: any) {
      console.error("Upload Error:", error.response?.data);
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <ImagePlus size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Media Gallery</h3>
      </div>
      
      {/* Interactive Gallery Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-medium text-gray-500">
            Drag items to rearrange their display order.
          </p>
          {setMainMutation.isPending && (
            <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
              Updating Cover...
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-gray-400">Loading gallery...</div>
        ) : localImages.length > 0 ? (
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="gallery" direction="horizontal">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x"
                >
                  {localImages.map((img, index) => (
                    <Draggable key={img.id.toString()} draggableId={img.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative group flex-shrink-0 w-40 h-40 rounded-xl overflow-hidden bg-white border-2 snap-center transition-all duration-300 ${
                            snapshot.isDragging ? 'border-blue-500 shadow-xl scale-105 z-50' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <img 
                            src={img.image} 
                            alt={img.alt_text || 'product image'} 
                            className="w-full h-full object-contain p-2"
                          />
                          
                          {/* Cover Badge */}
                          {img.is_main && (
                            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1 z-10">
                              <CheckCircle2 size={12} /> Cover
                            </div>
                          )}

                          {/* Hover Overlay with Backdrop Blur */}
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                            
                            {/* Drag Handle Indicator */}
                            <div className="absolute top-2 right-2 text-white/50">
                              <GripHorizontal size={20} />
                            </div>

                            {!img.is_main && (
                              <button 
                                onClick={() => setMainMutation.mutate(img.id)}
                                title="Set as Cover"
                                className="p-2 bg-white/20 hover:bg-yellow-400 hover:text-yellow-900 text-white rounded-full transition-colors backdrop-blur-md"
                              >
                                <Star size={20} />
                              </button>
                            )}
                            
                            <button 
                              onClick={() => handleDelete(img.id)}
                              disabled={deleteMutation.isPending}
                              title="Delete Image"
                              className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md disabled:opacity-50"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <ImagePlus size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium text-sm text-center">
              No images uploaded yet.<br/>The first image will automatically become the cover.
            </p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
        <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          Add New Image
        </h4>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-6">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files) setSelectedFile(e.target.files[0]);
              }} 
              required 
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:transition-colors cursor-pointer bg-white border border-gray-200 rounded-lg shadow-sm" 
            />
          </div>

          <div className="md:col-span-4">
            <input 
              type="text" 
              value={altText} 
              onChange={(e) => setAltText(e.target.value)} 
              className="w-full border border-gray-200 rounded-lg py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
              placeholder="Alt Text (SEO)..." 
            />
          </div>

          <div className="md:col-span-2">
            <button 
              type="submit" 
              disabled={!selectedFile || isUploading} 
              className="w-full py-2.5 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-black disabled:bg-gray-400 transition-colors shadow-sm flex justify-center items-center gap-2"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}