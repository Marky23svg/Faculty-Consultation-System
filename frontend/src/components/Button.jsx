const VARIANTS = {
  primary:
    'border-transparent bg-blue-600 text-white shadow-[0_3px_8px_rgba(45,101,213,0.12)] hover:bg-blue-700 focus-visible:ring-blue-500',
  secondary:
    'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-blue-500',
  danger:
    'border-transparent bg-red-600 text-white shadow-[0_3px_8px_rgba(220,38,38,0.12)] hover:bg-red-700 focus-visible:ring-red-500',
  success:
    'border-transparent bg-emerald-600 text-white shadow-[0_3px_8px_rgba(37,150,104,0.12)] hover:bg-emerald-700 focus-visible:ring-emerald-500',
  ghost:
    'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-blue-500',
}

const SIZES = {
  sm: 'min-h-8 px-3 text-[11px]',
  md: 'min-h-[38px] px-3.5 text-xs',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  type,
  ...props
}) {
  const componentProps = Component === 'button' ? { type: type || 'button' } : {}

  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...componentProps}
      {...props}
    />
  )
}
