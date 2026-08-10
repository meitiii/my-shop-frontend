// src/components/ProductReviews.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_approved?: boolean;
}

const reviewSchema = z.object({
  rating: z.coerce.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(3, "Comment must be at least 3 characters long"),
});

type ReviewFormInput = z.input<typeof reviewSchema>;
type ReviewFormData = z.output<typeof reviewSchema>;

export default function ProductReviews({ productId }: { productId: string | undefined }) {
  const queryClient = useQueryClient();
  const isAuthenticated = !!useAuthStore((state) => state.accessToken);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewFormInput, any, ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await api.get('/reviews/', { params: { product: productId } });
      return response.data.results || response.data;
    },
    enabled: !!productId,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const payload = {
        product: Number(productId),
        rating: data.rating,
        comment: data.comment,
      };
      const response = await api.post('/reviews/', payload);
      return response.data;
    },
    onSuccess: () => {
      alert('Review submitted successfully!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
    onError: (error: any) => {
      const status = error.response?.status;
      if (status === 500 || status === 400) {
        alert("You have already submitted a review for this product or there is an issue with your request.");
      } else {
        alert(error.response?.data?.error || 'Failed to submit review. Please try again.');
      }
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate(data);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`}>
        ★
      </span>
    ));
  };

  if (isLoading) return <p className="text-gray-500 py-4">Loading reviews...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-4">Customer Reviews</h2>

      {/* Review Submission Form */}
      <div className="mb-10 bg-gray-50 border border-gray-100 p-6 md:p-8 rounded-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Write a Review</h3>

        {isAuthenticated ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                {...register('rating')}
                className="w-full md:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all"
              >
                <option value="">Select a rating...</option>
                <option value="5">5 - Excellent 🌟</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </select>
              {errors.rating && <p className="text-red-500 text-sm mt-1.5">{String(errors.rating.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
              <textarea
                {...register('comment')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="What did you like or dislike about this product?"
              />
              {errors.comment && <p className="text-red-500 text-sm mt-1.5">{String(errors.comment.message)}</p>}
            </div>

            <button
              type="submit"
              disabled={submitReviewMutation.isPending}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-sm"
            >
              {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-600 mb-4 font-medium">You must be logged in to leave a review.</p>
            <Link to="/login" className="inline-block px-8 py-2.5 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition-colors">
              Log In to Review
            </Link>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {!reviews || reviews.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl">
            <p className="text-gray-500 text-lg">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          reviews.map((review: Review) => (
            <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 mb-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-bold text-gray-900 block md:inline">
                    {review.user_name || 'Anonymous User'}
                  </span>
                  <span className="text-sm text-gray-400 md:ml-3 block md:inline mt-1 md:mt-0">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex bg-gray-50 px-2 py-1 rounded-md">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {review.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}