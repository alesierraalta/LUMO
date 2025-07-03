"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<any>(null);

  useEffect(() => {
    // Mock data for GitHub Pages static export
    setCategory({
      id: categoryId,
      name: "Sample Category",
      description: "Sample category for GitHub Pages"
    });
    setLoading(false);
  }, [categoryId]);

  const handleSave = () => {
    // Mock save functionality for GitHub Pages
    alert("Category saved (GitHub Pages demo)");
    router.push("/categories");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={category?.name || ""}
              onChange={(e) => setCategory({...category, name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={category?.description || ""}
              onChange={(e) => setCategory({...category, description: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="outline" onClick={() => router.push("/categories")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 