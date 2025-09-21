'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { X, Search, User, Building, Factory } from 'lucide-react';
import { getAdminUsers } from '@/services/admin-api';

interface Vendor {
  user_id: number;
  name: string;
  email: string;
  role_id: number;
  vendor_type_id?: number;
  business_name?: string;
  subscription_status?: string;
}

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorSelect: (vendor: Vendor) => void;
  vendorTypeId?: number;
}

export default function VendorSelectionModal({
  isOpen,
  onClose,
  onVendorSelect,
  vendorTypeId
}: VendorSelectionModalProps) {
  const { t } = useI18n();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadVendors();
    }
  }, [isOpen]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAdminUsers({ page: 1, limit: 100 });
      const allVendors = response.data || [];
      
      // Filter for vendors only (role_id 3, 4, 5)
      const vendorUsers = allVendors.filter((user: Vendor) => 
        user.role_id === 3 || user.role_id === 4 || user.role_id === 5
      );

      // Filter by vendor type if specified
      const filteredVendors = vendorTypeId 
        ? vendorUsers.filter((vendor: Vendor) => vendor.vendor_type_id === vendorTypeId)
        : vendorUsers;

      setVendors(filteredVendors);
    } catch (err) {
      setError('Failed to load vendors');
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (roleId: number) => {
    switch (roleId) {
      case 3: return <User className="w-4 h-4" />;
      case 4: return <Building className="w-4 h-4" />;
      case 5: return <Factory className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 3: return t('vendorType.seller');
      case 4: return t('vendorType.realEstateAgent');
      case 5: return t('vendorType.factoryOwner');
      default: return t('vendorType.seller');
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    onVendorSelect(vendor);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('vendors.selectVendorForAssignment')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('vendors.selectVendorDescription')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('vendors.searchVendorsPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('admin.loading')}</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? t('vendors.noVendorsFound') : t('vendors.noVendorsAvailable')}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.user_id}
                  onClick={() => handleVendorSelect(vendor)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getRoleIcon(vendor.role_id)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{vendor.name}</h3>
                        <p className="text-sm text-gray-600">{vendor.email}</p>
                        {vendor.business_name && (
                          <p className="text-sm text-gray-500">{vendor.business_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleName(vendor.role_id)}
                      </span>
                      {vendor.subscription_status && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.subscription_status === 'Active' 
                              ? 'bg-green-100 text-green-800'
                              : vendor.subscription_status === 'Expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {vendor.subscription_status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 