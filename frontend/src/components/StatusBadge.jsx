const config = {
  TO_DO: { label: 'To Do', className: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-orange-100 text-orange-700' },
  DONE: { label: 'Done', className: 'bg-green-100 text-green-700' },
}

export default function StatusBadge({ status }) {
  const { label, className } = config[status] ?? config.TO_DO
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
