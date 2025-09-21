'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RequireVendorProps {
  children: React.ReactNode;
}

export default function RequireVendor({ children }: RequireVendorProps) {
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
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Allow only vendor roles (3, 4, 5)
        if ([3, 4, 5].includes(payload.roleId)) {
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