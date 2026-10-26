const TONES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
}

export default function Alert({ tone = 'info', className = '', children }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3.5 py-3 text-xs font-medium leading-5 ${TONES[tone] || TONES.info} ${className}`}
    >
      {children}
    </div>
  )
}
