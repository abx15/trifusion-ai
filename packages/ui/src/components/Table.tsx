'use client';

import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string | number;
}

export interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn[];
  data: T[];
  onRowClick?: (row: T) => void;
  rowKey?: keyof T;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  rowKey = 'id' as keyof T,
  loading,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <span>Loading...</span>
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
        {emptyMessage}
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <MuiTable sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.875rem' }}
                align={col.align}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={String(row[rowKey])}
              hover
              onClick={() => onRowClick?.(row)}
              sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:hover': { backgroundColor: 'action.hover' } }}
            >
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align}>
                  {String(row[col.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
Table.displayName = 'Table';
