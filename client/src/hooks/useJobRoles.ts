import { useQuery } from '@tanstack/react-query';
import type { JobRole } from '@shared/schema';

export function useJobRoles(type?: 'department' | 'client_role') {
  return useQuery<JobRole[]>({
    queryKey: type ? ['/api/job-roles', type] : ['/api/job-roles'],
    queryFn: async () => {
      const url = type ? `/api/job-roles?type=${type}` : '/api/job-roles';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch job roles');
      }
      return response.json();
    },
  });
}

export function useDepartments() {
  return useJobRoles('department');
}

export function useClientRoles() {
  return useJobRoles('client_role');
}