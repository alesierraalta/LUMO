import { notFound } from "next/navigation";
import { getAllCategories, getProductById } from "@/services/productService";
import ProductForm from "@/components/products/product-form";
import ProductEditWrapper from "@/components/products/product-edit-wrapper";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const id = params.id;

  try {
    // Fetch data on the server
    const [product, categories] = await Promise.all([
      getProductById(id),
      getAllCategories()
    ]);

    if (!product) {
      notFound();
    }

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