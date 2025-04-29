import ProductForm from "@/components/products/product-form";
import { getAllCategories } from "@/services/productService";

export default async function AddProductPage() {
  // Fetch categories on the server
  const categories = await getAllCategories();

  return (
    <div className="container max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Agregar Nuevo Producto</h1>
      <ProductForm 
        categories={categories}
      />
    </div>
  );
} 