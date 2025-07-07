import { redirect } from "next/navigation";

export default function AddInventoryPage() {
  // Redirect to the correct inventory add page
  redirect('/inventory/new');
} 