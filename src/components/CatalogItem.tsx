type Product = {
  id?: string;
  title?: string;
  image?: string;
  image_url?: string;
  category?: string;
  price?: string;
  style?: string;
  size?: string;
};

export default function CatalogItem({ product }: { product: Product }) {
  const imageSrc = product.image || product.image_url;

  return (
    <div className="rounded-md border shadow-sm hover:shadow-md transition overflow-hidden">
      <img
        src={imageSrc}
        alt={product.title || "Product image"}
        className="w-full h-64 object-cover"
      />
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
        <div className="flex justify-between items-center">
          {product.price && (
            <p className="text-sm font-semibold text-gray-800">{product.price}</p>
          )}
          {product.size && (
            <span className="relative inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border-dashed border-amber-300 border-y overflow-hidden after:content-[''] after:absolute after:top-0 after:right-0 after:h-full after:w-1.5 after:bg-amber-300 before:content-[''] before:absolute before:top-0 before:left-0 before:h-full before:w-1.5 before:bg-amber-300" style={{ clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)', fontFamily: "'Courier New', monospace" }}>
              {product.size}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
