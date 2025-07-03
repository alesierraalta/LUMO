"use client";

import { useState, useEffect } from "react";
import { Settings, User, Shield, Bell, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarginSettings } from "@/components/margin-settings";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      // Check if user is admin (you can customize this logic)
      setUserIsAdmin(user.email === 'alesierraalta@gmail.com' || user.role === 'admin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your personal information and account preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Name:</strong> {user.name || user.email}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Role:</strong> <span className="capitalize">{userIsAdmin ? 'admin' : 'user'}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings will be available soon.
            </p>
          </CardContent>
        </Card>

        {userIsAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link 
                href="/settings/users"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Manage Users
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Margin Settings Section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Business Settings</h2>
        </div>
        <MarginSettings />
      </div>
    </div>
  );
} 