// src/pages/ProductDetailPage.tsx
import { useParams } from 'react-router-dom';

function ProductDetailPage() {
  // این هوک، آیدی محصول رو از آدرس مرورگر (URL) میخونه
  const { id } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">جزئیات محصول شماره: {id}</h1>
      <p className="mt-4">در مرحله بعدی با React Query دیتای این محصول رو از جنگو می‌گیریم.</p>
    </div>
  );
}

export default ProductDetailPage;