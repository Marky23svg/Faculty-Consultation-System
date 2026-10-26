export default function Select({
  label,
  id,
  name,
  error,
  hint,
  className = '',
  children,
  ...props
}) {
  const inputId = id || name
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[11px] font-bold text-slate-600"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        name={name}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-[11px] text-red-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[11px] text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
}
