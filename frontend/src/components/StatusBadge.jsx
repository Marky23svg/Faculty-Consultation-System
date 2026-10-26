const STATUS_STYLES = {
  pending: 'bg-[#fff5df] text-[#b57a18]',
  accepted: 'bg-[#e8f7ef] text-[#21865e]',
  declined: 'bg-[#fff0e8] text-[#cb6335]',
  cancelled: 'bg-[#f1f3f7] text-[#667287]',
  completed: 'bg-[#eef4ff] text-[#3767bd]',
  active: 'bg-[#e8f7ef] text-[#21865e]',
}

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Booked',
  declined: 'Declined',
  cancelled: 'Cancelled',
  completed: 'Completed',
  active: 'Active',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold ${
        STATUS_STYLES[status] || STATUS_STYLES.cancelled
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status] || status || 'Unknown'}
    </span>
  )
}
