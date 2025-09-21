"use client";
import { useEffect, useState, useRef } from "react";
import { getAdminReviews, updateAdminReview, deleteAdminReview, AdminReview } from "@/services/admin-api";
import { useI18n } from '@/contexts/I18nContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import * as XLSX from 'xlsx';

export default function AdminReviewsPage() {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<{ rating: number; comment: string }>({ rating: 0, comment: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    getAdminReviews({ page, limit: pageSize, search })
      .then(res => {
        setReviews(Array.isArray(res.data) ? res.data : []);
        setTotal(res.total || 0);
      })
      .catch(() => setError("Failed to fetch reviews"))
      .finally(() => setLoading(false));
  }, [page, search]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearch(searchInput);
    }
  };

  const handleEdit = (review: AdminReview) => {
    setEditId(review.review_id);
    setEditValue({ rating: review.rating, comment: review.comment });
  };

  const handleSave = async () => {
    if (editId == null) return;
    setSaving(true);
    try {
      await updateAdminReview(editId, editValue);
      setReviews((prev) => prev.map((r) => (r.review_id === editId ? { ...r, ...editValue } : r)));
      setEditId(null);
    } catch {
      setError("Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId == null) return;
    setDeleting(confirmDeleteId);
    try {
      await deleteAdminReview(confirmDeleteId);
      setReviews((prev) => prev.filter((r) => r.review_id !== confirmDeleteId));
      setConfirmDeleteId(null);
    } catch {
      setError("Failed to delete review");
    } finally {
      setDeleting(null);
    }
  };

  // Export reviews to Excel (fetch all, not just current page)
  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews({ page: 1, limit: 0, search });
      const allReviews = res.data || [];
      const data = allReviews.map(r => ({
        [t('admin.productId')]: r.product_id,
        [t('admin.product')]: r.product_name || '',
        [t('admin.customer')]: r.customer_name || '',
        [t('admin.rating')]: r.rating,
        [t('admin.comment')]: r.comment,
        [t('admin.created')]: new Date(r.created_at).toLocaleString(),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reviews');
      XLSX.writeFile(wb, 'reviews_export.xlsx');
    } catch {
      setError('Failed to export reviews');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{t('common.reviews')}</h1>
      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          ref={searchInputRef}
          type="text"
          className="border rounded px-3 py-2 w-full max-w-md focus:ring-2 focus:ring-theme-main transition-all duration-300"
          placeholder={t('admin.searchUsersPlaceholder') || "Search reviews..."}
          value={searchInput}
          onChange={handleSearchInput}
          onKeyDown={handleSearchKeyDown}
        />
        {search && (
          <button
            className="ml-2 text-gray-400 hover:text-gray-700 transition-colors"
            onClick={() => { setSearch(""); searchInputRef.current?.focus(); }}
            aria-label={t('admin.clearSearch') || "Clear search"}
          >
            ×
          </button>
        )}
        <button
          className="ml-2 px-4 py-2 bg-theme-main text-white rounded hover:bg-theme-main/90 transition"
          onClick={handleExport}
        >
          {t('payments.exportExcel') || 'Export to Excel'}
        </button>
      </div>
      {loading ? (
        <div className="text-gray-500 animate-pulse">{t("admin.loading")}</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.productId')}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.customer')}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.rating')}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.comments')}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.created')}</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.isArray(reviews) && reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 animate-fade-in">{t('admin.noDataAvailable')}</td>
                </tr>
              ) : (
                (Array.isArray(reviews) ? reviews : []).map((review) => (
                  <tr
                    key={review.review_id}
                    className={`transition-all duration-300 ${editId === review.review_id ? "bg-yellow-50" : ""} animate-fade-in`}
                  >
                    <td className="px-4 py-2 text-center whitespace-nowrap">{review.product_name || review.product_id}</td>
                    <td className="px-4 py-2 text-center whitespace-nowrap">{review.customer_name || review.customer_id}</td>
                    <td className="px-4 py-2 text-center whitespace-nowrap">
                      {editId === review.review_id ? (
                        <input
                          type="number"
                          min={1}
                          max={5}
                          className="border rounded px-2 py-1 w-16"
                          value={editValue.rating}
                          onChange={e => setEditValue(v => ({ ...v, rating: Number(e.target.value) }))}
                          disabled={saving}
                        />
                      ) : (
                        review.rating
                      )}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap max-w-xs">
                      {editId === review.review_id ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={editValue.comment}
                          onChange={e => setEditValue(v => ({ ...v, comment: e.target.value }))}
                          disabled={saving}
                        />
                      ) : (
                        <span className="block truncate" title={review.comment}>{review.comment}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center whitespace-nowrap text-xs text-gray-500">{new Date(review.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-center whitespace-nowrap flex gap-2 justify-center">
                      {editId === review.review_id ? (
                        <>
                          <button
                            className="bg-theme-main text-white px-3 py-1 rounded hover:bg-theme-main/90 transition disabled:opacity-50"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? t('admin.saving') : t('admin.save')}
                          </button>
                          <button
                            className="text-gray-500 hover:text-gray-800 px-2 py-1"
                            onClick={() => setEditId(null)}
                            disabled={saving}
                          >
                            {t('admin.cancel')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                            onClick={() => handleEdit(review)}
                          >
                            {t('admin.edit')}
                          </button>
                          <button
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                            onClick={() => handleDelete(review.review_id)}
                            disabled={deleting === review.review_id}
                          >
                            {deleting === review.review_id ? t('admin.deleting') : t('admin.delete')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('table.previous') || 'Prev'}
            </button>
            <span>{page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {t('table.next') || 'Next'}
            </button>
          </div>
        )}
        </>
      )}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title={t('banners.confirmDelete')}
        message={''}
        confirmText={t('admin.delete')}
        cancelText={t('admin.cancel')}
        isLoading={deleting !== null}
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteId(null)}
      />
    </div>
  );
} 