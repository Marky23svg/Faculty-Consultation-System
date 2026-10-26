export default function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-[0_3px_12px_rgba(38,62,101,0.04)] ${className}`}
    >
      {children}
    </div>
  )
}
