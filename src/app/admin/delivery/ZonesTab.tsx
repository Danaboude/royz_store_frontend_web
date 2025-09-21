"use client";

import { useI18n } from '@/contexts/I18nContext';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getDeliveryZones, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone } from '@/services/admin-api';
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";

type Zone = {
  zone_id: number;
  name_en: string;
  name_ar?: string;
  description?: string;
  delivery_fee: number;
  estimated_delivery_time: number;
};

function ZoneDialog({
  open,
  onClose,
  onSubmit,
  initialZone,
  title
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (zone: { name_en: string; name_ar: string; description?: string; delivery_fee: number; estimated_delivery_time: number }) => void;
  initialZone?: Partial<Zone>;
  title: string;
}) {
  const { t } = useI18n();
  const [zone, setZone] = useState<Partial<Zone>>(initialZone || {});
  React.useEffect(() => {
    setZone(initialZone || {});
  }, [initialZone, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!zone.name_en || !zone.name_ar || zone.delivery_fee === undefined || zone.estimated_delivery_time === undefined) return;
            onSubmit({
              name_en: zone.name_en,
              name_ar: zone.name_ar,
              description: zone.description || "",
              delivery_fee: zone.delivery_fee,
              estimated_delivery_time: zone.estimated_delivery_time
            });
          }}
        >
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder={t("delivery.zoneName") || "Zone Name (EN)"}
              value={zone.name_en || ""}
              onChange={e => setZone((z: Partial<Zone>) => ({ ...z, name_en: e.target.value }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="text"
              placeholder={t("delivery.zoneName") + " (AR)" || "Zone Name (AR)"}
              value={zone.name_ar || ""}
              onChange={e => setZone((z: Partial<Zone>) => ({ ...z, name_ar: e.target.value }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="text"
              placeholder={t("delivery.description") || "Description"}
              value={zone.description || ""}
              onChange={e => setZone((z: Partial<Zone>) => ({ ...z, description: e.target.value }))}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder={t("delivery.deliveryFee") || "Delivery Fee"}
              value={zone.delivery_fee || ""}
              onChange={e => setZone((z: Partial<Zone>) => ({ ...z, delivery_fee: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
            <input
              type="number"
              placeholder={t("delivery.estimatedDeliveryTime") || "Estimated Time (h)"}
              value={zone.estimated_delivery_time || ""}
              onChange={e => setZone((z: Partial<Zone>) => ({ ...z, estimated_delivery_time: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500" onClick={onClose}>{t("admin.cancel") || "Cancel"}</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">{t("admin.save") || "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ZonesTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: getDeliveryZones
  });
  const zones: Zone[] = data?.data || [];

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>("add");
  const [dialogZone, setDialogZone] = useState<Partial<Zone> | undefined>(undefined);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (zone: { name_en: string; name_ar: string; description?: string; delivery_fee: number; estimated_delivery_time: number }) => createDeliveryZone(zone),
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ zone_id, zone }: { zone_id: number, zone: { name_en: string; name_ar: string; description?: string; delivery_fee: number; estimated_delivery_time: number } }) => updateDeliveryZone(zone_id, zone),
    onSuccess: () => {
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (zone_id: number) => deleteDeliveryZone(zone_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    }
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{t("delivery.zones")}</h2>
      <button
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={() => {
          setDialogMode("add");
          setDialogZone(undefined);
          setDialogOpen(true);
        }}
      >
        {t("delivery.addZone") || "Add Zone"}
      </button>
      {zones.length === 0 ? (
        <div className="text-gray-500 text-center py-12">{t("delivery.noZones") || "No zones found."}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">{t("delivery.zoneName")}</th>
              <th className="px-4 py-2">{t("delivery.description")}</th>
              <th className="px-4 py-2">{t("delivery.deliveryFee")}</th>
              <th className="px-4 py-2">{t("delivery.estimatedDeliveryTime")}</th>
              <th className="px-4 py-2">{t("admin.actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.zone_id}>
                <td className="px-4 py-2 text-center">{zone.name_en}</td>
                <td className="px-4 py-2 text-center">{zone.description}</td>
                <td className="px-4 py-2 text-center">{zone.delivery_fee}</td>
                <td className="px-4 py-2 text-center">{zone.estimated_delivery_time} h</td>
                <td className="px-4 py-2 text-center flex gap-2 justify-center">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    onClick={() => {
                      setDialogMode("edit");
                      setDialogZone(zone);
                      setDialogOpen(true);
                    }}
                  >
                    {t("admin.edit") || "Edit"}
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    onClick={() => deleteMutation.mutate(zone.zone_id)}
                  >
                    {t("admin.delete") || "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Dialog for Add/Edit */}
      <ZoneDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(zone) => {
          if (dialogMode === "add") {
            createMutation.mutate(zone);
          } else if (dialogZone?.zone_id) {
            updateMutation.mutate({ zone_id: dialogZone.zone_id, zone });
          }
        }}
        initialZone={dialogZone}
        title={dialogMode === "add" ? (t("delivery.addZone") || "Add Zone") : (t("admin.edit") || "Edit Zone")}
      />
    </div>
  );
} 