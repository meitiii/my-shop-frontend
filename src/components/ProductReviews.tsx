// src/components/ProductReviews.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';


// ۱. رابط کاربری Review
interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_approved?: boolean;
}


// ۲. Schema فرم
const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .min(1, "Please select a rating")
    .max(5),

  comment: z.string()
    .min(3, "Comment must be at least 3 characters long"),
});


// مهم: input و output جدا هستند چون coerce داریم
type ReviewFormInput = z.input<typeof reviewSchema>;
type ReviewFormData = z.output<typeof reviewSchema>;



export default function ProductReviews({
  productId
}: {
  productId: string | undefined
}) {

  const queryClient = useQueryClient();

  const isAuthenticated = !!useAuthStore(
    (state) => state.accessToken
  );


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewFormInput, any, ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });



  // گرفتن Review ها
  const {
    data: reviews,
    isLoading
  } = useQuery({

    queryKey: ['reviews', productId],

    queryFn: async () => {

      const response = await api.get('/reviews/', {
        params: {
          product: productId
        }
      });

      return response.data.results || response.data;
    },

    enabled: !!productId,
  });



  // ارسال Review
  const submitReviewMutation = useMutation({

    mutationFn: async (data: ReviewFormData) => {

      const payload = {
        product: Number(productId),
        rating: data.rating,
        comment: data.comment,
      };


      const response = await api.post(
        '/reviews/',
        payload
      );

      return response.data;
    },


    onSuccess: () => {

      alert('Review submitted successfully!');

      reset();

      queryClient.invalidateQueries({
        queryKey: ['reviews', productId]
      });
    },


    onError: (error: any) => {

      const status = error.response?.status;


      if (status === 500) {

        alert(
          "You have already submitted a review for this product."
        );

      } else {

        alert(
          error.response?.data?.error ||
          'Failed to submit review. Please try again.'
        );
      }
    },
  });



  const onSubmit = (data: ReviewFormData) => {

    submitReviewMutation.mutate(data);

  };



  const renderStars = (rating: number) => {

    return Array.from({ length: 5 }).map((_, i) => (

      <span
        key={i}
        className={`text-xl ${
          i < rating
            ? 'text-yellow-400'
            : 'text-gray-300'
        }`}
      >
        ★
      </span>

    ));
  };



  if (isLoading) {

    return <p>Loading reviews...</p>;

  }



  return (

    <div>

      <h2 className="text-2xl font-bold mb-6">
        Customer Reviews
      </h2>



      {/* فرم ثبت Review */}

      <div className="mb-10 bg-gray-50 p-6 rounded-lg">


        <h3 className="font-bold text-gray-800 mb-4">
          Write a Review
        </h3>



        {
          isAuthenticated ? (

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >


              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>


                <select
                  {...register('rating')}
                  className="w-full md:w-1/3 px-4 py-2 border rounded-lg"
                >

                  <option value="">
                    Select a rating...
                  </option>

                  <option value="5">
                    5 - Excellent 🌟
                  </option>

                  <option value="4">
                    4 - Very Good
                  </option>

                  <option value="3">
                    3 - Average
                  </option>

                  <option value="2">
                    2 - Poor
                  </option>

                  <option value="1">
                    1 - Terrible
                  </option>

                </select>



                {
                  errors.rating && (

                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.rating.message)}
                    </p>

                  )
                }

              </div>




              <div>


                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Comment
                </label>



                <textarea

                  {...register('comment')}

                  rows={4}

                  className="w-full px-4 py-2 border rounded-lg"

                  placeholder="What did you like or dislike?"

                />



                {
                  errors.comment && (

                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.comment.message)}
                    </p>

                  )
                }


              </div>





              <button

                type="submit"

                disabled={
                  submitReviewMutation.isPending
                }

                className="px-6 py-2 bg-blue-600 text-white rounded-lg"

              >

                {
                  submitReviewMutation.isPending
                    ? 'Submitting...'
                    : 'Submit Review'
                }


              </button>



            </form>


          ) : (


            <div className="text-center py-4">


              <p className="text-gray-600 mb-3">
                You must be logged in to leave a review.
              </p>


              <Link

                to="/login"

                className="px-6 py-2 bg-blue-100 text-blue-700 rounded"

              >

                Log In to Review

              </Link>


            </div>


          )

        }


      </div>





      {/* لیست Review ها */}

      <div className="space-y-6">


        {
          !reviews || reviews.length === 0 ? (


            <p className="text-gray-500 text-center py-4">
              No reviews yet. Be the first to share your thoughts!
            </p>


          ) : (


            reviews.map((review: Review) => (


              <div

                key={review.id}

                className="border-b pb-6"

              >


                <div className="flex justify-between mb-2">


                  <div>


                    <span className="font-bold">
                      {review.user_name || 'Anonymous User'}
                    </span>


                    <span className="text-xs text-gray-400 ml-3">

                      {
                        new Date(
                          review.created_at
                        ).toLocaleDateString()
                      }

                    </span>


                  </div>



                  <div className="flex">

                    {
                      renderStars(review.rating)
                    }

                  </div>


                </div>



                <p className="text-gray-600">

                  {review.comment}

                </p>



              </div>


            ))

          )

        }


      </div>


    </div>

  );

}