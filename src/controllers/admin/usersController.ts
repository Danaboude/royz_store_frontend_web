import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateUser, deleteUser } from '@/services/admin-api';

export interface User {
  user_id: number;
  name: string;
  email: string;
  role_id: number;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}


export function useAdminUsers(page = 1, limit = 20, search = '') {
  return useQuery({
    queryKey: ['admin-users', page, limit, search],
    queryFn: ({ queryKey }) => {
      const [, page, limit, search] = queryKey as [string, number, number, string];
      return getAdminUsers({ page, limit, search });
    },
  });
}


  export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, user }: { id: number; user: Partial<User> }) =>
        updateUser(id, user),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      },
    });
  }

  export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: deleteUser,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      },
    });
  } 