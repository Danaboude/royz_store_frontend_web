"use client";

import { useState } from "react";
import { useI18n } from '@/contexts/I18nContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getDeliveryPersonnel,
  addDeliveryPersonnel,
  updateDeliveryPersonnel,
  deleteDeliveryPersonnel,
  DeliveryPersonnel,
  getDeliveryZones,
  getDeliveryPersonnelEarnings
} from '@/services/admin-api';
import { ClipboardCopy } from 'lucide-react';

type DeliveryPersonnelForm = Omit<DeliveryPersonnel, 'delivery_id' | 'rating' | 'total_deliveries'> & { password?: string };

export default function PersonnelTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<DeliveryPersonnel | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<DeliveryPersonnel | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [selectedPersonnelForEarnings, setSelectedPersonnelForEarnings] = useState<DeliveryPersonnel | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["delivery-personnel"],
    queryFn: async () => {
      const res = await getDeliveryPersonnel();
      return Array.isArray(res) ? res : res.data;
    },
  });

  // Earnings query
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["delivery-personnel-earnings", selectedPersonnelForEarnings?.delivery_id],
    queryFn: async () => {
      if (!selectedPersonnelForEarnings?.delivery_id) return null;
      try {
        const result = await getDeliveryPersonnelEarnings(selectedPersonnelForEarnings.delivery_id);
        return result || {
          today_earnings: 0,
          this_week_earnings: 0,
          total_earnings: 0,
          today_deliveries: 0,
          this_week_deliveries: 0,
          total_deliveries: 0
        };
      } catch (error) {
        console.error('Error fetching earnings:', error);
        return {
          today_earnings: 0,
          this_week_earnings: 0,
          total_earnings: 0,
          today_deliveries: 0,
          this_week_deliveries: 0,
          total_deliveries: 0
        };
      }
    },
    enabled: !!selectedPersonnelForEarnings?.delivery_id && showEarningsModal,
  });

  const addPersonnelMutation = useMutation({
    mutationFn: async (personnel: Partial<DeliveryPersonnel>) => {
      await addDeliveryPersonnel(personnel as DeliveryPersonnel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-personnel"] });
      toast.success(t("delivery.addSuccess"));
      setShowFormModal(false);
      setEmailError(null);
    },
    onError: (err: AxiosError<{ error?: string }>) => {
      const msg = err?.response?.data?.error || err?.message || "";
      if (err?.response?.status === 409) {
        if (msg === 'Email already exists') {
          setEmailError(t('delivery.emailExistsForDelivery') || t('delivery.emailExists') || "Email already exists. Please use a different email for delivery personnel.");
        } else if (msg === 'Delivery personnel already exists for this email') {
          setEmailError(t('delivery.personnelAlreadyExists') || "Delivery personnel already exists for this email.");
        } else {
          setEmailError(t('delivery.emailExists') || "Email already exists. Please use a different email.");
        }
      } else {
        setEmailError(t('delivery.errorAdd'));
      }
    },
  });

  const editPersonnelMutation = useMutation({
    mutationFn: async ({ id, personnel }: { id: number; personnel: Partial<DeliveryPersonnel> }) => {
      await updateDeliveryPersonnel(id, personnel as DeliveryPersonnel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-personnel"] });
      toast.success(t("delivery.editSuccess"));
      setShowFormModal(false);
      setEditingPersonnel(null);
    },
    onError: () => {
      toast.error(t("delivery.errorEdit"));
    },
  });

  const deletePersonnelMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteDeliveryPersonnel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-personnel"] });
      toast.success(t("delivery.deleteSuccess"));
      setShowDeleteModal(false);
      setSelectedPersonnel(null);
    },
    onError: () => {
      toast.error(t("delivery.errorDelete"));
    },
  });

  const handleAdd = () => {
    setEditingPersonnel(null);
    setShowFormModal(true);
    setEmailError(null);
  };
  const handleEdit = (personnel: DeliveryPersonnel) => {
    setEditingPersonnel(personnel);
    setShowFormModal(true);
    setEmailError(null);
  };
  const handleDelete = (personnel: DeliveryPersonnel) => {
    setSelectedPersonnel(personnel);
    setShowDeleteModal(true);
  };
  const confirmDelete = () => {
    if (selectedPersonnel && typeof selectedPersonnel.delivery_id === 'number') {
      deletePersonnelMutation.mutate(selectedPersonnel.delivery_id);
    }
  };
  const handleShowEarnings = (personnel: DeliveryPersonnel) => {
    setSelectedPersonnelForEarnings(personnel);
    setShowEarningsModal(true);
  };
  const handleCloseEarnings = () => {
    setShowEarningsModal(false);
    setSelectedPersonnelForEarnings(null);
  };
  const handleFormSubmit = (formData: Partial<DeliveryPersonnelForm>) => {
    if (editingPersonnel && typeof editingPersonnel.delivery_id === 'number') {
      const { password, ...rest } = formData;
      const payload = password ? { ...rest, password } : rest;
      editPersonnelMutation.mutate({ id: editingPersonnel.delivery_id, personnel: payload });
    } else {
      addPersonnelMutation.mutate(formData);
    }
  };

  // Copy login link handler
  const handleCopyLoginLink = () => {
    const link = `${window.location.origin}/delivery-signin`;
    navigator.clipboard.writeText(link);
    toast.success(t('delivery.loginLinkCopied') || 'Login link copied!');
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{t("delivery.errorLoading")}</div>;

  const personnelList: DeliveryPersonnel[] = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("delivery.personnel")}</h1>
        <p className="text-gray-600">{t("delivery.title")}</p>
      </div>
      {/* Add & Copy Link Buttons */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
        >
          {t("delivery.addPersonnel")}
        </button>
        <button
          onClick={handleCopyLoginLink}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-200 border border-gray-300 transition"
        >
          <ClipboardCopy className="w-4 h-4" />
          {t('delivery.copyLoginLink') || 'Copy Login Link'}
        </button>
      </div>
      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.name")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.email")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.phone")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.zone")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.vehicleType")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.vehicleNumber")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.isAvailable")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.rating")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.totalDeliveries")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.isVerified")}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence initial={false}>
              {personnelList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500">
                    {t("delivery.noPersonnel")}
                  </td>
                </tr>
              ) : (
                personnelList.map((personnel, idx) => (
                  <motion.tr
                    key={personnel.delivery_id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="hover:bg-gray-50 transition-all"
                  >
                    <td className="px-4 py-3 text-center">{idx + 1}</td>
                    <td className="px-4 py-3 text-center">{personnel.name}</td>
                    <td className="px-4 py-3 text-center">{personnel.email}</td>
                    <td className="px-4 py-3 text-center">{personnel.phone}</td>
                    <td className="px-4 py-3 text-center">{personnel.zone}</td>
                    <td className="px-4 py-3 text-center">{personnel.vehicle_type}</td>
                    <td className="px-4 py-3 text-center">{personnel.vehicle_number}</td>
                    <td className="px-4 py-3 text-center">
                      {personnel.is_available ? (
                        <span className="text-green-600 font-bold">{t("delivery.active")}</span>
                      ) : (
                        <span className="text-gray-400">{t("delivery.inactive")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{personnel.rating}</td>
                    <td className="px-4 py-3 text-center">{personnel.total_deliveries}</td>
                    <td className="px-4 py-3 text-center">
                      {personnel.is_verified ? (
                        <span className="text-blue-600 font-bold">{t("delivery.isVerified")}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(personnel)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                        >
                          {t("admin.edit")}
                        </button>
                        <button
                          onClick={() => handleShowEarnings(personnel)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                        >
                          {t("delivery.earnings") || "Earnings"}
                        </button>
                        <button
                          onClick={() => handleDelete(personnel)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                        >
                          {t("admin.delete")}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {/* Add/Edit Modal */}
      {showFormModal && (
        <DeliveryPersonnelFormModal
          personnel={editingPersonnel}
          onClose={() => { setShowFormModal(false); setEditingPersonnel(null); setEmailError(null); }}
          onSave={handleFormSubmit}
          isLoading={addPersonnelMutation.isPending || editPersonnelMutation.isPending}
          emailError={emailError}
          clearEmailError={() => setEmailError(null)}
        />
      )}
      {/* Delete Modal */}
      {showDeleteModal && selectedPersonnel && (
        <DeleteConfirmationModal
          onClose={() => { setShowDeleteModal(false); setSelectedPersonnel(null); }}
          onConfirm={confirmDelete}
          isLoading={deletePersonnelMutation.isPending}
        />
      )}
      {/* Earnings Modal */}
      {showEarningsModal && selectedPersonnelForEarnings && (
        <EarningsModal
          personnel={selectedPersonnelForEarnings}
          earnings={earningsData}
          isLoading={earningsLoading}
          onClose={handleCloseEarnings}
        />
      )}
    </div>
  );
}

function DeliveryPersonnelFormModal({ personnel, onClose, onSave, isLoading, emailError, clearEmailError }: {
  personnel: DeliveryPersonnel | null;
  onClose: () => void;
  onSave: (formData: Partial<DeliveryPersonnelForm>) => void;
  isLoading: boolean;
  emailError?: string | null;
  clearEmailError?: () => void;
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<DeliveryPersonnelForm & { zone_id?: number }>>({
    name: personnel?.name || "",
    email: personnel?.email || "",
    phone: personnel?.phone || "",
    zone_id: (personnel && (personnel as DeliveryPersonnel & { zone_id?: number }).zone_id) || undefined,
    vehicle_type: personnel?.vehicle_type || "",
    vehicle_number: personnel?.vehicle_number || "",
    is_available: personnel?.is_available ?? true,
    is_verified: personnel?.is_verified ?? false,
    password: ""
  });
  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const res = await getDeliveryZones();
      return res.data || res;
    },
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'zone_id' ? Number(value) : (type === 'checkbox' ? checked : value)
    }));
    if (name === 'email' && emailError) {
      clearEmailError?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {personnel ? t("admin.edit") : t("delivery.addPersonnel")}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("delivery.name")} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("delivery.email")} *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("delivery.phone")} *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("delivery.zone")} *
            </label>
            <select
              name="zone_id"
              value={formData.zone_id ?? ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={zonesLoading}
            >
              <option value="">{zonesLoading ? t('common.loading') : t('common.selectOption') || '--'}</option>
              {Array.isArray(zonesData) && zonesData.map((zone: { zone_id: number; name_en: string }) => (
                <option key={zone.zone_id} value={zone.zone_id}>{zone.name_en}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("delivery.vehicleType")} *
            </label>
            <select
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t('common.selectOption') || '--'}</option>
              <option value="truck">{t('delivery.truck')}</option>
              <option value="car">{t('delivery.car')}</option>
              <option value="motorcycle">{t('delivery.motorcycle')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("delivery.vehicleNumber")} *
            </label>
            <input
              type="text"
              name="vehicle_number"
              value={formData.vehicle_number}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {!personnel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("admin.password")} *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!personnel}
              />
            </div>
          )}

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{t("delivery.isAvailable")}</span>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_verified"
                checked={formData.is_verified}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{t("delivery.isVerified")}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
            >
              {t("admin.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? t("admin.loading") : (personnel ? t("admin.save") : t("admin.add"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ onClose, onConfirm, isLoading }: {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { t } = useI18n();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t("admin.delete")}</h2>
        <p className="text-gray-600 mb-6">{t("delivery.deleteConfirmation")}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
          >
            {t("admin.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            {isLoading ? t("admin.loading") : t("admin.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EarningsData {
  today_earnings: number;
  this_week_earnings: number;
  total_earnings: number;
  today_deliveries: number;
  this_week_deliveries: number;
  total_deliveries: number;
}

function EarningsModal({ personnel, earnings, isLoading, onClose }: {
  personnel: DeliveryPersonnel;
  earnings: EarningsData | null;
  isLoading: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {t("delivery.earnings") || "Earnings"} - {personnel.name}
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : earnings ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">
                  {t("delivery.todayEarnings") || "Today's Earnings"}
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {Number(earnings.today_earnings || 0).toFixed(2)} ل.س
                </p>
                <p className="text-sm text-green-600">
                  {earnings.today_deliveries || 0} {t("delivery.deliveries") || "deliveries"}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">
                  {t("delivery.thisWeekEarnings") || "This Week's Earnings"}
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {Number(earnings.this_week_earnings || 0).toFixed(2)} ل.س
                </p>
                <p className="text-sm text-blue-600">
                  {earnings.this_week_deliveries || 0} {t("delivery.deliveries") || "deliveries"}
                </p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">
                {t("delivery.totalEarnings") || "Total Earnings"}
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {Number(earnings.total_earnings || 0).toFixed(2)} ل.س
              </p>
              <p className="text-sm text-purple-600">
                {earnings.total_deliveries || 0} {t("delivery.deliveries") || "deliveries"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t("delivery.noEarningsData") || "No earnings data available"}
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition"
          >
            {t("admin.close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
} 