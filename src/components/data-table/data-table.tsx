import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table as ReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** Click handler for a row. Receives the row's original record. */
  onRowClick?: (row: TData) => void;
  pagination?: {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
  };
}

/**
 * Thin wrapper around `@tanstack/react-table` for paginated server lists.
 * No client-side sorting/filter state — admin lists are typically
 * server-paginated, and embedding state here would muddy the URL-search-
 * params source of truth that pages keep.
 */
export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "Ma'lumot yo'q",
  onRowClick,
  pagination,
}: DataTableProps<TData>): React.ReactElement {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border bg-card">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b bg-muted/40">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-3 text-left align-middle font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-muted-foreground"
                >
                  <Spinner className="mx-auto h-5 w-5" />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'border-b transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent/40',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? <Pagination {...pagination} /> : null}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: PaginationProps): React.ReactElement {
  return (
    <div className="flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground">
        {page} / {Math.max(1, totalPages)}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Oldingi sahifa"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Keyingi sahifa"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Re-export the type so feature pages can declare columns without an extra
// import path.
export type { ColumnDef, ReactTable };
