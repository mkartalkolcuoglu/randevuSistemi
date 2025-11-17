'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Input } from '@repo/ui';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
  getValue?: (item: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({ 
  data, 
  columns, 
  keyExtractor, 
  emptyMessage = 'Veri bulunamadı',
  className = ''
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Handle filtering
  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Apply filters and sorting
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.keys(filters).forEach(columnKey => {
      const filterValue = filters[columnKey].toLowerCase().trim();
      if (filterValue) {
        const column = columns.find(col => col.key === columnKey);
        if (column) {
          result = result.filter(item => {
            const value = column.getValue 
              ? String(column.getValue(item))
              : String((item as any)[columnKey] || '');
            return value.toLowerCase().includes(filterValue);
          });
        }
      }
    });

    // Apply sorting
    if (sortColumn) {
      const column = columns.find(col => col.key === sortColumn);
      if (column) {
        result.sort((a, b) => {
          const aValue = column.getValue 
            ? column.getValue(a)
            : (a as any)[sortColumn];
          const bValue = column.getValue 
            ? column.getValue(b)
            : (b as any)[sortColumn];

          if (aValue === bValue) return 0;
          
          const comparison = aValue < bValue ? -1 : 1;
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, filters, sortColumn, sortDirection, columns]);

  // Get filterable columns
  const filterableColumns = columns.filter(col => col.filterable);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      {filterableColumns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filterableColumns.map(column => (
            <div key={column.key} className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {column.label}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={`${column.label} ara...`}
                  value={filters[column.key] || ''}
                  onChange={(e) => handleFilterChange(column.key, e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={`w-3 h-3 ${
                            sortColumn === column.key && sortDirection === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDown 
                          className={`w-3 h-3 -mt-1 ${
                            sortColumn === column.key && sortDirection === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map(item => (
                <tr key={keyExtractor(item)} className="hover:bg-gray-50">
                  {columns.map(column => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render 
                        ? column.render(item)
                        : String((item as any)[column.key] || '-')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Toplam {processedData.length} kayıt gösteriliyor
        {processedData.length !== data.length && ` (${data.length} kayıttan)`}
      </div>
    </div>
  );
}

