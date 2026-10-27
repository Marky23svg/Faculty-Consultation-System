import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  totalItems,
}) {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const to = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Rows per page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value))
            onPageChange(1)
          }}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span className="ml-1">
          {from}–{to} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) =>
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentPage) <= 1,
          )
          .reduce((acc, page, idx, arr) => {
            if (idx > 0 && page - arr[idx - 1] > 1) {
              acc.push('ellipsis-' + page)
            }
            acc.push(page)
            return acc
          }, [])
          .map((item) =>
            typeof item === 'string' ? (
              <span key={item} className="px-1 text-xs text-slate-400">…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`flex h-7 min-w-[28px] items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${
                  item === currentPage
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            ),
          )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
