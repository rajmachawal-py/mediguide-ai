/**
 * MediGuide AI — ChatBubble
 * Clinical Intelligence chat bubble.
 * User: solid primary blue with white text.
 * AI: white card with Clinical Bloom shadow.
 */

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.isError

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
    >
      <div
        className={`max-w-[85%] lg:max-w-[65%] px-4 py-3 ${
          isUser
            ? 'chat-bubble-user'
            : isError
              ? 'chat-bubble-ai border-error/30'
              : 'chat-bubble-ai'
        }`}
      >
        {/* Image thumbnail (for visual symptom uploads) */}
        {message.image && (
          <div className="mb-2 -mx-1">
            <img
              src={message.image}
              alt="Symptom image"
              className="rounded-clinical max-w-[200px] max-h-[200px] object-cover"
            />
          </div>
        )}

        {/* Urgency indicator on AI messages */}
        {!isUser && message.urgency && (
          <span
            className={`triage-badge mb-2 ${
              message.urgency === 'emergency'
                ? 'triage-badge-emergency'
                : message.urgency === 'moderate'
                  ? 'triage-badge-moderate'
                  : 'triage-badge-mild'
            }`}
          >
            {message.urgency === 'emergency' ? '🔴' : message.urgency === 'moderate' ? '🟡' : '🟢'}{' '}
            {message.urgency.toUpperCase()}
          </span>
        )}

        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isError ? 'text-error' : ''}`}>
          {message.content}
        </p>

        <span className={`block text-[10px] mt-1.5 ${isUser ? 'text-white/50' : 'text-outline'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
