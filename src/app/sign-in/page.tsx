'use client';

import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to LUMO Inventory
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your inventory management system
          </p>
        </div>
        
        {/* Clerk Sign In Component with Error Boundary */}
        <Suspense fallback={
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <div className="flex justify-center">
            <ClerkSignInWrapper />
          </div>
        </Suspense>
        
        {/* Choreo Fallback Authentication */}
        <ChoreoAuthFallback />
      </div>
    </div>
  );
}

// Component to handle Clerk Sign In with error handling
function ClerkSignInWrapper() {
  try {
    return (
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            card: "shadow-lg",
          },
        }}
        redirectUrl="/dashboard"
        afterSignInUrl="/dashboard"
      />
    );
  } catch (error) {
    console.error('[SIGN-IN] Clerk component failed to load:', error);
    return <ChoreoAuthFallback showError={true} />;
  }
}

// Fallback authentication for Choreo when Clerk is unavailable
function ChoreoAuthFallback({ showError = false }: { showError?: boolean }) {
  // Only show fallback in Choreo environment or when there's an error
  if (typeof window !== 'undefined') {
    const isChoreo = window.location.hostname.includes('.choreoapps.dev');
    const isClerkMock = (window as any).__CLERK_FALLBACK_ACTIVE__;
    
    if (!isChoreo && !showError && !isClerkMock) {
      return null;
    }
  }

  const handleFallbackSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('[CHOREO-AUTH] Fallback authentication initiated');
    
    // In a real implementation, you would:
    // 1. Validate credentials against your backend
    // 2. Create a session
    // 3. Set authentication cookies/tokens
    
    // For now, just redirect to dashboard
    alert('🚀 Choreo Demo Mode: Authentication bypassed for testing. Redirecting to dashboard...');
    window.location.href = '/dashboard';
  };

  return (
    <div className="mt-8 space-y-6">
      {showError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Clerk Authentication Unavailable
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Using Choreo fallback authentication mode for testing.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🚀 Choreo Demo Authentication
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Simplified authentication for Choreo deployment testing. In production, this would connect to your authentication backend.
        </p>
        
        <form className="space-y-6" onSubmit={handleFallbackSignIn}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue="demo@choreo.test"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue="demo123"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in to Dashboard
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            💡 This is a demo authentication for Choreo testing
          </div>
          
          <div className="text-center">
            <a 
              href="/sign-up" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
} 