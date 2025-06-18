'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrateRootUserPage() {
  const [email, setEmail] = useState('alesierraalta@gmail.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const checkMigrationStatus = async () => {
    setIsLoading(true);
    setMigrationStatus('checking');
    
    try {
      const response = await fetch(`/api/auth/migrate-to-supabase?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.migration_needed) {
          setStatusMessage('Migration needed: User exists in custom system but not in Supabase Auth');
        } else if (data.exists_in_auth) {
          setStatusMessage('User already migrated to Supabase Auth');
          setMigrationStatus('success');
        } else {
          setStatusMessage('User not found in system');
          setMigrationStatus('error');
        }
      } else {
        setStatusMessage(data.error || 'Error checking migration status');
        setMigrationStatus('error');
      }
    } catch (error) {
      setStatusMessage('Network error checking migration status');
      setMigrationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/migrate-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          isRootMigration: true
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMigrationStatus('success');
        setStatusMessage('Migration successful! You can now login with Supabase Auth');
        toast.success('Root user migrated successfully!');
      } else {
        setMigrationStatus('error');
        setStatusMessage(data.error || 'Migration failed');
        toast.error(data.error || 'Migration failed');
      }
    } catch (error) {
      setMigrationStatus('error');
      setStatusMessage('Network error during migration');
      toast.error('Network error during migration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-blue-100">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Root User Migration</CardTitle>
          <CardDescription>
            Migrate your root account to Supabase Authentication
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {statusMessage && (
            <Alert className={migrationStatus === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
              {migrationStatus === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className={migrationStatus === 'error' ? 'text-red-700' : 'text-blue-700'}>
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              onClick={checkMigrationStatus}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading && migrationStatus === 'checking' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Check Migration Status
            </Button>
          </div>

          {migrationStatus !== 'success' && (
            <form onSubmit={handleMigration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alesierraalta@gmail.com"
                  required
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Migrate to Supabase Auth
              </Button>
            </form>
          )}

          {migrationStatus === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Migration Complete!</h3>
                <p className="text-sm text-green-600 mt-1">
                  You can now login at <a href="/login" className="underline">/login</a>
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-xs text-gray-500">
            This migration is required to use the new Supabase authentication system
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 