'use client'

const PREVIEW_ROWS = 10

interface DataPreviewProps {
  headers: string[]
  rows: Record<string, string>[]
}

export function DataPreview({ headers, rows }: DataPreviewProps) {
  const preview = rows.slice(0, PREVIEW_ROWS)

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(h => (
                <th
                  key={h}
                  className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-100"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                {headers.map(h => (
                  <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[140px] truncate">
                    {row[h] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Showing {preview.length} of {rows.length} row{rows.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
