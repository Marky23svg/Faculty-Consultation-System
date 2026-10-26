export default function Table({
  columns,
  rows,
  keyField = '_id',
  emptyMessage = 'No records found.',
  loading = false,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`border-b border-slate-200 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 first:pl-5 last:pr-5 ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-xs text-slate-500"
              >
                Loading...
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-xs text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row, rowIndex) => (
              <tr
                key={row[keyField] ?? rowIndex}
                className="transition-colors hover:bg-slate-50/70"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3.5 text-xs text-slate-600 first:pl-5 last:pr-5 ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(row)
                      : row[column.key] ?? '�?"'}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
