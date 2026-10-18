import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchQuery?: string;
  searchKeys?: (keyof T)[];
  title?: string;
  serverSide?: boolean;
  totalItems?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  onSortChange?: (key: keyof T, direction: 'asc' | 'desc') => void;
}

export function DataTable<T>({ 
  columns, data, pageSize = 10, searchQuery = '', searchKeys = [], title,
  serverSide = false, totalItems = 0, page = 1, onPageChange, loading = false, onRowClick, onSortChange
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = serverSide ? page : internalPage;

  const handlePageChange = (newPage: number) => {
    if (serverSide && onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (onSortChange) {
      onSortChange(key, direction);
    }
  };

  const filteredData = useMemo(() => {
    if (serverSide) return data;
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key];
        if (typeof val === 'string') return val.toLowerCase().includes(lowerQuery);
        if (typeof val === 'number') return val.toString().includes(lowerQuery);
        return false;
      });
    });
  }, [data, searchQuery, searchKeys, serverSide]);

  const sortedData = useMemo(() => {
    if (serverSide) return filteredData;
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig, serverSide]);

  const totalLength = serverSide ? totalItems : sortedData.length;
  const totalPages = Math.ceil(totalLength / pageSize);
  const paginatedData = serverSide ? sortedData : sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => {
    if (!serverSide) setInternalPage(1);
  }, [searchQuery, serverSide]);

  // Generate pagination pages
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#0F172A]">{title}</h2>
          <span className="text-sm text-gray-500">{totalLength} records</span>
        </div>
      )}
      <div className="overflow-x-auto min-h-[400px]">
        <Table>
          <TableHeader className="bg-[#0F172A] hover:bg-[#0F172A]">
            <TableRow className="hover:bg-[#0F172A] border-none">
              {columns.map((col, index) => (
                <TableHead 
                  key={index} 
                  className={`text-white py-4 ${col.sortable ? 'cursor-pointer select-none hover:bg-slate-800' : ''} ${col.className || ''}`}
                  onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    {col.header}
                    {col.sortable && col.accessorKey && sortConfig?.key === col.accessorKey && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />
                    )}
                    {col.sortable && col.accessorKey && sortConfig?.key !== col.accessorKey && (
                      <ChevronDown size={14} className="text-gray-500 opacity-50" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500">
                  <div className="flex justify-center items-center h-full">
                    <span className="animate-spin h-6 w-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} className={`py-4 ${col.className || ''}`}>
                      {col.cell ? col.cell(item) : col.accessorKey ? (item[col.accessorKey] as React.ReactNode) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-base font-medium">No results found.</p>
                    <p className="text-sm mt-1 text-gray-400">Try adjusting your search criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{((currentPage - 1) * pageSize) + (paginatedData.length > 0 ? 1 : 0)}</span> to <span className="font-medium text-gray-900">{((currentPage - 1) * pageSize) + paginatedData.length}</span> of <span className="font-medium text-gray-900">{totalLength}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1 hidden sm:flex">
              {getPageNumbers().map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === 'number' && handlePageChange(p)}
                  disabled={p === '...' || loading}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === p 
                      ? 'bg-[#1D4ED8] text-white shadow-sm' 
                      : p === '...'
                      ? 'text-gray-400 cursor-default'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
