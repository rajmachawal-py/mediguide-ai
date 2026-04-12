/**
 * MediGuide AI — RouteOverlay (NavigationPanel)
 * Step-by-step walking directions panel for indoor navigation.
 * Shows route steps with icons, distance, and accessibility toggle.
 */

import { FiNavigation, FiArrowRight, FiArrowUp, FiArrowDown, FiCheck, FiLoader } from 'react-icons/fi'

// Icons per node type
const stepIcons = {
  entrance:   '🚪',
  department: '🏥',
  lift:       '🛗',
  stairs:     '🪜',
  waypoint:   '📍',
}

export default function RouteOverlay({
  route,
  loading = false,
  accessibleOnly = false,
  onToggleAccessible,
  language = 'en',
}) {
  if (loading) {
    return (
      <div className="glass-card p-4 flex items-center justify-center gap-2 text-sm text-surface-300">
        <FiLoader className="w-4 h-4 animate-spin text-primary-400" />
        {language === 'hi' ? 'रास्ता ढूंढ रहे हैं...' : language === 'mr' ? 'मार्ग शोधत आहोत...' : 'Finding route...'}
      </div>
    )
  }

  if (!route) return null

  const labels = {
    hi: {
      routeTo: 'रास्ता',
      steps: 'कदम',
      distance: 'दूरी',
      accessible: 'व्हीलचेयर',
      arrived: 'पहुँच गए!',
    },
    mr: {
      routeTo: 'मार्ग',
      steps: 'पावले',
      distance: 'अंतर',
      accessible: 'व्हीलचेअर',
      arrived: 'पोहोचलात!',
    },
    en: {
      routeTo: 'Route to',
      steps: 'steps',
      distance: 'Distance',
      accessible: 'Wheelchair',
      arrived: 'Arrived!',
    },
  }

  const t = labels[language] || labels.en

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      {/* Route Header */}
      <div className="px-4 py-3 bg-primary-600/10 border-b border-surface-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiNavigation className="w-4 h-4 text-primary-400" />
            <div>
              <p className="text-xs font-bold text-white">
                {t.routeTo}: {route.to_node}
              </p>
              <p className="text-[10px] text-surface-400">
                {route.total_steps} {t.steps}
                {route.total_distance_meters && ` • ${route.total_distance_meters}m`}
              </p>
            </div>
          </div>

          {/* Accessible Route Toggle */}
          {onToggleAccessible && (
            <button
              onClick={onToggleAccessible}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                accessibleOnly
                  ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                  : 'bg-surface-800/60 text-surface-400 border border-surface-700/30 hover:text-white'
              }`}
              title="Toggle accessible route"
            >
              ♿ {t.accessible}
            </button>
          )}
        </div>
      </div>

      {/* Steps List */}
      <div className="max-h-56 overflow-y-auto">
        {route.steps.map((step, i) => {
          const isLast = i === route.steps.length - 1
          const icon = stepIcons[step.node_type] || stepIcons.waypoint

          return (
            <div
              key={step.step_number}
              className={`flex items-start gap-3 px-4 py-3 border-b border-surface-800/40 last:border-0 ${
                isLast ? 'bg-green-500/5' : ''
              }`}
            >
              {/* Step Number + Connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isLast
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-surface-800/80 text-surface-300'
                }`}>
                  {isLast ? <FiCheck className="w-3 h-3" /> : step.step_number}
                </span>
                {!isLast && (
                  <div className="w-px h-4 bg-surface-700/50 mt-1" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${isLast ? 'text-green-300 font-semibold' : 'text-surface-200'}`}>
                  {icon} {step.direction}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {step.distance_meters && (
                    <span className="text-[10px] text-surface-400">{step.distance_meters}m</span>
                  )}
                  {step.floor != null && (
                    <span className="text-[10px] text-surface-400">
                      Floor {step.floor}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
