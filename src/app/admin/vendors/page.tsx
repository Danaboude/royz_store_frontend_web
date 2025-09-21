'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllVendorTypes, deleteVendor } from '@/services/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import { FiTrash2, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle, FiCalendar, FiBarChart, FiMonitor, FiX, FiPackage, FiDownload } from 'react-icons/fi';
import Link from 'next/link';
import SubscriptionAssignmentModal from '@/components/SubscriptionAssignmentModal';
import { toast } from 'react-hot-toast';
import ImageWithFallback from '@/components/ImageWithFallback';

interface VendorType {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_image: string;
  is_active: number;
  is_verified: number;
  created_at: string;
  role_id: number;
  role_name: string;
  business_name: string;
  business_license: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  vendor_type_id: number;
  type_name: string;
  commission_rate: number;
  subscription_id: number;
  start_date: string;
  end_date: string;
  subscription_status: string;
  payment_status: string;
  amount_paid: number;
  auto_renew: number;
  package_id: number;
  package_name: string;
  package_price: number;
  duration_months: number;
  days_remaining: number;
  subscriptionStatus: string;
  statusColor: string;
  owner_name: string | null;
  identity_number: string | null;
  tax_number: string | null;
  commercial_registration_number: string | null;
  commercial_registration_doc: string | null;
  tax_registration_doc: string | null;
  identity_doc: string | null;
  signature_authorization_doc: string | null;
  lease_or_ownership_doc: string | null;
  special_license_doc: string | null;
}

