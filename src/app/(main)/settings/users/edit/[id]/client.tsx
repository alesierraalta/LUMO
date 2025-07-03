"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClientEditUserPageProps {
  userId: string;
}

export default function ClientEditUserPage({ userId }: ClientEditUserPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Mock data for GitHub Pages static export
    setUser({
      id: userId,
      name: "Sample User",
      email: "user@example.com",
      role: "USER"
    });
    setLoading(false);
  }, [userId]);

  const handleSave = () => {
    // Mock save functionality for GitHub Pages
    alert("User saved (GitHub Pages demo)");
    router.push("/settings/users");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={user?.name || ""}
              onChange={(e) => setUser({...user, name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              onChange={(e) => setUser({...user, email: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={user?.role || ""}
              onChange={(e) => setUser({...user, role: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="outline" onClick={() => router.push("/settings/users")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 