"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/contexts/I18nContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import NoDataMessage from "@/components/NoDataMessage";
import { toast } from "react-hot-toast";
import CategoryTable, { Category } from "@/views/admin/CategoryTable";
import { apiClient } from "@/services/api-client";
import CategoryFormModal from '@/components/CategoryFormModal';
import type { AxiosError } from 'axios';

export default function AdminCategoriesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiClient.get("/categories");
      return Array.isArray(res.data) ? res.data : res.data.data;
    },
  });

  // Add category
  const addCategoryMutation = useMutation({
    mutationFn: async (cat: Omit<Category, "category_id" | "order" | "created_at">) => {
      await apiClient.post("/categories", cat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("categories.addedSuccessfully"));
      setShowFormModal(false);
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(t("categories.errorAdding"));
      }
    },
  });

  // Edit category
  const editCategoryMutation = useMutation({
    mutationFn: async ({ id, cat }: { id: number; cat: Partial<Category> }) => {
      await apiClient.put(`/categories/${id}`, cat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("categories.updatedSuccessfully"));
      setShowFormModal(false);
      setEditingCategory(null);
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(t("categories.errorUpdating"));
      }
    },
  });

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("categories.deletedSuccessfully"));
      setShowDeleteModal(false);
      setSelectedCategory(null);
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(t("categories.errorDeleting"));
      }
    },
  });

  // Reorder categories
  const reorderMutation = useMutation({
    mutationFn: async (order: number[]) => {
      await apiClient.put("/categories/order", { order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("categories.reorderedSuccessfully"));
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(t("categories.errorReordering"));
      }
    },
  });

  // Filtered categories
  const categories: Category[] = (data || []).filter((cat: Category) => {
    if (!searchTerm) return true;
    return (
      cat.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.name_ar.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handlers
  const handleAdd = () => {
    setEditingCategory(null);
    setShowFormModal(true);
  };
  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setShowFormModal(true);
  };
  const handleDelete = (id: number) => {
    const cat = categories.find((c) => c.category_id === id) || null;
    setSelectedCategory(cat);
    setShowDeleteModal(true);
  };
  const handleReorder = (newOrder: number[]) => {
    reorderMutation.mutate(newOrder);
  };
  const handleFormSubmit = (formData: Omit<Category, 'category_id' | 'order' | 'created_at'>) => {
    if (editingCategory) {
      editCategoryMutation.mutate({ id: editingCategory.category_id, cat: formData });
    } else {
      addCategoryMutation.mutate(formData);
    }
  };
  const confirmDelete = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.category_id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{t("categories.errorLoading")}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
    <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("categories.title")}</h1>
        <p className="text-gray-600">{t("categories.managementDesc")}</p>
      </div>
      {/* Search & Add */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder={t("categories.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition"
        >
          {t("categories.add")}
        </button>
      </div>
      {/* Table */}
      <CategoryTable
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />
      {/* No Data */}
      {categories.length === 0 && <NoDataMessage type="default" customMessage={t("categories.noCategoriesFound")} />}
      {/* Add/Edit Modal */}
      {showFormModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => { setShowFormModal(false); setEditingCategory(null); }}
          onSave={handleFormSubmit}
          isLoading={addCategoryMutation.isPending || editCategoryMutation.isPending}
        />
      )}
      {/* Delete Modal */}
      {showDeleteModal && selectedCategory && (
        <DeleteConfirmationModal
          onClose={() => { setShowDeleteModal(false); setSelectedCategory(null); }}
          onConfirm={confirmDelete}
          isLoading={deleteCategoryMutation.isPending}
        />
      )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">{t("categories.delete")}</h2>
        <p className="mb-6">{t("categories.confirm_delete")}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={isLoading}
          >
            {t("categories.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            disabled={isLoading}
          >
            {t("categories.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function isAxiosError(error: unknown): error is AxiosError<{ error: string }> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
} 