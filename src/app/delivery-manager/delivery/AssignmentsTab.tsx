"use client";

import { useI18n } from '@/contexts/I18nContext';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { getUnassignedOrders, getAvailableDeliveryPersonnel, assignOrderToDelivery } from '@/services/admin-api';
import React, { useState } from "react";

type Order = {
  order_id: number;
  customer_name?: string;
  customer_id?: number;
  status: string;
};

type Personnel = {
  delivery_id: number;
  name: string;
  zone_name?: string;
  zone?: string;
};

// Define a type for the error response
type ErrorResponse = {
  response?: {
    data?: {
      error?: string;
    };
    message?: string;
  };
};

export default function AssignmentsTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["unassigned-orders"],
    queryFn: getUnassignedOrders
  });
  const { data: personnelData, isLoading: personnelLoading, error: personnelError } = useQuery({
    queryKey: ["available-personnel"],
    queryFn: getAvailableDeliveryPersonnel
  });
  
  const assignMutation = useMutation({
    mutationFn: ({ orderId, deliveryId, notes }: { orderId: number, deliveryId: number, notes?: string }) => assignOrderToDelivery(orderId, deliveryId, notes),
    onSuccess: () => {
      toast.success(t("delivery.assignmentsSuccess") || "Order assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["unassigned-orders"] });
      queryClient.invalidateQueries({ queryKey: ["available-personnel"] });
    },
    onError: (error: ErrorResponse) => {
      console.error('Assignment error:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.message || t("delivery.assignmentsError") || "Failed to assign order";
      toast.error(errorMessage);
    }
  });

  // Track selected personnel for each order
  const [selectedPersonnel, setSelectedPersonnel] = useState<{ [orderId: number]: string }>({});
  // Track notes for each order
  const [notes, setNotes] = useState<{ [orderId: number]: string }>({});

  if (ordersLoading || personnelLoading) return <LoadingSpinner />;

  if (ordersError || personnelError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          {ordersError && <p>Error loading orders: {ordersError.message}</p>}
          {personnelError && <p>Error loading personnel: {personnelError.message}</p>}
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["unassigned-orders"] });
            queryClient.invalidateQueries({ queryKey: ["available-personnel"] });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const orders: Order[] = ordersData?.data || [];
  const personnel: Personnel[] = personnelData?.data || [];

  const handleSelectChange = (orderId: number, value: string) => {
    setSelectedPersonnel((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleAssign = (orderId: number) => {
    const deliveryId = selectedPersonnel[orderId];
    if (!deliveryId || deliveryId === "") {
      toast.error(t("delivery.assignTo") + ": " + (t("delivery.selectPersonnel") || "Please select a delivery personnel first."));
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Assigning order...");

    assignMutation.mutate(
      { orderId, deliveryId: Number(deliveryId), notes: notes[orderId] },
      {
        onSettled: () => {
          toast.dismiss(loadingToast);
        }
      }
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{t("delivery.assignments")}</h2>

      {/* Status Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">{t("Available Orders:")}</span> {orders.length}
          </div>
          <div>
            <span className="font-semibold">{t("Available Personnel:")}</span> {personnel.length}
          </div>
          <div>
            <span className="font-semibold">{t("Processing Orders:")}</span> {orders.filter(o => o.status === 'processing').length}
          </div>
          <div>
            <span className="font-semibold">{t("Pending Orders:")}</span> {orders.filter(o => o.status === 'pending').length}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          {t("delivery.noUnassignedOrders") || "No unassigned orders."}
        </div>
      ) : personnel.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          No available delivery personnel.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-center text-xs  font-medium text-gray-500 uppercase tracking-wider">{t("admin.orderId")}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.customer")}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.status")}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t("delivery.assignments")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-center text-sm font-medium text-gray-900">#{order.order_id}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {order.customer_name || `Customer ${order.customer_id}`}
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {t(`delivery.status.${order.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedPersonnel[order.order_id] ?? ""}
                        onChange={e => handleSelectChange(order.order_id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={assignMutation.isPending}
                      >
                        <option value="" disabled>{t("delivery.assignTo") || "Assign to..."}</option>
                        {personnel.map((p) => (
                          <option key={p.delivery_id} value={p.delivery_id}>
                            {p.name} ({p.zone_name || p.zone || 'No Zone'})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={notes[order.order_id] || ""}
                        onChange={e => setNotes(prev => ({ ...prev, [order.order_id]: e.target.value }))}
                        placeholder={t("delivery.notes") || "Notes"}
                        className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ minWidth: 120 }}
                        disabled={assignMutation.isPending}
                      />
                      <button
                        className={`px-3 py-1 text-sm rounded font-medium ${assignMutation.isPending
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        onClick={() => handleAssign(order.order_id)}
                        disabled={assignMutation.isPending}
                      >
                        {assignMutation.isPending ? "Assigning..." : (t("delivery.assignments") || "Assign")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
