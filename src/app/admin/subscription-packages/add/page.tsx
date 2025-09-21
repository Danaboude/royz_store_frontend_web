"use client";
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import SubscriptionPackageForm from '@/views/admin/SubscriptionPackageForm';
import { subscriptionPackagesApi } from '@/services/api-client';
import type { SubscriptionPackage } from '@/views/admin/SubscriptionPackagesTable';

export default function AddSubscriptionPackagePage() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: Omit<SubscriptionPackage, 'package_id' | 'created_at'>) => subscriptionPackagesApi.create(payload),
    onSuccess: () => {
      toast.success(t('subscriptionPackages.addSuccess'));
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      router.push('/admin/subscription-packages');
    },
    onError: () => toast.error(t('subscriptionPackages.addError')),
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t('subscriptionPackages.addPackage')}</h1>
      <SubscriptionPackageForm
        onSubmit={async (data) => { await mutation.mutateAsync(data); }}
        loading={mutation.isPending}
      />
    </div>
  );
} 