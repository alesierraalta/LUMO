import { notFound } from "next/navigation";
import { getProductById } from "@/services/productService";
import ProductForm from "@/components/products/product-form";
import ProductEditWrapper from "@/components/products/product-edit-wrapper";
import { getApiBaseUrl } from "@/lib/utils";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const id = params.id;

  try {
    // Fetch product data from the server
    const product = await getProductById(id);

    if (!product) {
      notFound();
    }

    // Fetch categories from API with proper base URL
    const apiBaseUrl = getApiBaseUrl();
    const categoriesResponse = await fetch(`${apiBaseUrl}/api/categories`);
    if (!categoriesResponse.ok) {
      throw new Error('Failed to fetch categories');
    }
    const categories = await categoriesResponse.json();

    return (
      <div className="container max-w-5xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Editar Producto</h1>
        <ProductEditWrapper productId={id}>
          <ProductForm 
            initialData={product}
            categories={categories}
          />
        </ProductEditWrapper>
      </div>
    );
  } catch (error) {
    console.error("Error al cargar datos:", error);
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <div className="bg-destructive/20 text-destructive p-4 rounded-md mb-8">
          <p>No se pudieron cargar los datos del producto.</p>
        </div>
      </div>
    );
  }
} 