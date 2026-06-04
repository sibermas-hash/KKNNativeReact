import { useDeferredValue, useState } from 'react';

export function useUserFilters() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const activeFilterCount = [deferredSearch, roleFilter, statusFilter, facultyFilter].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setFacultyFilter('');
    setPage(1);
  };

  return {
    search,
    setSearch,
    deferredSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    facultyFilter,
    setFacultyFilter,
    page,
    setPage,
    perPage,
    setPerPage,
    activeFilterCount,
    hasActiveFilters,
    resetFilters,
  };
}
