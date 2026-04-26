'use client';

import { useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { ChatPanel, FabBtn, MicLevelMeter, StarRating, TagToggle, type ChatMessage } from '@/components/design';

export function P2Demo() {
  const [muted, setMuted] = useState(false);
  const [callOn, setCallOn] = useState(true);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<Set<string>>(new Set(['타로']));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', from: 'them', text: '안녕하세요, 반갑습니다.', ts: Date.now() - 60000 },
    { id: '2', from: 'me', text: '네, 안녕하세요!', ts: Date.now() - 30000 },
  ]);

  const TAG_LIST = ['타로', '사주', '신점', '연애', '직장', '재물'] as const;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">FabBtn + MicLevelMeter</h3>
        <div className="flex items-center gap-4">
          <FabBtn
            on={!muted}
            onClick={() => setMuted((m) => !m)}
            label={muted ? '마이크 켜기' : '마이크 끄기'}
            icon={muted ? <MicOff size={20} /> : <Mic size={20} />}
          />
          <FabBtn
            variant="destructive"
            on={!callOn}
            onClick={() => setCallOn((v) => !v)}
            label={callOn ? '통화 종료' : '통화 시작'}
            icon={callOn ? <PhoneOff size={20} /> : <Phone size={20} />}
          />
          <MicLevelMeter level={muted ? 0 : 0.65} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">StarRating</h3>
        <StarRating value={rating} onChange={setRating} />
        <p className="text-xs text-text-secondary">선택: <span className="tabular">{rating}</span> / 5</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">TagToggle</h3>
        <TagToggle
          tags={TAG_LIST}
          selected={tags}
          ariaLabel="관심 분야"
          onToggle={(tag) =>
            setTags((prev) => {
              const next = new Set(prev);
              if (next.has(tag)) next.delete(tag);
              else next.add(tag);
              return next;
            })
          }
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-text-primary">ChatPanel (시그니처 + 정적 UI)</h3>
        <ChatPanel
          messages={messages}
          onSend={(text) =>
            setMessages((prev) => [
              ...prev,
              { id: String(Date.now()), from: 'me', text, ts: Date.now() },
            ])
          }
          onClose={() => setMessages([])}
        />
      </div>
    </div>
  );
}
