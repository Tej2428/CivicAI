import type { IncomingMessage, ServerResponse } from 'http';
import { analyzeCivicImage, GEMINI_MODEL } from './geminiService';

export function handleApiRequests(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url?.split('?')[0];

  if (url === '/api/system-status' && req.method === 'GET') {
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
        version: '1.0.0',
      })
    );
    return;
  }

  if (url === '/api/analyze-image' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Safeguard against giant payload > 20MB
      if (body.length > 20 * 1024 * 1024) {
        res.statusCode = 413;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Payload too large (max 20MB)' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (!payload.imageBase64) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'imageBase64 is required' }));
          return;
        }

        const result = await analyzeCivicImage({
          imageBase64: payload.imageBase64,
          mimeType: payload.mimeType,
          userHintCategory: payload.userHintCategory,
          userDescription: payload.userDescription,
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (err: any) {
        console.error('API Error in /api/analyze-image:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err?.message || 'Internal server error' }));
      }
    });
    return;
  }

  next();
}
