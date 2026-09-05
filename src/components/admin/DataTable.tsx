import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import { Skeleton } from '../ui/skeleton'
import { ScrollArea } from '../ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render: (row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  isError?: boolean
  onRetry?: () => void
  totalCount?: number
  page?: number
  pageSize?: number
  onPageChange?: (p: number) => void
  onPageSizeChange?: (s: number) => void
  onSort?: (key: string, dir: 'asc' | 'desc') => void
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  selectedIds?: Set<number | string>
  onSelectChange?: (ids: Set<number | string>) => void
  getRowId?: (row: T) => number | string
  toolbar?: React.ReactNode
  emptyMessage?: string
}

// ─── Empty State SVG ──────────────────────────────────────────────────────────

const EmptyIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="80" height="55" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/>
    <rect x="35" y="25" width="50" height="20" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
    <path d="M20 62h80" stroke="#cbd5e1" strokeWidth="1.5"/>
    <path d="M40 76h40M40 86h25" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="85" cy="38" r="18" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2"/>
    <path d="M78 38h14M85 31v14" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

// ─── DataTable ────────────────────────────────────────────────────────────────

export default function DataTable<T>({
  data, columns, loading = false,
  isError = false, onRetry,
  totalCount = 0, page = 0, pageSize = 10,
  onPageChange, onPageSizeChange,
  onSort, sortKey, sortDir,
  selectedIds, onSelectChange, getRowId,
  toolbar, emptyMessage = 'Không có dữ liệu',
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasSelection = !!getRowId && !!onSelectChange && !!selectedIds
  const rowIds = hasSelection ? data.map(r => getRowId!(r)) : []
  const allSelected = hasSelection && rowIds.length > 0 && rowIds.every(id => selectedIds!.has(id))
  const someSelected = hasSelection && rowIds.some(id => selectedIds!.has(id)) && !allSelected

  const handleSort = (key: string) => {
    if (!onSort) return
    const current = (sortKey === key && sortDir) || localSort?.key === key ? localSort?.dir || sortDir : undefined
    const nextDir = current === 'asc' ? 'desc' : 'asc'
    setLocalSort({ key, dir: nextDir })
    onSort(key, nextDir)
  }

  const toggleAll = () => {
    if (!hasSelection) return
    if (allSelected) onSelectChange!(new Set([...selectedIds!].filter(id => !rowIds.includes(id))))
    else onSelectChange!(new Set([...selectedIds!, ...rowIds]))
  }

  const toggleRow = (id: number | string) => {
    if (!hasSelection) return
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelectChange!(next)
  }

  const activeSortKey = sortKey || localSort?.key
  const activeSortDir = sortDir || localSort?.dir

  const pageStart = page * pageSize + 1
  const pageEnd = Math.min((page + 1) * pageSize, totalCount)

  // build page window
  const pageNums: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pageNums.push(i)
  } else {
    const left = Math.max(0, Math.min(page - 2, totalPages - 5))
    const right = Math.min(totalPages - 1, left + 4)
    if (left > 0) { pageNums.push(0); if (left > 1) pageNums.push('ellipsis') }
    for (let i = left; i <= right; i++) pageNums.push(i)
    if (right < totalPages - 1) {
      if (right < totalPages - 2) pageNums.push('ellipsis')
      pageNums.push(totalPages - 1)
    }
  }

  return (
    <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>
      {toolbar && (
        <div className="px-5 py-4 border-b border-gray-100">{toolbar}</div>
      )}

      {isError && (
        <div className="flex items-center justify-between mx-5 my-3 px-4 py-2.5 rounded border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">Không tải được dữ liệu</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
            >
              <span className="text-xs">↺</span> Tải lại
            </button>
          )}
        </div>
      )}

      <ScrollArea className="w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f8f5ee]/70">
                {hasSelection && (
                  <th className="w-10 px-4 py-3 text-left">
                    <Checkbox
                      checked={allSelected}
                      ref={el => { if (el) (el as unknown as HTMLInputElement).indeterminate = someSelected }}
                      onCheckedChange={toggleAll}
                      aria-label="Chọn tất cả"
                    />
                  </th>
                )}
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500 whitespace-nowrap
                      ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                      ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                    style={col.width ? { width: col.width } : {}}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className={`inline-flex items-center gap-1 ${activeSortKey === col.key ? '' : ''}`}
                      style={activeSortKey === col.key ? { color: '#0a1628' } : {}}>
                      {col.header}
                      {col.sortable && (
                        activeSortKey === col.key
                          ? activeSortDir === 'asc'
                            ? <ArrowUp size={12} />
                            : <ArrowDown size={12} />
                          : <ArrowUpDown size={12} className="text-gray-400" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {hasSelection && (
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-4 rounded" />
                        </td>
                      )}
                      {columns.map(col => (
                        <td key={col.key} className="px-4 py-3">
                          <Skeleton className="h-4 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length + (hasSelection ? 1 : 0)} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <EmptyIllustration />
                        <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
                      </div>
                    </td>
                  </tr>
                )
                : data.map((row, i) => {
                    const rowId = hasSelection ? getRowId!(row) : i
                    const isSelected = hasSelection && selectedIds!.has(rowId)
                    return (
                      <tr
                        key={String(rowId)}
                        className={`border-b border-gray-50 transition-colors
                          ${isSelected ? 'bg-blue-50/40' : 'hover:bg-[#f8f5ee]/50'}`}
                      >
                        {hasSelection && (
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(rowId)}
                              aria-label={`Chọn dòng ${i + 1}`}
                            />
                          </td>
                        )}
                        {columns.map(col => (
                          <td
                            key={col.key}
                            className={`px-4 py-3
                              ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                          >
                            {col.render(row)}
                          </td>
                        ))}
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Pagination */}
      {(totalCount > 0 || (onPageChange && totalPages > 1)) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {totalCount > 0
              ? `Hiển thị ${pageStart.toLocaleString('vi-VN')}–${pageEnd.toLocaleString('vi-VN')} của ${totalCount.toLocaleString('vi-VN')}`
              : ''}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 0 || loading}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            {pageNums.map((p, idx) =>
              p === 'ellipsis'
                ? <span key={`e${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                : (
                  <button
                    key={p}
                    onClick={() => onPageChange?.(p as number)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${p === page ? 'text-white' : 'border border-gray-200 text-gray-600 hover:bg-[#f8f5ee]'}`}
                    style={p === page ? { backgroundColor: '#0a1628' } : {}}
                  >
                    {(p as number) + 1}
                  </button>
                )
            )}

            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {onPageSizeChange && (
            <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map(s => (
                  <SelectItem key={s} value={String(s)}>{s} / trang</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  )
}
