import CatalogItem from "@/components/CatalogItem";

type Product = {
  id?: string;
  title?: string;
  image?: string;
  price?: string;
  category?: string;
  style?: string;
  [key: string]: any;
};

export default function CatalogGrid({ products }: { products: Product[] }) {
  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500">No items to show.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, i) => (
        <CatalogItem key={i} product={product} />
      ))}
    </div>
  );
}