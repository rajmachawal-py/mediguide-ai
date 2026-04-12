/**
 * MediGuide AI — Spinner
 * Loading spinner with optional text.
 */

export default function Spinner({ size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeClasses[size]} rounded-full border-surface-700 border-t-primary-500 animate-spin`}
      />
      {text && <p className="text-sm text-surface-300 animate-pulse">{text}</p>}
    </div>
  )
}
