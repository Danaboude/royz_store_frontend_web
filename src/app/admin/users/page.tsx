'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, deleteUser, updateUser } from '@/services/admin-api';
import { useI18n } from '@/contexts/I18nContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import NoDataMessage from '@/components/NoDataMessage';
import { toast } from 'react-hot-toast';
import Image from 'next/image';


interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_image: string | null;
  role_name: string;
  role_id: number;
  total_earnings?: number;
}

interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string; // Added for password update
  [key: string]: unknown;
}

export default function AdminUsersPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [filterRole, setFilterRole] = useState<string>('all');
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const USERS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // Fetch users with server-side pagination and search
  const { data, isLoading, error } = useQuery<{ users: User[]; total: number }, Error>({
    queryKey: ['users', currentPage, searchTerm],
    queryFn: () => getAdminUsers({ page: currentPage, limit: USERS_PER_PAGE, search: searchTerm })
  });
  const users = data && Array.isArray(data.users) ? data.users : [];
  const total = data && typeof data.total === 'number' ? data.total : 0;
  const totalPages = Math.ceil(total / USERS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('admin.userDeletedSuccessfully'));
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : t('admin.errorDeletingUser');
      toast.error(errorMessage);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdateData }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('admin.userUpdatedSuccessfully'));
      setShowEditModal(false);
      setEditingUser(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : t('admin.errorUpdatingUser');
      toast.error(errorMessage);
    },
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.user_id);
    }
  };

  function isAxiosError(error: unknown): error is { response?: { data?: { error?: string } } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as Record<string, unknown>).response === 'object'
    );
  }

  const handleUpdateUser = async (formData: UserUpdateData) => {
    if (editingUser) {
      setEditModalError(null);
      try {
        await updateUserMutation.mutateAsync({ id: editingUser.user_id, data: formData });
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.data?.error === 'PHONE_ALREADY_USED') {
          setEditModalError(t('common.phoneAlreadyUsed'));
        } else {
          setEditModalError((error as Error)?.message || t('admin.errorUpdatingUser'));
        }
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading users</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.usersManagement')}</h1>
        <p className="text-gray-600">{t('admin.usersManagementDesc')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.searchUsers')}
            </label>
            <input
              type="text"
              placeholder={t('admin.searchUsersPlaceholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearchTerm(inputValue);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.filterByRole')}
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('admin.allRoles')}</option>
              <option value="admin">{t('admin.admin')}</option>
              <option value="customer">{t('admin.customer')}</option>
              <option value="support agent">{t('admin.support agent')}</option>
              <option value="real estate agent">{t('admin.real estate agent')}</option>
              <option value="factory owner">{t('admin.factory owner')}</option>
              <option value="delivery personnel">{t('admin.delivery personnel')}</option>
              <option value="seller">{t('admin.seller')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {users.length === 0 ? (
          <NoDataMessage type="default" customMessage={t('admin.noUsersFound')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('notifications.userId') || 'User ID'}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.user')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.role')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.contact')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t('admin.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: User) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {user.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profile_image ? (
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.profile_image}
                              alt={user.name}
                              width={40} // Set the width according to your design
                              height={40} // Set the height according to your design
                              priority // Optional: Use this if the image is critical for the page
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="px-6 ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role_name === 'Admin' ? 'bg-red-100 text-red-800' :
                          user.role_name === 'Vendor' ? 'bg-blue-100 text-blue-800' :
                            user.role_name === 'Customer' ? 'bg-green-100 text-green-800' :
                              user.role_name === 'Support Agent' ? 'bg-purple-100 text-purple-800' :
                                user.role_name === 'Real Estate Agent' ? 'bg-indigo-100 text-indigo-800' :
                                  user.role_name === 'Factory Owner' ? 'bg-orange-100 text-orange-800' :
                                    user.role_name === 'Delivery Personnel' ? 'bg-teal-100 text-teal-800' :
                                      user.role_name === 'Seller' ? 'bg-pink-100 text-pink-800' :
                                        'bg-gray-100 text-gray-800'
                        }`}>
                        {t(`admin.${user.role_name.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      <div>{user.phone || t('admin.noPhone')}</div>
                      <div className="text-gray-500">{user.address || t('admin.noAddress')}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${locale === 'ar' ? 'text-center' : 'text-left'}`}>
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('admin.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('admin.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4">
                <button
                  className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('table.previous')}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded border ${page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('table.next')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.totalUsers')}</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.admins')}</div>
          <div className="text-2xl font-bold text-red-600">
            {users.filter((u: User) => u.role_name === 'Admin').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.vendors')}</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter((u: User) => [3, 4, 5].includes(u.role_id)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.customers')}</div>
          <div className="text-2xl font-bold text-green-600">
            {users.filter((u: User) => u.role_name === 'Customer').length}
          </div>
        </div>
      </div>

      {/* Additional Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.support agent')}</div>
          <div className="text-2xl font-bold text-purple-600">
            {users.filter((u: User) => u.role_name === 'Support Agent').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.real estate agent')}</div>
          <div className="text-2xl font-bold text-indigo-600">
            {users.filter((u: User) => u.role_name === 'Real Estate Agent').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.factory owner')}</div>
          <div className="text-2xl font-bold text-orange-600">
            {users.filter((u: User) => u.role_name === 'Factory Owner').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.delivery personnel')}</div>
          <div className="text-2xl font-bold text-teal-600">
            {users.filter((u: User) => u.role_name === 'Delivery Personnel').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.seller')}</div>
          <div className="text-2xl font-bold text-pink-600">
            {users.filter((u: User) => u.role_id === 3).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.realEstate')}</div>
          <div className="text-2xl font-bold text-indigo-600">
            {users.filter((u: User) => u.role_id === 4).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">{t('admin.factory')}</div>
          <div className="text-2xl font-bold text-orange-600">
            {users.filter((u: User) => u.role_id === 5).length}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => { setShowEditModal(false); setEditModalError(null); }}
          onSave={handleUpdateUser}
          isLoading={updateUserMutation.isPending}
          error={editModalError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteConfirmationModal
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          isLoading={deleteUserMutation.isPending}
        />
      )}
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave, isLoading, error }: {
  user: User;
  onClose: () => void;
  onSave: (data: UserUpdateData) => void;
  isLoading: boolean;
  error?: string | null;
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    password?: string;
  }>({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (error) setFormError(error);
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    // Password validation
    if (password || confirmPassword) {
      if (password.length < 6) {
        setFormError(t('changePasswordDialog.passwordTooShort'));
        return;
      }
      if (password !== confirmPassword) {
        setFormError(t('changePasswordDialog.passwordsNotMatch'));
        return;
      }
    }
    // Prepare data
    const dataToSend = { ...formData };
    if (password) dataToSend.password = password;
    onSave(dataToSend);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('admin.editUser')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.address')}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('changePasswordDialog.newPassword')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('changePasswordDialog.newPasswordPlaceholder')}
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('changePasswordDialog.confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('changePasswordDialog.confirmPasswordPlaceholder')}
              minLength={6}
            />
          </div>
          {formError && (
            <div className="text-red-500 text-sm mb-2">{formError}</div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              {t('admin.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ user, onClose, onConfirm, isLoading }: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">
            {t('admin.deleteUser')}
          </h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              {t('admin.deleteUserConfirmation').replace('{name}', user.name)}
            </p>
          </div>
          <div className="items-center px-4 py-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
            >
              {isLoading ? t('admin.deleting') : t('admin.delete')}
            </button>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {t('admin.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 