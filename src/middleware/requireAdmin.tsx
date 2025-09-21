'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RequireAdminProps {
  children: React.ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // TODO: Show login modal or handle unauthenticated state here
        return;
      }

      // In a real app, you'd verify the token and check the user's role
      // For now, we'll just check if the token exists
      // You should make an API call to verify the token and get user role
      
      try {
        // Decode JWT to get user info (basic implementation)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if user has admin role (role_id = 1)
        if (payload.roleId === 1) {
          setIsAuthorized(true);
        } else {
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
        // TODO: Show login modal or handle unauthenticated state here
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Checking authorization...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
} 