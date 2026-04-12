/**
 * MediGuide AI — ChatBubble
 * Renders a single chat message (user or AI).
 */

export default function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.isError

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 ${
          isUser
            ? 'chat-bubble-user text-white'
            : isError
              ? 'chat-bubble-ai border-red-500/30 text-red-300'
              : 'chat-bubble-ai text-surface-200'
        }`}
      >
        {/* Urgency indicator on AI messages */}
        {!isUser && message.urgency && (
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
              message.urgency === 'emergency'
                ? 'bg-red-500/20 text-red-400'
                : message.urgency === 'moderate'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
            }`}
          >
            {message.urgency === 'emergency' ? '🔴' : message.urgency === 'moderate' ? '🟡' : '🟢'}{' '}
            {message.urgency}
          </span>
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        <span className="block text-[10px] mt-1.5 opacity-40">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
