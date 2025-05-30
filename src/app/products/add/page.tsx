import { redirect } from "next/navigation";

export default function AddProductPage() {
  // Redirect to the improved inventory add page
  redirect('/inventory/add');
} 