// src/pages/PaymentVerifyPage.tsx
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, FileText, ArrowLeft } from 'lucide-react';

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams();
  
  const status = searchParams.get('status');
  const refId = searchParams.get('ref_id');
  const errorMsg = searchParams.get('error');
  const message = searchParams.get('message');
  const orderId = searchParams.get('order_id');

  const isSuccess = status === 'success';

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 sm:p-10 text-center border border-gray-100">
        
        {isSuccess ? (
          <>
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Payment Successful!</h2>
            <p className="text-gray-600 mb-8 leading-relaxed font-medium">
              {message || "Your order has been paid and is now being processed by our team."}
            </p>
            
            <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 mb-8 border border-gray-100 flex flex-col gap-2">
              {refId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Reference ID</span>
                  <span className="font-black text-gray-900 font-mono tracking-wider">{refId}</span>
                </div>
              )}
              {orderId && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-500 font-medium">Order Number</span>
                  <span className="font-black text-gray-900">#{orderId}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Payment Failed</h2>
            <p className="text-gray-600 mb-8 leading-relaxed font-medium">
              {errorMsg || "We couldn't verify your payment. If money was deducted, it will be automatically refunded within 24 hours."}
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/orders" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all">
            <FileText size={18} /> View My Orders
          </Link>
          <Link to="/" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 border-2 border-gray-200 transition-all">
            <ArrowLeft size={18} /> Return to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}