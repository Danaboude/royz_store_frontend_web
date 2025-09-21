"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Edit, 
  Save,
  X,
  User, 
  Truck, 
  Phone, 
  MapPin, 
  Star,
  CheckCircle,
  XCircle,
  Mail,
  Shield,
  Award
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getDeliveryPersonnelList,
  updateDeliveryPersonnel,
  DeliveryPersonnel,
  getDeliveryZones,
} from '@/services/delivery-api';

interface DeliveryPersonnelForm extends Omit<DeliveryPersonnel, 'delivery_id' | 'rating' | 'total_deliveries' | 'zone_id'> {
  password?: string;
  zone_id?: number;
  address?: string;
}

export default function DeliveryPersonnelPage() {
  const { t } = useI18n();
  const { user, isLoggedIn } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Debug user state
    // Debug effect to track user data changes
  useEffect(() => {
    console.log('User data changed:', {
      isLoggedIn,
      user: user ? {
        id: user.id,
        roleId: user.roleId,
        delivery_id: user.delivery_id,
        email: user.email
      } : null
    });
  }, [user, isLoggedIn]);

  // Force refetch queries when user data becomes complete
  useEffect(() => {
    if (isLoggedIn && user?.roleId === 6) {
            queryClient.invalidateQueries({ queryKey: ["delivery-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    }
  }, [isLoggedIn, user, queryClient]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<DeliveryPersonnelForm>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is logged in and is delivery personnel
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/delivery-signin');
      return;
    }
    if (user?.roleId && Number(user.roleId) !== 6) {
      router.push('/delivery-dashboard');
      return;
    }
  }, [user, isLoggedIn, router]);

  const { data: personnelList = [], isLoading } = useQuery({
    queryKey: ["delivery-personnel"],
    queryFn: async () => {
      const res = await getDeliveryPersonnelList();
      return res;
    },
    enabled: Boolean(isLoggedIn && user?.roleId && Number(user.roleId) === 6),
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: zonesData, isLoading: zonesLoading, error: zonesError } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const res = await getDeliveryZones();
      
      return res;
    },
    enabled: Boolean(isLoggedIn && user?.roleId && Number(user.roleId) === 6),
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  // Find the current user's personnel data
  const currentPersonnel = user?.delivery_id ? personnelList.find(
    (personnel: DeliveryPersonnel) => personnel.delivery_id === user.delivery_id
  ) : null;



  const editPersonnelMutation = useMutation({
    mutationFn: async ({ id, personnel }: { id: number; personnel: Partial<DeliveryPersonnel> }) => {
      await updateDeliveryPersonnel(id, personnel as DeliveryPersonnel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-personnel"] });
      toast.success(t("delivery.profileUpdated"));
      setIsEditing(false);
      setIsSaving(false);
    },
    onError: () => {
      toast.error(t("delivery.errorUpdate"));
      setIsSaving(false);
    },
  });

  const handleEdit = () => {
    if (currentPersonnel) {
      setFormData({
        name: currentPersonnel.name || "",
        phone: currentPersonnel.phone || "",
        vehicle_type: currentPersonnel.vehicle_type || "",
        vehicle_number: currentPersonnel.vehicle_number || "",
        is_available: currentPersonnel.is_available ?? true,
        zone_id: currentPersonnel.zone_id || undefined,
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
        setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : (name === 'zone_id' ? Number(value) : value)
      };
            return newData;
    });
  };

  const handleSave = async () => {
    if (!currentPersonnel || !user?.delivery_id) return;
    
    setIsSaving(true);
    try {
      await editPersonnelMutation.mutateAsync({ 
        id: user.delivery_id, 
        personnel: formData 
      });
    } catch {
      setIsSaving(false);
    }
  };

  // Wait for user data to be fully loaded
  if (!isLoggedIn || !user || (user?.roleId && Number(user.roleId) !== 6)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-left">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">
            {!isLoggedIn ? t("delivery.checkingAuthentication") : 
             !user ? "Loading user data..." :
             t("delivery.checkingAuthentication")}
          </p>
        </div>
      </div>
    );
  }

  // Show warning if delivery_id is missing but allow the page to load
  if (!user?.delivery_id) {
    console.warn('Delivery ID missing for delivery personnel:', user);
  }

  // Show loading if queries are disabled due to missing user data
  if (!user?.delivery_id && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-left">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading delivery profile...</p>
          <p className="text-sm text-gray-500 mt-2">
            User ID: {user?.id}, Role: {user?.roleId}, Delivery ID: {user?.delivery_id}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner />;
  
  // Show message if delivery_id is missing
  if (!user?.delivery_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Delivery Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            Your delivery profile could not be loaded. This might be due to a temporary issue.
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => router.push('/delivery-signin')} 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!currentPersonnel) return <div className="text-red-500">{t("delivery.profileNotFound")}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left mb-8"
        >
          <h1 className="text-3xl font-bold text-black mb-2">{t("delivery.myProfile")}</h1>
          <p className="text-gray-700">{t("delivery.manageProfile")}</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-8 bg-white text-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold">
                    {currentPersonnel.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black">{currentPersonnel.name}</h2>
                  <p className="text-gray-700">{currentPersonnel.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {currentPersonnel.is_available ? (
                      <CheckCircle className="w-5 h-5 text-gray-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-700">
                      {currentPersonnel.is_available ? t("delivery.available") : t("delivery.unavailable")}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={isEditing ? handleCancel : handleEdit}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gray-200 hover:bg-gray-300 shadow`}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>{t("common.cancel")}</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    <span>{t("delivery.editProfile")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {isEditing ? (
              /* Edit Form */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t("delivery.fullName")}
                     </label>
                     <input
                       type="text"
                       name="name"
                       value={formData.name || ""}
                       onChange={handleChange}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t("delivery.phoneNumber")}
                     </label>
                     <input
                       type="tel"
                       name="phone"
                       value={formData.phone || ""}
                       onChange={handleChange}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t("delivery.deliveryZone")}
                     </label>
                     <select
                       name="zone_id"
                       value={formData.zone_id ? String(formData.zone_id) : ''}
                       onChange={handleChange}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                       disabled={zonesLoading}
                     >
                       <option value="">{zonesLoading ? t("delivery.loadingZones") : t("delivery.selectDeliveryZone")}</option>
                       {zonesError && (
                         <option value="" disabled>{t("delivery.errorLoadingZones")}</option>
                       )}
                       {Array.isArray(zonesData) && zonesData.length > 0 ? (
                         zonesData.map((zone: {name_ar: string; zone_id: number; name_en: string; name?: string }) => (
                           <option key={zone.zone_id} value={zone.zone_id}>
                             {zone.name_ar || zone.name || `Zone ${zone.zone_id}`}
                           </option>
                         ))
                       ) : !zonesLoading && !zonesError ? (
                         <option value="" disabled>{t("delivery.noZonesAvailable")}</option>
                       ) : null}
                     </select>
                     {formData.zone_id && (
                       <p className="text-xs text-green-600 mt-1">
                         {t("delivery.selectedZoneId")}: {formData.zone_id}
                       </p>
                     )}
                     {zonesError && (
                       <p className="text-red-500 text-sm mt-1">{t("delivery.failedToLoadZones")}</p>
                     )}
                     {!zonesLoading && !zonesError && zonesData && (
                       <p className="text-xs text-gray-500 mt-1">
                         {t("delivery.availableZones")}: {Array.isArray(zonesData) ? zonesData.length : t("delivery.invalidData")}
                       </p>
                     )}
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t("delivery.vehicleType")}
                     </label>
                     <select
                       name="vehicle_type"
                       value={formData.vehicle_type || ""}
                       onChange={handleChange}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                     >
                       <option value="">{t("common.select")} {t("delivery.vehicleType")}</option>
                       <option value="truck">{t("delivery.truck")}</option>
                       <option value="car">{t("delivery.car")}</option>
                       <option value="motorcycle">{t("delivery.motorcycle")}</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t("delivery.vehicleNumber")}
                     </label>
                     <input
                       type="text"
                       name="vehicle_number"
                       value={formData.vehicle_number || ""}
                       onChange={handleChange}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {t("common.address")}
                     </label>
                     <textarea
                       name="address"
                       value={formData.address || ""}
                       onChange={handleChange}
                       rows={3}
                       placeholder={t("common.address")}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                     />
                   </div>
                 </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_available"
                      checked={formData.is_available || false}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t("delivery.availableForDeliveries")}</span>
                  </label>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {t("common.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t("delivery.saveChanges")}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* View Mode */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                                 {/* Contact Information */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white rounded-xl p-6 border border-gray-200">
                     <div className="flex items-center space-x-3 mb-4">
                       <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                         <User className="w-5 h-5 text-gray-600" />
                       </div>
                       <h3 className="text-lg font-semibold text-black">{t("delivery.personalInformation")}</h3>
                     </div>
                     <div className="space-y-3">
                       <div className="flex items-center space-x-3">
                         <Mail className="w-4 h-4 text-gray-400" />
                         <span className="text-gray-700">{currentPersonnel.email}</span>
                       </div>
                       <div className="flex items-center space-x-3">
                         <Phone className="w-4 h-4 text-gray-400" />
                         <span className="text-gray-700">{currentPersonnel.phone}</span>
                       </div>
                       <div className="flex items-center space-x-3">
                         <MapPin className="w-4 h-4 text-gray-400" />
                         <span className="text-gray-700">
                           {currentPersonnel.zone_name_ar|| t("delivery.noZoneAssigned")}
                         </span>
                       </div>
                       {currentPersonnel.zone_id && (
                         <div className="flex items-center space-x-3">
                           <span className="text-xs text-gray-500">
                             {t("delivery.zoneId")}: {currentPersonnel.zone_id}
                           </span>
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="bg-white rounded-xl p-6 border border-gray-200">
                     <div className="flex items-center space-x-3 mb-4">
                       <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                         <Truck className="w-5 h-5 text-gray-600" />
                       </div>
                       <h3 className="text-lg font-semibold text-black">{t("delivery.vehicleInformation")}</h3>
                     </div>
                     <div className="space-y-3">
                       <div className="flex items-center space-x-3">
                         <Truck className="w-4 h-4 text-gray-400" />
                         <span className="text-gray-700 capitalize">{currentPersonnel.vehicle_type}</span>
                       </div>
                       <div className="flex items-center space-x-3">
                         <span className="text-gray-700">{currentPersonnel.vehicle_number}</span>
                       </div>
                     </div>
                   </div>
                 </div>

                                 {/* Stats Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white text-black rounded-xl p-6 shadow">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-gray-500 text-sm font-medium">{t("delivery.totalDeliveries")}</p>
                         <p className="text-2xl font-bold">{currentPersonnel.total_deliveries || 0}</p>
                       </div>
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                         <Award className="w-6 h-6 text-gray-600" />
                       </div>
                     </div>
                   </div>

                   <div className="bg-white text-black rounded-xl p-6 shadow">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-gray-500 text-sm font-medium">{t("delivery.rating")}</p>
                         <p className="text-2xl font-bold">{currentPersonnel.rating || 0}/5</p>
                       </div>
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                         <Star className="w-6 h-6 text-gray-600" />
                       </div>
                     </div>
                   </div>

                   <div className="bg-white text-black rounded-xl p-6 shadow">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-gray-500 text-sm font-medium">{t("delivery.statuss")}</p>
                         <p className="text-2xl font-bold">
                           {currentPersonnel.is_available ? t("delivery.active") : t("delivery.inactive")}
                         </p>
                       </div>
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                         {currentPersonnel.is_available ? (
                           <CheckCircle className="w-6 h-6 text-gray-600" />
                         ) : (
                           <XCircle className="w-6 h-6 text-gray-600" />
                         )}
                       </div>
                     </div>
                   </div>
                 </div>

                                 {/* Verification Status */}
                 {currentPersonnel.is_verified && (
                   <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                     <div className="flex items-center space-x-3">
                       <Shield className="w-6 h-6 text-gray-600" />
                       <div>
                                                <h3 className="text-lg font-semibold text-black">{t("delivery.verifiedAccount")}</h3>
                       <p className="text-gray-700">{t("delivery.accountVerified")}</p>
                       </div>
                     </div>
                   </div>
                 )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 