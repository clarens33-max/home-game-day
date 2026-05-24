export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="text-4xl mb-4 text-[#999]">
          {typeof icon === 'string' ? (
            <span role="img" aria-hidden="true">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <h3
        className="text-xl font-semibold text-[#1C1C1C] mb-1"
        style={{ fontFamily: 'Oswald, sans-serif' }}
      >
        {title}
      </h3>
      {subtitle && (
        <p className="text-[#999] text-sm mb-4 max-w-sm">{subtitle}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
