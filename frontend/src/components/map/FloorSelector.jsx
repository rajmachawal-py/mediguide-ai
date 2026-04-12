/**
 * MediGuide AI — FloorSelector
 * Horizontal floor switcher buttons for indoor navigation.
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
      <span className="text-[10px] text-surface-400 uppercase tracking-wider flex-shrink-0">
        {language === 'hi' ? 'मंजिल' : language === 'mr' ? 'मजला' : 'Floor'}
      </span>
      {floors.map((floor) => (
        <button
          key={floor}
          onClick={() => onChange(floor)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeFloor === floor
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105'
              : 'bg-surface-800/70 text-surface-300 hover:bg-surface-700 hover:text-white border border-surface-700/30'
          }`}
        >
          {floorLabel(floor)}
        </button>
      ))}
    </div>
  )
}
