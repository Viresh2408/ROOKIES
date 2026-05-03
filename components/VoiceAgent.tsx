'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Loader2, Volume2, VolumeX,
  MessageSquare, X, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ── Types ────────────────────────────────────────────────────────────────────
interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

// Tracks attached audio elements for cleanup
const attachedElements: HTMLAudioElement[] = [];

// ── Component ─────────────────────────────────────────────────────────────────
export function VoiceAgent({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [isConnecting, setIsConnecting]   = useState(false);
  const [isConnected, setIsConnected]     = useState(false);
  const [isMuted, setIsMuted]             = useState(false);
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcript, setTranscript]       = useState<TranscriptEntry[]>([]);
  const roomRef        = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom on new messages
  useEffect(() => {
    if (showTranscript) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, showTranscript]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const addOrUpdateTranscript = (
    id: string,
    speaker: 'user' | 'agent',
    text: string,
    isFinal: boolean,
  ) => {
    setTranscript(prev => {
      const existing = prev.findIndex(e => e.id === id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], text, isFinal };
        return updated;
      }
      return [...prev, { id, speaker, text, timestamp: new Date(), isFinal }];
    });
  };

  // ── Connect / Disconnect ───────────────────────────────────────────────────
  const toggleSession = async () => {
    // --- Disconnect ---
    if (isConnected && roomRef.current) {
      await roomRef.current.disconnect();
      attachedElements.forEach(el => el.remove());
      attachedElements.length = 0;
      roomRef.current = null;
      setIsConnected(false);
      setIsMuted(false);
      setIsSpeaking(false);
      return;
    }

    // --- Connect ---
    setIsConnecting(true);
    try {
      const resp = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Token error ${resp.status}: ${errText}`);
      }
      const { token, roomUrl } = await resp.json();

      // Dynamic import to avoid SSR issues
      const { Room, RoomEvent } = await import('livekit-client');

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      // ── FIX: Enable mic INSIDE Connected handler so trackID is always valid
      room.on(RoomEvent.Connected, async () => {
        setIsConnected(true);
        setIsConnecting(false);
        // Only enable mic after room is fully ready → trackID will be defined
        await room.localParticipant.setMicrophoneEnabled(true);
        // Auto-show transcript when session starts
        setShowTranscript(true);
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setIsSpeaking(false);
        roomRef.current = null;
      });

      // ── Agent audio playback (attach to DOM so it actually plays) ──────────
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'audio') {
          const element = track.attach() as HTMLAudioElement;
          element.style.display = 'none';
          document.body.appendChild(element);
          attachedElements.push(element);
        }
      });

      // ── Speaking indicator ─────────────────────────────────────────────────
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const agentIsSpeaking = speakers.some(
          (s) => s.identity !== room.localParticipant.identity,
        );
        setIsSpeaking(agentIsSpeaking);
      });

      // ── Live transcript from LiveKit transcription segments ────────────────
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        const isAgent =
          !participant ||
          participant.identity !== room.localParticipant.identity;
        const speaker: 'user' | 'agent' = isAgent ? 'agent' : 'user';

        for (const seg of segments) {
          if (seg.text?.trim()) {
            addOrUpdateTranscript(seg.id, speaker, seg.text.trim(), seg.final ?? true);
          }
        }
      });

      // ── Data messages (e.g. Navigation) ────────────────────────────────────
      room.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const decoder = new TextDecoder();
          const data = JSON.parse(decoder.decode(payload));
          if (data.type === 'navigation') {
            console.log('[agent] Navigation requested:', data.path);
            router.push(data.path);
          }
        } catch (e) {
          console.error('Error parsing agent data:', e);
        }
      });

      await room.connect(roomUrl, token);
      // NOTE: setMicrophoneEnabled is now called in the Connected handler ↑
    } catch (error) {
      console.error('Voice connection error:', error);
      setIsConnecting(false);
      roomRef.current = null;
    }
  };

  // ── Mute ──────────────────────────────────────────────────────────────────
  const toggleMute = async () => {
    if (!roomRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
  };

  // ── Clear transcript ───────────────────────────────────────────────────────
  const clearTranscript = () => setTranscript([]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Transcript Panel ─────────────────────────────────────────── */}
      {isConnected && showTranscript && (
        <div
          className={cn(
            'w-80 max-h-96 bg-card border border-border rounded-2xl shadow-2xl',
            'flex flex-col overflow-hidden',
            'animate-in fade-in slide-in-from-bottom-4 duration-300',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                isSpeaking ? 'bg-primary animate-pulse' : 'bg-green-500',
              )} />
              <span className="text-xs font-semibold text-foreground">
                {isSpeaking ? 'Agent is speaking…' : 'Listening…'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                onClick={clearTranscript}
                title="Clear transcript"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setShowTranscript(false)}
                title="Collapse"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[120px]">
            {transcript.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-4">
                Conversation will appear here…
              </p>
            ) : (
              transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex flex-col gap-0.5 max-w-[90%]',
                    entry.speaker === 'user' ? 'ml-auto items-end' : 'items-start',
                  )}
                >
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    {entry.speaker === 'user' ? 'You' : 'Rookies AI'}
                  </span>
                  <div
                    className={cn(
                      'px-3 py-2 rounded-2xl text-xs leading-relaxed',
                      entry.speaker === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm',
                      !entry.isFinal && 'opacity-60 italic',
                    )}
                  >
                    {entry.text}
                    {!entry.isFinal && (
                      <span className="ml-1 inline-flex gap-0.5">
                        <span className="animate-bounce [animation-delay:0ms]">·</span>
                        <span className="animate-bounce [animation-delay:150ms]">·</span>
                        <span className="animate-bounce [animation-delay:300ms]">·</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* ── Bottom Control Bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {isConnected && (
          <div
            className={cn(
              'bg-card border border-border shadow-lg rounded-full px-4 py-2',
              'flex items-center gap-3 transition-all',
              'animate-in fade-in slide-in-from-bottom-2',
              isSpeaking && 'border-primary ring-2 ring-primary/20',
            )}
          >
            {/* Transcript toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full',
                showTranscript && 'bg-primary/10 text-primary',
              )}
              onClick={() => setShowTranscript(v => !v)}
              title="Toggle transcript"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            {/* Mute toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Main mic button */}
        <Button
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full shadow-2xl transition-all duration-300',
            isConnected
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-primary hover:scale-110 active:scale-95',
          )}
          onClick={toggleSession}
          disabled={isConnecting}
          title={isConnected ? 'End session' : 'Start voice session'}
        >
          {isConnecting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isConnected ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}
