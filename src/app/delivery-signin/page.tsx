"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Truck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { logindelivery } from '@/services/api-client';
import { useUser } from '@/contexts/UserContext';
export default function DeliverySigninPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { setUser, setIsLoggedIn, user } = useUser() as {
    setUser: (user: { id: number; name?: string; email?: string; roleId?: number } | null) => void,
    setIsLoggedIn: (loggedIn: boolean) => void,
    user: { id: number; name?: string; email?: string; roleId?: number } | null
  };

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already signed in as delivery personnel, redirect
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      let userObj = user;
      if (!userObj && storedUser) {
        try {
          userObj = JSON.parse(storedUser);
          setUser(userObj);
        } catch {}
      }
      if (userObj && userObj.roleId === 6 && storedToken) {
        router.replace('/delivery-dashboard');
      }
    }
  }, [user, setUser, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await logindelivery(formData.identifier, formData.password);
      console.log(result);
      
      if (typeof window !== 'undefined' && result.token) {
        localStorage.setItem('token', result.token);
        setIsLoggedIn(true);
        
        try {
          const payload = result.user;
          setUser({ 
            id: payload.id, 
            name: payload.name, 
            email: payload.email, 
            roleId: payload.roleId 
          });
          
          // Check if user is delivery personnel (roleId 6)
          if (payload.roleId === 6) {
            router.push('/delivery-dashboard');
            return;
          } else {
            setError(t('auth.notDeliveryPersonnel') as string);
            localStorage.removeItem('token');
            setIsLoggedIn(false);
            setUser(null);
          }
        } catch {
          setError(t('auth.loginFailed') as string);
        }
      }
    } catch (err: unknown) {
      let msg = t('auth.loginFailed') as string;
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data) {
        const backendMsg = err.response.data.error;
        if (backendMsg === 'Invalid credentials') {
          msg = t('auth.invalidCredentials') as string;
        } else if (typeof backendMsg === 'string' && backendMsg.includes('required')) {
          msg = t('auth.emailOrPhoneRequired') as string;
        } else if (typeof backendMsg === 'string') {
          msg = backendMsg;
        }
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4"
          >
            <Truck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('delivery.signinTitle')}
          </h1>
          <p className="text-gray-600">
            {t('delivery.signinSubtitle')}
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Phone Input */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.identifier')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('auth.emailOrPhonePlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('auth.signingIn')}
                </div>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

     
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            {t('delivery.signinFooter')}
          </p>
        </div>
      </motion.div>
    </div>
  );
} 