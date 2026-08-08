// src/pages/PaymentVerifyPage.tsx
import { useSearchParams, Link } from 'react-router-dom';

function PaymentVerifyPage() {
  const [searchParams] = useSearchParams();
  
  // خواندن اطلاعات مستقیم از آدرسی که جنگو ما رو بهش ریدایرکت کرده
  const status = searchParams.get('status');
  const refId = searchParams.get('ref_id');
  const errorMsg = searchParams.get('error');
  const message = searchParams.get('message');

  const isSuccess = status === 'success';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              {message || "Your order has been paid and is now being processed."}
            </p>
            {refId && (
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-6 border">
                Reference ID: <span className="font-bold">{refId}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✕</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              {errorMsg || "We couldn't verify your payment. If money was deducted, it will be refunded."}
            </p>
          </>
        )}

        <div className="flex flex-col gap-3 mt-8">
          <Link to="/orders" className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
            View My Orders
          </Link>
          <Link to="/" className="w-full px-4 py-2 bg-white text-gray-600 border border-gray-300 font-bold rounded-lg hover:bg-gray-50 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentVerifyPage;