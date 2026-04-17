/**
 * MediGuide AI — FloorSelector
 * Horizontal floor switcher buttons for indoor navigation.
 * Uses the Clinical Intelligence Design System (light theme).
 */

export default function FloorSelector({ floors, activeFloor, onChange, language = 'en' }) {
  if (!floors || floors.length <= 1) return null

  const floorLabel = (floor) => {
    if (floor === 0) {
      return language === 'hi' ? 'भूतल' : language === 'mr' ? 'तळमजला' : 'Ground'
    }
    return language === 'hi'
      ? `मंजिल ${floor}`
      : language === 'mr'
        ? `मजला ${floor}`
        : `Floor ${floor}`
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider flex-shrink-0">
        {language === 'hi' ? 'मंजिल' : language === 'mr' ? 'मजला' : 'Floor'}
      </span>
      {floors.map((floor) => (
        <button
          key={floor}
          onClick={() => onChange(floor)}
          className={`flex-shrink-0 px-4 py-2 rounded-clinical text-xs font-semibold transition-all duration-200 ${
            activeFloor === floor
              ? 'bg-primary-container text-white shadow-md shadow-primary-container/30 scale-105'
              : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border border-outline-variant/40'
          }`}
        >
          {floorLabel(floor)}
        </button>
      ))}
    </div>
  )
}
