/**
 * MediGuide AI — Spinner
 * Clinical Intelligence loading spinner.
 */

export default function Spinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeMap[size]} border-3 border-surface-container-high border-t-primary-container rounded-full animate-spin`}
        style={{ borderWidth: '3px' }}
      />
    </div>
  )
}
