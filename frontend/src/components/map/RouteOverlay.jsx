/**
 * MediGuide AI — RouteOverlay (NavigationPanel)
 * Step-by-step walking directions panel for indoor navigation.
 * Shows route steps with icons, distance, and accessibility toggle.
 * Uses Clinical Intelligence Design System (light theme).
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
      <div className="clinical-card p-4 flex items-center justify-center gap-2 text-sm text-on-surface-variant">
        <FiLoader className="w-4 h-4 animate-spin text-primary" />
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
    <div className="clinical-card overflow-hidden animate-slide-up">
      {/* Route Header */}
      <div className="px-4 py-3 bg-primary-fixed/30 border-b border-outline-variant/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiNavigation className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs font-bold text-on-surface">
                {t.routeTo}: {route.to_node}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {route.total_steps} {t.steps}
                {route.total_distance_meters && ` • ${route.total_distance_meters}m`}
              </p>
            </div>
          </div>

          {/* Accessible Route Toggle */}
          {onToggleAccessible && (
            <button
              onClick={onToggleAccessible}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-clinical text-[10px] font-medium transition-all ${
                accessibleOnly
                  ? 'bg-primary-fixed/50 text-primary border border-primary/20'
                  : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:text-primary'
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
              className={`flex items-start gap-3 px-4 py-3 border-b border-outline-variant/15 last:border-0 ${
                isLast ? 'bg-mild-light/30' : ''
              }`}
            >
              {/* Step Number + Connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isLast
                    ? 'bg-mild-light text-mild'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {isLast ? <FiCheck className="w-3 h-3" /> : step.step_number}
                </span>
                {!isLast && (
                  <div className="w-px h-4 bg-outline-variant/40 mt-1" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${isLast ? 'text-mild font-semibold' : 'text-on-surface'}`}>
                  {icon} {step.direction}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {step.distance_meters && (
                    <span className="text-[10px] text-on-surface-variant">{step.distance_meters}m</span>
                  )}
                  {step.floor != null && (
                    <span className="text-[10px] text-on-surface-variant">
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