export default function VendorsAdminPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<VendorType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState({ isOpen: false, vendor: null as VendorType | null });

  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['all-vendor-types'],
    queryFn: getAllVendorTypes,
  });

  const DocumentLink = ({ href, label }: { href: string | null | undefined, label: string }) => {
    if (!href) {
      return <p><span className="font-medium">{label}:</span> N/A</p>;
    }
  
    return (
      <p>
        <span className="font-medium">{label}:</span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-blue-600 hover:underline inline-flex items-center"
        >
          {t('vendors.viewOrDownload')}
          <FiDownload className="ml-1" />
        </a>
      </p>
    );
  };

  // Mutations
  const deleteVendorMutation = useMutation({
    mutationFn: (id: number) => deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-vendor-types'] });
      setShowDeleteModal(false);
      setSelectedVendor(null);
    },
  });

  // Event handlers
  const handleDeleteVendor = (vendor: VendorType) => {
    setSelectedVendor(vendor);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedVendor) {
      deleteVendorMutation.mutate(selectedVendor.user_id);
    }
  };

  const handleAssignSubscription = (vendor: VendorType) => {
    setSubscriptionModal({ isOpen: true, vendor });
  };

  const handleSubscriptionSuccess = () => {
    toast.success(t('vendors.subscriptionAssigned'));
    // Invalidate the main vendors query
    queryClient.invalidateQueries({ queryKey: ['all-vendor-types'] });
    // Also invalidate any related queries
    queryClient.invalidateQueries({ queryKey: ['vendor-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-subscription-status'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  };

  // Filter and deduplicate vendors by user_id to avoid duplicate keys in rendering
  const filteredVendors = (vendors?.filter((vendor: VendorType) => {
    // Only show users with role_id 3, 4, 5 (actual vendors, not customers)
    if (vendor.role_id !== 3 && vendor.role_id !== 4 && vendor.role_id !== 5) {
      return false;
    }
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.type_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && vendor.subscriptionStatus === 'Active') ||
      (statusFilter === 'expiring' && (vendor.subscriptionStatus === 'Expiring Soon' || vendor.subscriptionStatus === 'Expiring Very Soon')) ||
      (statusFilter === 'expired' && vendor.subscriptionStatus === 'Expired') ||
      (statusFilter === 'no-subscription' && vendor.subscriptionStatus === 'No Subscription');
    const matchesRole = roleFilter === 'all' || vendor.role_id.toString() === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  }) || []).filter((vendor: VendorType, idx: number, arr: VendorType[]) =>
  arr.findIndex(v => v.user_id === vendor.user_id) === idx
);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'Expiring Soon':
      case 'Expiring Very Soon':
        return <FiAlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'Expired':
        return <FiXCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expiring Very Soon':
        return 'bg-orange-100 text-orange-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeColor = (roleId: number) => {
    switch (roleId) {
      case 1:
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-purple-100 text-purple-800';
      case 4:
        return 'bg-indigo-100 text-indigo-800';
      case 5:
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1:
        return t('vendorType.admin');
      case 2:
        return t('vendorType.customer');
      case 3:
        return t('vendorType.seller');
      case 4:
        return t('vendorType.realEstateAgent');
      case 5:
        return t('vendorType.factoryOwner');
      default:
        return t('vendorType.seller');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Active':
        return t('vendorStatus.active');
      case 'Expiring Soon':
        return t('vendorStatus.expiringSoon');
      case 'Expiring Very Soon':
        return t('vendorStatus.expiringVerySoon');
      case 'Expired':
        return t('vendorStatus.expired');
      case 'No Subscription':
        return t('vendorStatus.noSubscription');
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">{t('admin.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiXCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">Error loading vendors: {error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.vendors')}</h1>
              <p className="text-gray-600 mt-1">{t('vendors.dashboardDescription')}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{filteredVendors.length}</div>
              <div className="text-sm text-gray-500">{t('admin.totalVendors')}</div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/admin/vendors/analytics" className="group h-full">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 hover:border-blue-300 min-h-[180px] flex flex-col justify-between h-full">
                <FiBarChart className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                <h3 className="font-semibold text-blue-900 mb-1">{t('admin.title')}</h3>
                <p className="text-sm text-blue-700">{t('admin.subtitle')}</p>
              </div>
            </Link>
            <Link href="/admin/vendors/monitoring" className="group h-full">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200 hover:border-green-300 min-h-[180px] flex flex-col justify-between h-full">
                <FiMonitor className="w-8 h-8 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                <h3 className="font-semibold text-green-900 mb-1">{t('vendors.monitoring')}</h3>
                <p className="text-sm text-green-700">{t('vendors.monitoringDescription')}</p>
              </div>
            </Link>
        
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vendors.searchVendors')}
              </label>
              <input
                type="text"
                placeholder={t('vendors.searchVendorsPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.subscriptionStatus')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('admin.allStatuses')}</option>
                <option value="active">{t('admin.active')}</option>
                <option value="expiring">{t('admin.expiringSoon')}</option>
                <option value="expired">{t('admin.expired')}</option>
                <option value="no-subscription">{t('admin.noSubscription')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.vendorType')}
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('admin.allTypes')}</option>
                <option value="3">{t('admin.seller')}</option>
                <option value="4">{t('admin.realEstate')}</option>
                <option value="5">{t('admin.factory')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid gap-6">
          {filteredVendors.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <FiTrash2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('vendors.noVendorsFound')}</h3>
                <p className="text-gray-500">{t('admin.tryAdjustingSearch')}</p>
              </div>
            </div>
          ) : (
            filteredVendors.map((vendor: VendorType, idx: number) => (
              <div key={`${vendor.user_id}-${vendor.subscription_id ?? 'none'}-${idx}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
    <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                        {vendor.profile_image ? (
                          <ImageWithFallback
                            src={vendor.profile_image}
                            alt={vendor.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-bold text-lg">
                            {vendor.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {vendor.name}
                          <span className="text-xs text-gray-500 font-normal ml-2">{t('vendors.vendorId')}: {vendor.user_id}</span>
                        </h3>
                        <p className="text-sm text-gray-500">{vendor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(vendor.role_id)}`}>
                        {getRoleName(vendor.role_id)}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(vendor.subscriptionStatus)}`}>
                        {getStatusIcon(vendor.subscriptionStatus)}
                        <span className="ml-1">{getStatusLabel(vendor.subscriptionStatus)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">{t('admin.businessInformation')}</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">{t('admin.businessName')}:</span> {vendor.business_name || 'N/A'}</p>
                        <p><span className="font-medium">{t('admin.type')}:</span> {vendor.type_name || 'N/A'}</p>
                        <p><span className="font-medium">{t('admin.commissionRate')}:</span> {vendor.commission_rate ? `${vendor.commission_rate}%` : 'N/A'}</p>
                        <p><span className="font-medium">{t('admin.phone')}:</span> {vendor.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">{t('admin.subscriptionDetails')}</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">{t('admin.package')}:</span> {vendor.package_name || 'N/A'}</p>
                        <p><span className="font-medium">{t('admin.price')}:</span> {vendor.package_price ? `ل.س ${vendor.package_price}` : 'N/A'}</p>
                        <p><span className="font-medium">{t('admin.duration')}:</span> {vendor.duration_months ? `${vendor.duration_months} months` : 'N/A'}</p>
                        <p><span className="font-medium">{t('admin.autoRenew')}:</span> {vendor.auto_renew ? t('admin.yes') : t('admin.no')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vendor Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">{t('vendors.vendorDetails')}</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">{t('vendorSignup.ownerName')}:</span> {vendor.owner_name || 'N/A'}</p>
                        <p><span className="font-medium">{t('vendorSignup.identityNumber')}:</span> {vendor.identity_number || 'N/A'}</p>
                        <p><span className="font-medium">{t('vendorSignup.taxNumber')}:</span> {vendor.tax_number || 'N/A'}</p>
                        <p><span className="font-medium">{t('vendorSignup.commercialRegistrationNumber')}:</span> {vendor.commercial_registration_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">{t('vendorSignup.vendorDocuments')}</h4>
                      <div className="space-y-1 text-sm">
                        <DocumentLink href={`${process.env.NEXT_PUBLIC_API_URL}${vendor.commercial_registration_doc}`} label={t('vendorSignup.commercialRegistrationDoc')} />
                       <DocumentLink href={`${process.env.NEXT_PUBLIC_API_URL}${vendor.tax_registration_doc}`} label={t('vendorSignup.taxRegistrationDoc')} />
                        <DocumentLink href={`${process.env.NEXT_PUBLIC_API_URL}${vendor.identity_doc}`} label={t('vendorSignup.identityDoc')} />
                        <DocumentLink href={`${process.env.NEXT_PUBLIC_API_URL}${vendor.signature_authorization_doc}`} label={t('vendorSignup.signatureAuthorizationDoc')} />
                        <DocumentLink href={`${process.env.NEXT_PUBLIC_API_URL}${vendor.lease_or_ownership_doc}`} label={t('vendorSignup.leaseOrOwnershipDoc')} />
                        <DocumentLink href={`${process.env.NEXT_PUBLIC_API_URL}${vendor.special_license_doc}`} label={t('vendorSignup.specialLicenseDoc')} />
                      </div>
                    </div>
                  </div>

                  {/* Subscription Timeline */}
                  {vendor.subscription_id && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">{t('admin.subscriptionTimeline')}</h4>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{t('admin.start')}: {formatDate(vendor.start_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{t('admin.end')}: {formatDate(vendor.end_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 text-gray-400 mr-1" />
                          <span className={vendor.days_remaining <= 7 ? 'text-red-600 font-medium' : vendor.days_remaining <= 30 ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'}>
                            {vendor.days_remaining > 0 ? `${vendor.days_remaining} ${t('admin.daysRemaining')}` : t('admin.expired')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{t('admin.status')}: {vendor.is_active ? t('admin.active') : t('admin.inactive')}</span>
                      <span>•</span>
                      <span>{t('admin.verified')}: {vendor.is_verified ? t('admin.yes') : t('admin.no')}</span>
                      <span>•</span>
                      <span>{t('admin.joined')}: {formatDate(vendor.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleAssignSubscription(vendor)}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        <FiPackage className="w-4 h-4 mr-1" />
                        {t('vendors.assignSubscription')}
                      </button>
                      <button 
                        onClick={() => handleDeleteVendor(vendor)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <FiTrash2 className="w-4 h-4 mr-1" />
                        {t('admin.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Vendors</div>
            <div className="text-2xl font-bold text-gray-900">{filteredVendors.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Active Subscriptions</div>
            <div className="text-2xl font-bold text-green-600">
              {vendors?.filter((v: VendorType) => (v.role_id === 3 || v.role_id === 4 || v.role_id === 5) && v.subscriptionStatus === 'Active').length || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Expiring Soon</div>
            <div className="text-2xl font-bold text-yellow-600">
              {vendors?.filter((v: VendorType) => (v.role_id === 3 || v.role_id === 4 || v.role_id === 5) && (v.subscriptionStatus === 'Expiring Soon' || v.subscriptionStatus === 'Expiring Very Soon')).length || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Expired</div>
            <div className="text-2xl font-bold text-red-600">
              {vendors?.filter((v: VendorType) => (v.role_id === 3 || v.role_id === 4 || v.role_id === 5) && v.subscriptionStatus === 'Expired').length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">{t('admin.deleteVendor')}</h2>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {t('admin.deleteVendorConfirmation')} <strong>{selectedVendor.name}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteVendorMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteVendorMutation.isPending ? t('admin.deleting') : t('admin.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Assignment Modal */}
      {subscriptionModal.isOpen && subscriptionModal.vendor && (
        <SubscriptionAssignmentModal
          isOpen={subscriptionModal.isOpen}
          onClose={() => setSubscriptionModal({ isOpen: false, vendor: null })}
          vendor={subscriptionModal.vendor}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </div>
  );
} 