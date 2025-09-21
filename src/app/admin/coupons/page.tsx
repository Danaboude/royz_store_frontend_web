'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon, Coupon } from '@/services/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function CouponsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getAdminCoupons,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  const createMutation = useMutation({
    mutationFn: (coupon: Coupon) => createCoupon(coupon),
    onSuccess: () => {
      toast.success(t('coupons.addedSuccessfully'));
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => toast.error(t('coupons.errorAdding')),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, coupon }: { id: number; coupon: Coupon }) => updateCoupon(id, coupon),
    onSuccess: () => {
      toast.success(t('coupons.updatedSuccessfully'));
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => toast.error(t('coupons.errorUpdating')),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: () => {
      toast.success(t('coupons.deletedSuccessfully'));
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => toast.error(t('coupons.errorDeleting')),
  });

  function handleAdd() {
    setEditCoupon(null);
    setDialogOpen(true);
  }
  function handleEdit(coupon: Coupon) {
    setEditCoupon(coupon);
    setDialogOpen(true);
  }
  function handleDelete(id: number) {
    if (window.confirm(t('coupons.confirm_delete'))) {
      deleteMutation.mutate(id);
    }
  }

  function handleDialogSubmit(coupon: Coupon) {
    if (editCoupon) {
      updateMutation.mutate({ id: editCoupon.coupon_id!, coupon });
    } else {
      createMutation.mutate(coupon);
    }
    setDialogOpen(false);
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('coupons.managementTitle')}</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleAdd}>{t('coupons.add')}</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white rounded shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">{t('coupons.code')}</th>
              <th className="px-4 py-2">{t('coupons.discountPercentage')}</th>
              <th className="px-4 py-2">{t('coupons.minOrderAmount')}</th>
              <th className="px-4 py-2">{t('coupons.maxUses')}</th>
              <th className="px-4 py-2">{t('coupons.usedCount')}</th>
              <th className="px-4 py-2">{t('coupons.expireAt')}</th>
              <th className="px-4 py-2">{t('coupons.isActive')}</th>
              <th className="px-4 py-2">{t('coupons.createdAt')}</th>
              <th className="px-4 py-2">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={10} className="text-center text-gray-500 py-8">{t('coupons.noCouponsFound')}</td></tr>
            ) : coupons.map((coupon: Coupon) => (
              <tr key={coupon.coupon_id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-center">{coupon.code}</td>
                <td className="px-4 py-2 text-center">{coupon.discount_percentage ?? '-'}</td>
                <td className="px-4 py-2 text-center">{coupon.min_order_amount ?? '-'}</td>
                <td className="px-4 py-2 text-center">{coupon.max_uses ?? '-'}</td>
                <td className="px-4 py-2 text-center">{coupon.used_count ?? '-'}</td>
                <td className="px-4 py-2 text-center">{coupon.expire_at ? coupon.expire_at.slice(0, 10) : '-'}</td>
                <td className="px-4 py-2 text-center">{coupon.is_active ? t('common.yes') : t('common.no')}</td>
                <td className="px-4 py-2 text-center">{coupon.created_at ? coupon.created_at.slice(0, 10) : '-'}</td>
                <td className="px-4 py-2 text-center flex gap-2 justify-center">
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600" onClick={() => handleEdit(coupon)}>{t('admin.edit')}</button>
                  <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" onClick={() => handleDelete(coupon.coupon_id!)}>{t('admin.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialogOpen && (
        <CouponDialog
          onClose={() => setDialogOpen(false)}
          onSubmit={handleDialogSubmit}
          initialCoupon={editCoupon}
        />
      )}
    </div>
  );
}

function CouponDialog({ onClose, onSubmit, initialCoupon }: {
  onClose: () => void;
  onSubmit: (coupon: Coupon) => void;
  initialCoupon: Coupon | null;
}) {
  const { t } = useI18n();
  const [coupon, setCoupon] = useState<Coupon>(initialCoupon || {
    code: '',
    discount_percentage: 0,
    discount_amount: 0,
    min_order_amount: 0,
    max_uses: 1,
    used_count: 0,
    expire_at: '',
    is_active: 1,
    created_at: ''
  });
  React.useEffect(() => {
    if (initialCoupon) setCoupon(initialCoupon);
  }, [initialCoupon]);
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    let value: string | number | boolean = e.target.value;
    if (e.target.name === 'is_active') {
      value = e.target.value === 'true';
    }
    setCoupon({ ...coupon, [e.target.name]: value });
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(coupon);
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <form className="bg-white p-6 rounded shadow space-y-4 min-w-[320px]" onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-2">{initialCoupon ? t('coupons.edit') : t('coupons.add')}</h2>
        <input name="code" value={coupon.code} onChange={handleChange} placeholder={t('coupons.code')} className="border rounded px-2 py-1 w-full" required />
        <input name="discount_percentage" value={coupon.discount_percentage ?? ''} onChange={handleChange} placeholder={t('coupons.discountPercentage')} className="border rounded px-2 py-1 w-full" type="number" />
        <input name="min_order_amount" value={coupon.min_order_amount ?? ''} onChange={handleChange} placeholder={t('coupons.minOrderAmount')} className="border rounded px-2 py-1 w-full" type="number" />
        <input name="max_uses" value={coupon.max_uses ?? ''} onChange={handleChange} placeholder={t('coupons.maxUses')} className="border rounded px-2 py-1 w-full" type="number" />
        <input name="expire_at" value={coupon.expire_at ? coupon.expire_at.slice(0, 10) : ''} onChange={handleChange} placeholder={t('coupons.expireAt')} className="border rounded px-2 py-1 w-full" type="date" />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1">
            <input type="radio" name="is_active" value="true" checked={coupon.is_active === true} onChange={handleChange} />
            {t('delivery.active')}
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="is_active" value="false" checked={coupon.is_active === false} onChange={handleChange} />
            {t('delivery.inactive')}
          </label>
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500" onClick={onClose}>{t('admin.cancel')}</button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">{t('admin.save')}</button>
        </div>
      </form>
    </div>
  );
} 