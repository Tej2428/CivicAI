import type { IncomingMessage, ServerResponse } from 'http';
import { analyzeCivicImage, GEMINI_MODEL } from './geminiService';

// Sliding-window rate limiter: Map of IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export function handleApiRequests(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url?.split('?')[0];

  // Set standard security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if ((url === '/api/system-status' || url === '/api/health') && req.method === 'GET') {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'CivicAI Intelligence Engine',
        geminiConfigured: hasKey,
        geminiModel: GEMINI_MODEL,
        serverTime: new Date().toISOString(),
        version: '1.1.0',
      })
    );
    return;
  }

  if (url === '/api/analyze-image' && req.method === 'POST') {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    if (isRateLimited(clientIp)) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Retry-After', '60');
      res.end(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait 60 seconds before submitting further images for analysis.',
        })
      );
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Safeguard against payload > 15MB
      if (body.length > 15 * 1024 * 1024) {
        res.statusCode = 413;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Payload exceeds maximum allowed size (15MB).' }));
        req.destroy();
      }
    });

interface AnalyzeImagePayload {
  imageBase64?: string;
  mimeType?: string;
  userHintCategory?: string;
  userDescription?: string;
}

    req.on('end', async () => {
      try {
        let payload: AnalyzeImagePayload;
        try {
          payload = JSON.parse(body || '{}');
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Malformed JSON payload.' }));
          return;
        }

        if (!payload.imageBase64 || typeof payload.imageBase64 !== 'string') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'imageBase64 string is required.' }));
          return;
        }

        const result = await analyzeCivicImage({
          imageBase64: payload.imageBase64,
          mimeType: typeof payload.mimeType === 'string' ? payload.mimeType : undefined,
          userHintCategory: typeof payload.userHintCategory === 'string' ? payload.userHintCategory : undefined,
          userDescription: typeof payload.userDescription === 'string' ? payload.userDescription : undefined,
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Internal server error';
        console.error('API Error in /api/analyze-image:', errorMsg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Image analysis could not be completed.' }));
      }
    });
    return;
  }

  next();
}
