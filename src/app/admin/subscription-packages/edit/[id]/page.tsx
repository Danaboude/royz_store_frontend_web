"use client";
import { useRouter, useParams } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import SubscriptionPackageForm from '@/views/admin/SubscriptionPackageForm';
import { subscriptionPackagesApi } from '@/services/api-client';
import type { SubscriptionPackage } from '@/views/admin/SubscriptionPackagesTable';

export default function EditSubscriptionPackagePage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = Number(params?.id);

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription-packages', id],
    queryFn: async () => {
      const res = await subscriptionPackagesApi.getAll();
      const pkg = Array.isArray(res.data) ? res.data.find((p: SubscriptionPackage) => String(p.package_id) === String(id)) : null;
      return pkg;
    },
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async (payload: Omit<SubscriptionPackage, 'package_id' | 'created_at'>) => subscriptionPackagesApi.update(id, payload),
    onSuccess: () => {
      toast.success(t('subscriptionPackages.editSuccess'));
      queryClient.invalidateQueries({ queryKey: ['subscription-packages'] });
      router.push('/admin/subscription-packages');
    },
    onError: () => toast.error(t('subscriptionPackages.editError')),
  });

  if (isLoading) return <div className="py-8 text-center">{t('admin.loading')}</div>;
  if (error || !data) return <div className="text-red-500">{t('subscriptionPackages.errorLoading')}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t('subscriptionPackages.editPackage')}</h1>
      <SubscriptionPackageForm
        initialData={data}
        onSubmit={async (formData) => { await mutation.mutateAsync(formData); }}
        loading={mutation.isPending}
      />
    </div>
  );
} 