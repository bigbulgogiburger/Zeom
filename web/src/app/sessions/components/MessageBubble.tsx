'use client';

type ChatMessage = {
  id: number;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
};

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
};

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.createdAt);
  const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isOwn ? 'order-1' : 'order-1'}`}>
        {!isOwn && (
          <div className="text-xs font-medium mb-1 text-[hsl(var(--text-secondary))] ml-1">
            {message.senderName}
            <span className="ml-1 text-[hsl(var(--gold))] text-[10px]">
              {message.senderRole === 'COUNSELOR' ? '상담사' : ''}
            </span>
          </div>
        )}
        <div
          className={`
            rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words
            ${isOwn
              ? 'bg-gold text-background rounded-br-sm'
              : 'bg-surface-hover text-[hsl(var(--text-primary))] rounded-bl-sm border border-[hsl(var(--gold)/0.1)]'
            }
          `}
        >
          {message.content}
        </div>
        <div className={`text-[10px] mt-1 text-[hsl(var(--text-secondary))] ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
          {timeStr}
        </div>
      </div>
    </div>
  );
}
