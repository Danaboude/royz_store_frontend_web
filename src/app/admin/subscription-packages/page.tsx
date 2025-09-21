"use client";

import { useI18n } from "@/contexts/I18nContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import SubscriptionPackagesTable from '@/views/admin/SubscriptionPackagesTable';
import { subscriptionPackagesApi } from '@/services/api-client';
import type { SubscriptionPackage } from '@/views/admin/SubscriptionPackagesTable';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AdminSubscriptionPackagesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch packages
  const { data, isLoading, error } = useQuery<SubscriptionPackage[]>({
    queryKey: ['subscription-packages'],
    queryFn: async () => {
      const res: { data: unknown } = await subscriptionPackagesApi.getAll();
      if (Array.isArray(res.data)) {
        return res.data as SubscriptionPackage[];
      } else if (
        res.data &&
        typeof res.data === 'object' &&
        'data' in res.data &&
        Array.isArray((res.data as { data: unknown }).data)
      ) {
        return (res.data as { data: SubscriptionPackage[] }).data;
      }
      // Fallback: always return an array
      return [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => subscriptionPackagesApi.delete(id),
    onSuccess: () => {
      toast.success(t('admin.deletedSuccessfully'));
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
    },
    onError: () => {
      toast.error(t('admin.errorDeleting'));
    },
  });

  // Handlers for navigation
  const handleAdd = () => {
    router.push('/admin/subscription-packages/add');
  };
  const handleEdit = (pkg: SubscriptionPackage) => {
    router.push(`/admin/subscription-packages/edit/${pkg.package_id}`);
  };
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (deleteId != null) {
      deleteMutation.mutate(deleteId);
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };
  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  if (isLoading) return <div className="py-8 text-center">Loading...</div>;
  if (error) return <div className="text-red-500">{t('subscriptionPackages.errorLoading') || 'Error loading packages.'}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("admin.subscriptionPackages")}</h1>
          <p className="text-gray-600">{t("subscriptionPackages.managementDesc")}</p>
        </div>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={handleAdd}
        >
          {t('subscriptionPackages.addPackage')}
        </button>
      </div>
      {/* Table */}
      <SubscriptionPackagesTable
        packages={data || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('admin.confirmDeleteTitle') || 'Delete Subscription Package'}
        message={t('admin.confirmDeleteDesc') || 'Are you sure you want to delete this package? This action cannot be undone.'}
        confirmText={t('admin.delete') || 'Delete'}
        cancelText={t('admin.cancel') || 'Cancel'}
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={handleCancelDelete}
      />
    </div>
  );
} 