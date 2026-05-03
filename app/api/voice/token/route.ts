import { auth } from '@clerk/nextjs/server';
import { AccessToken, AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const AGENT_NAME = 'rookies-agent'; // Must match WorkerOptions agent_name in main.py

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { businessId } = body;

    if (!businessId) {
      return new NextResponse('Missing businessId', { status: 400 });
    }

    const apiKey    = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL; // wss://...

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error('LiveKit credentials missing');
    }

    // Convert wss:// → https:// for the REST API host
    const livekitHost = livekitUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');

    const roomName = `voice-${businessId}-${Date.now()}`;

    // ── 1. Create the room explicitly so the agent can join immediately ─────
    const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
    try {
      await roomService.createRoom({
        name: roomName,
        metadata: businessId,            // agent reads this as business_id
        emptyTimeout: 300,               // 5-minute idle timeout
        maxParticipants: 5,
      });
    } catch (err) {
      // Room may already exist — that's fine
      console.warn('[voice/token] createRoom warning:', err);
    }

    // ── 2. Dispatch the agent to the room ───────────────────────────────────
    // This is what actually sends a job to the running Python worker.
    // Without this, the worker sits idle even if the room exists.
    try {
      const dispatchClient = new AgentDispatchClient(livekitHost, apiKey, apiSecret);
      await dispatchClient.createDispatch(roomName, AGENT_NAME, {
        metadata: businessId,            // available as ctx.job.metadata in agent
      });
      console.log(`[voice/token] Agent dispatched to room: ${roomName}`);
    } catch (err) {
      // Log but don't fail — some LiveKit plans dispatch automatically via rules
      console.error('[voice/token] Agent dispatch error:', err);
    }

    // ── 3. Create user access token ─────────────────────────────────────────
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      metadata: businessId,
    });

    at.addGrant({
      roomJoin:     true,
      room:         roomName,
      canPublish:   true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    // ── 4. Log voice session (non-blocking) ─────────────────────────────────
    (prisma as any).voiceSession.create({
      data: { businessId, userId, roomName },
    }).catch((err: unknown) => console.error('[voice/token] DB log error:', err));

    return NextResponse.json({ token, roomUrl: livekitUrl, roomName });

  } catch (error) {
    console.error('[voice/token] fatal error:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 },
    );
  }
}
