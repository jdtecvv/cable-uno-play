import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import { ZodError } from "zod";
import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";
import * as schema from "@shared/schema";
import { randomUUID } from "crypto";
import { promisify } from "util";

const mkdtemp = promisify(fs.mkdtemp);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Transcoding session management
interface TranscodingSession {
  id: string;
  tempDir: string;
  ffmpegProcess: ReturnType<typeof spawn> | null;
  streamUrl: string;
  createdAt: number;
  lastAccess: number;
}

const transcodingSessions = new Map<string, TranscodingSession>();
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const MAX_CONCURRENT_SESSIONS = 5;

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix for all API routes
  const apiPrefix = "/api";
  
  console.log("🚀 Registering API routes with prefix:", apiPrefix);

  // Error handling middleware
  const handleError = (res: any, error: any) => {
    console.error("API Error:", error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ 
      message: error.message || "Internal server error" 
    });
  };

  // Transcoding session helpers
  const checkFFmpegAvailable = (): boolean => {
    try {
      const result = spawnSync('ffmpeg', ['-version']);
      return result.status === 0;
    } catch {
      return false;
    }
  };

  const cleanupSession = async (sessionId: string) => {
    const session = transcodingSessions.get(sessionId);
    if (!session) return;

    // Kill FFmpeg process
    if (session.ffmpegProcess) {
      session.ffmpegProcess.kill('SIGKILL');
    }

    // Remove temp directory
    try {
      const files = await readdir(session.tempDir);
      for (const file of files) {
        await fs.promises.unlink(path.join(session.tempDir, file));
      }
      await fs.promises.rmdir(session.tempDir);
    } catch (error) {
      console.error(`Failed to cleanup session ${sessionId}:`, error);
    }

    transcodingSessions.delete(sessionId);
    console.log(`Cleaned up session ${sessionId}`);
  };

  const cleanupStaleSessions = () => {
    const now = Date.now();
    for (const [sessionId, session] of Array.from(transcodingSessions.entries())) {
      if (now - session.lastAccess > SESSION_TIMEOUT) {
        console.log(`Session ${sessionId} timed out, cleaning up...`);
        cleanupSession(sessionId);
      }
    }
  };

  // Run cleanup every minute
  setInterval(cleanupStaleSessions, 60 * 1000);

  // Helper function to convert XUI URLs to localhost for internal access
  // In production, XUI nginx listens on 127.0.0.1:81 (HTTP) and 127.0.0.1:444 (HTTPS)
  // We use HTTP on port 81 for internal communication
  const isProduction = process.env.NODE_ENV === 'production';
  
  const convertXUIUrlToLocal = (url: string): { url: string; hostHeader: string | null } => {
    // Only convert to localhost in production where XUI is available locally
    if (!isProduction) {
      console.log(`🔄 Development mode - using original URL: ${url}`);
      return { url, hostHeader: null };
    }
    
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      
      // Check if this is an XUI URL
      const isXUIUrl = host === 'app.teleunotv.cr' || host === '190.61.110.177';

      if (isXUIUrl) {
        // Extract the original host for the Host header
        const hostHeader = 'app.teleunotv.cr';

        // Change protocol to http (internal)
        urlObj.protocol = 'http:';

        // Change hostname to localhost
        urlObj.hostname = '127.0.0.1';

        // Handle port logic:
        // CRITICAL FIX: If the URL already has a port, PRESERVE IT.
        // Only default to 81 if NO port is specified.
        // Note: urlObj.port is an empty string if it's the default port for the protocol (80/443)
        // or if explicitly not present.
        if (!urlObj.port) {
          console.log(`[XUI-FIX-V3] No port detected in ${url}, defaulting to 81.`);
          urlObj.port = '81';
        } else {
          console.log(`[XUI-FIX-V3] Preserving existing port ${urlObj.port} in ${url}`);
        }

        const result = urlObj.toString();
        console.log(`[XUI-FIX-V3] Rewrite Result: ${url} -> ${result} (Host: ${hostHeader})`);
        return { url: result, hostHeader };
      }
    } catch (e) {
      console.error('Error parsing URL in convertXUIUrlToLocal:', e);
      // Fallback to original URL if parsing fails
    }
    
    return { url, hostHeader: null };
  };

  // Helper to fetch XUI URLs with manual redirect handling
  // XUI returns 302 redirects to https://....:81 which is invalid (port 81 is HTTP)
  // We need to manually follow redirects and convert each Location URL to localhost:81 HTTP
  const fetchXuiWithRedirectHandling = async (
    url: string, 
    headers: Record<string, string> = {},
    maxRedirects: number = 5
  ): Promise<Response> => {
    let currentUrl = url;
    let redirectCount = 0;
    
    while (redirectCount < maxRedirects) {
      // Convert URL to localhost if it's XUI
      const { url: fetchUrl, hostHeader } = convertXUIUrlToLocal(currentUrl);
      
      // Build headers with Host header for XUI
      const fetchHeaders = { ...headers };
      if (hostHeader) {
        fetchHeaders['Host'] = hostHeader;
      }
      
      console.log(`📡 Fetching (attempt ${redirectCount + 1}): ${fetchUrl}${hostHeader ? ` (Host: ${hostHeader})` : ''}`);
      
      // Fetch with redirect: 'manual' to handle redirects ourselves
      const response = await fetch(fetchUrl, { 
        headers: fetchHeaders,
        redirect: 'manual'
      });
      
      // Check for redirect responses (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          console.log(`⚠️ Redirect without Location header, returning response`);
          return response;
        }
        
        console.log(`🔀 Redirect ${response.status} -> ${location}`);
        
        // Update URL for next iteration
        currentUrl = location;
        redirectCount++;
        continue;
      }
      
      // Not a redirect, return the response
      console.log(`📡 Final response: ${response.status} ${response.statusText}`);
      return response;
    }
    
    throw new Error(`Too many redirects (max ${maxRedirects})`);
  };

  // Proxy endpoint to avoid CORS issues when loading M3U from external URLs
  app.post(`${apiPrefix}/proxy/m3u`, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Convert XUI URLs to localhost with proper Host header
      const { url: fetchUrl, hostHeader } = convertXUIUrlToLocal(url);
      
      // Build headers - include Host header for XUI virtual host routing
      const headers: Record<string, string> = {};
      if (hostHeader) {
        headers['Host'] = hostHeader;
      }

      const response = await fetch(fetchUrl, { headers });
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Failed to fetch M3U: ${response.statusText}` 
        });
      }

      const content = await response.text();
      return res.json({ content });
    } catch (error) {
      console.error("Proxy error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch M3U" 
      });
    }
  });

  // HLS Transcoding Session Routes
  
  // Create new transcoding session
  app.post(`${apiPrefix}/proxy/stream-transcode/sessions`, async (req, res) => {
    try {
      // Check FFmpeg availability
      if (!checkFFmpegAvailable()) {
        return res.status(503).json({ message: "FFmpeg not available on server" });
      }

      // Check concurrent session limit
      if (transcodingSessions.size >= MAX_CONCURRENT_SESSIONS) {
        return res.status(429).json({ message: "Too many concurrent transcoding sessions" });
      }

      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Extract credentials if provided
      const streamAuth = req.headers['x-stream-auth'] as string | undefined;
      let inputUrl = url;
      
      if (streamAuth) {
        try {
          const decodedAuth = Buffer.from(streamAuth, 'base64').toString('utf-8');
          const [username, password] = decodedAuth.split(':');
          const urlObj = new URL(url);
          if (username && password) {
            urlObj.username = username;
            urlObj.password = password;
          }
          inputUrl = urlObj.toString();
        } catch (error) {
          console.error('Failed to parse auth:', error);
        }
      }

      // Create session
      const sessionId = randomUUID();
      const tempDir = await mkdtemp(path.join('/tmp', `hls-${sessionId}-`));

      // FFmpeg command for low-latency HLS with HEAD audio downmix
      const ffmpegArgs = [
        '-hide_banner',
        '-loglevel', 'warning',
        '-fflags', 'nobuffer',
        '-threads', '0',
        '-i', inputUrl,
        '-map', '0:v:0',
        '-map', '0:a:0',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ac', '2',  // Downmix to stereo
        '-af', 'aresample=async=1:min_hard_comp=0.100:first_pts=0',
        '-profile:a', 'aac_low',
        '-movflags', '+faststart',
        '-flags', '+global_header',
        '-max_delay', '500000',
        '-hls_time', '2',
        '-hls_list_size', '6',
        '-hls_flags', 'delete_segments+append_list+omit_endlist',
        '-hls_segment_type', 'mpegts',
        '-hls_segment_filename', path.join(tempDir, 'seg_%05d.ts'),
        path.join(tempDir, 'index.m3u8')
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      // Store session
      const session: TranscodingSession = {
        id: sessionId,
        tempDir,
        ffmpegProcess: ffmpeg,
        streamUrl: url,
        createdAt: Date.now(),
        lastAccess: Date.now()
      };
      transcodingSessions.set(sessionId, session);

      // Log FFmpeg output
      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg [${sessionId}]: ${data.toString().trim()}`);
      });

      ffmpeg.on('error', (error) => {
        console.error(`FFmpeg error [${sessionId}]:`, error);
        cleanupSession(sessionId);
      });

      ffmpeg.on('exit', (code) => {
        console.log(`FFmpeg exited [${sessionId}] with code ${code}`);
        if (code !== 0 && code !== null) {
          cleanupSession(sessionId);
        }
      });

      // Return playlist URL
      const playlistUrl = `/api/proxy/stream-transcode/playlists/${sessionId}`;
      
      return res.status(201).json({ 
        sessionId,
        playlistUrl,
        message: "Transcoding session created"
      });

    } catch (error) {
      console.error("Session creation error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create session" 
      });
    }
  });

  // Serve HLS playlist
  app.get(`${apiPrefix}/proxy/stream-transcode/playlists/:sessionId`, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = transcodingSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Update last access
      session.lastAccess = Date.now();

      const playlistPath = path.join(session.tempDir, 'index.m3u8');

      // Wait for playlist to be created (up to 10 seconds)
      let retries = 20;
      while (!fs.existsSync(playlistPath) && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries--;
      }

      if (!fs.existsSync(playlistPath)) {
        return res.status(503).json({ message: "Playlist not ready yet" });
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');

      const playlist = await fs.promises.readFile(playlistPath, 'utf-8');
      
      // Rewrite segment URLs to point to our endpoint
      const rewrittenPlaylist = playlist.replace(
        /seg_(\d+)\.ts/g,
        (match, num) => `/api/proxy/stream-transcode/segments/${sessionId}/seg_${num}.ts`
      );

      return res.send(rewrittenPlaylist);

    } catch (error) {
      console.error("Playlist serve error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to serve playlist" 
      });
    }
  });

  // Serve HLS segments
  app.get(`${apiPrefix}/proxy/stream-transcode/segments/:sessionId/:segmentName`, async (req, res) => {
    try {
      const { sessionId, segmentName } = req.params;
      const session = transcodingSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Update last access
      session.lastAccess = Date.now();

      const segmentPath = path.join(session.tempDir, segmentName);

      if (!fs.existsSync(segmentPath)) {
        return res.status(404).json({ message: "Segment not found" });
      }

      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');

      const segment = await fs.promises.readFile(segmentPath);
      return res.send(segment);

    } catch (error) {
      console.error("Segment serve error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to serve segment" 
      });
    }
  });

  // Delete session manually
  app.delete(`${apiPrefix}/proxy/stream-transcode/sessions/:sessionId`, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = transcodingSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      await cleanupSession(sessionId);
      return res.json({ message: "Session deleted" });

    } catch (error) {
      console.error("Session deletion error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete session" 
      });
    }
  });

  // Proxy endpoint for video streams to avoid Mixed Content issues
  console.log(`📡 Registering route: GET ${apiPrefix}/proxy/stream`);
  app.get(`${apiPrefix}/proxy/stream`, async (req, res) => {
    const url = req.query.url as string;
    console.log(`🎯 Proxy stream request: ${url}`);
    try {
      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Forward important headers from client to upstream server
      const upstreamHeaders: Record<string, string> = {};
      
      // Get real client IP and forward it to upstream (XUI needs this to count connections correctly)
      const clientIp = req.headers['x-forwarded-for'] as string || 
                       req.headers['x-real-ip'] as string || 
                       req.socket.remoteAddress || 
                       'unknown';
      // Send the original client IP to XUI server
      upstreamHeaders['X-Forwarded-For'] = clientIp.split(',')[0].trim();
      upstreamHeaders['X-Real-IP'] = clientIp.split(',')[0].trim();
      
      // Extract credentials from custom header (secure approach)
      const streamAuth = req.headers['x-stream-auth'] as string | undefined;
      if (streamAuth) {
        // streamAuth is already base64 encoded from client
        upstreamHeaders['Authorization'] = `Basic ${streamAuth}`;
      }
      
      // Forward Range header for seeking support (crucial for video playback)
      const rangeHeader = req.headers.range;
      if (rangeHeader) {
        upstreamHeaders['Range'] = rangeHeader;
      }
      
      // Forward cache validation headers
      if (req.headers['if-modified-since']) {
        upstreamHeaders['If-Modified-Since'] = req.headers['if-modified-since'] as string;
      }
      if (req.headers['if-none-match']) {
        upstreamHeaders['If-None-Match'] = req.headers['if-none-match'] as string;
      }
      // Forward User-Agent and Referer (important for some streams)
      if (req.headers['user-agent']) {
        upstreamHeaders['User-Agent'] = req.headers['user-agent'] as string;
      }
      if (req.headers['referer']) {
        upstreamHeaders['Referer'] = req.headers['referer'] as string;
      }

      // Use helper that handles XUI redirects manually
      // XUI returns 302 to https://...:81 which fails because port 81 is HTTP
      const response = await fetchXuiWithRedirectHandling(url, upstreamHeaders);
      console.log(`📡 Upstream response: ${response.status} ${response.statusText}, Content-Type: ${response.headers.get('content-type')}`)
      
      // Accept 200, 206 (Partial Content), and 304 (Not Modified)
      if (!response.ok && response.status !== 206 && response.status !== 304) {
        return res.status(response.status).send(`Failed to fetch stream: ${response.statusText}`);
      }

      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, X-Stream-Auth, X-Session-ID');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Accept-Ranges');

      // Forward upstream status code (200, 206, 304, etc.)
      res.status(response.status);

      // Forward all relevant response headers from upstream
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      const contentRange = response.headers.get('content-range');
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }

      const acceptRanges = response.headers.get('accept-ranges');
      if (acceptRanges) {
        res.setHeader('Accept-Ranges', acceptRanges);
      }

      const lastModified = response.headers.get('last-modified');
      if (lastModified) {
        res.setHeader('Last-Modified', lastModified);
      }

      const etag = response.headers.get('etag');
      if (etag) {
        res.setHeader('ETag', etag);
      }

      // Check if this is an M3U8 playlist that needs URL rewriting
      const isM3U8 = contentType?.includes('application/vnd.apple.mpegurl') || 
                     contentType?.includes('application/x-mpegurl') ||
                     contentType?.includes('audio/mpegurl') ||
                     url.endsWith('.m3u8') || url.endsWith('.m3u');

      if (isM3U8 && response.body) {
        // For M3U8 playlists, we need to rewrite relative URLs to go through the proxy
        const chunks: Uint8Array[] = [];
        const reader = response.body.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        
        const decoder = new TextDecoder();
        let playlist = decoder.decode(Buffer.concat(chunks.map(c => Buffer.from(c))));
        
        // Get base URL for resolving relative paths
        const urlObj = new URL(url);
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        
        // Rewrite relative URLs in the playlist to use the proxy
        // Match lines that are not comments (#) and are relative URLs
        const lines = playlist.split('\n');
        const rewrittenLines = lines.map(line => {
          const trimmedLine = line.trim();
          
          // Skip empty lines and comments
          if (!trimmedLine || trimmedLine.startsWith('#')) {
            // But check for URI= in EXT-X tags (like EXT-X-KEY)
            if (trimmedLine.includes('URI="')) {
              return trimmedLine.replace(/URI="([^"]+)"/g, (match, uri) => {
                if (uri.startsWith('http://') || uri.startsWith('https://')) {
                  return `URI="/api/proxy/stream?url=${encodeURIComponent(uri)}"`;
                } else {
                  const absoluteUri = new URL(uri, baseUrl).href;
                  return `URI="/api/proxy/stream?url=${encodeURIComponent(absoluteUri)}"`;
                }
              });
            }
            return line;
          }
          
          // If it's already an absolute URL, proxy it
          if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
            return `/api/proxy/stream?url=${encodeURIComponent(trimmedLine)}`;
          }
          
          // It's a relative URL - resolve to absolute and proxy
          const absoluteUrl = new URL(trimmedLine, baseUrl).href;
          return `/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
        });
        
        const rewrittenPlaylist = rewrittenLines.join('\n');
        
        // Update content length for rewritten playlist
        res.setHeader('Content-Length', Buffer.byteLength(rewrittenPlaylist));
        res.send(rewrittenPlaylist);
      } else if (response.body) {
        // For non-M3U8 content (segments, etc.), stream directly
        const reader = response.body.getReader();
        
        // Handle client disconnect to prevent zombies
        res.on('close', () => {
          reader.cancel().catch(e => console.error("Error canceling reader on disconnect:", e));
        });

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                res.end();
                break;
              }
              
              // Stop if response is closed
              if (res.writableEnded || res.closed) {
                 break;
              }

              if (value) {
                // Handle backpressure
                const canWrite = res.write(Buffer.from(value));
                if (!canWrite) {
                    await new Promise(resolve => res.once('drain', resolve));
                }
              }
            }
          } catch (error) {
            // Ignore abort errors caused by disconnects
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
                 // Normal behavior on disconnect
            } else {
                 console.error('Stream pump error:', error);
            }
            if (!res.writableEnded && !res.closed) res.end();
          }
        };
        
        await pump();
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Stream proxy error:", error);
      
      if (!res.headersSent) {
        res.status(500).send(error instanceof Error ? error.message : "Failed to fetch stream");
      }
    }
  });

  // Playlist routes
  app.get(`${apiPrefix}/playlists`, async (req, res) => {
    try {
      const playlists = await storage.getPlaylists();
      return res.json(playlists);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/playlists/active`, async (req, res) => {
    try {
      const activePlaylist = await storage.getActivePlaylist();
      if (activePlaylist.length === 0) {
        return res.status(404).json({ message: "No active playlist found" });
      }
      return res.json(activePlaylist[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/playlists/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.getPlaylistById(Number(id));
      
      if (playlist.length === 0) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      return res.json(playlist[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post(`${apiPrefix}/playlists`, async (req, res) => {
    try {
      const validatedData = schema.playlistInsertSchema.parse(req.body);
      const newPlaylist = await storage.createPlaylist(validatedData);
      return res.status(201).json(newPlaylist[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch(`${apiPrefix}/playlists/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.updatePlaylist(Number(id), req.body);
      
      if (playlist.length === 0) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      return res.json(playlist[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete(`${apiPrefix}/playlists/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.deletePlaylist(Number(id));
      
      if (playlist.length === 0) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      return res.json(playlist[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch(`${apiPrefix}/playlists/:id/set-active`, async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.setActivePlaylist(Number(id));
      
      if (playlist.length === 0) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      return res.json(playlist[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Channel routes
  app.get(`${apiPrefix}/channels`, async (req, res) => {
    try {
      const { playlistId } = req.query;
      let channels;
      
      if (playlistId) {
        channels = await storage.getChannels(Number(playlistId));
      } else {
        channels = await storage.getChannels();
      }
      
      return res.json(channels);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/channels/favorites`, async (req, res) => {
    try {
      const channels = await storage.getFavoriteChannels();
      return res.json(channels);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/channels/recent`, async (req, res) => {
    try {
      const { limit } = req.query;
      const channels = await storage.getRecentlyWatchedChannels(limit ? Number(limit) : 10);
      return res.json(channels);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/channels/search`, async (req, res) => {
    try {
      const { term, playlistId } = req.query;
      
      if (!term) {
        return res.status(400).json({ message: "Search term is required" });
      }
      
      let channels;
      
      if (playlistId) {
        channels = await storage.searchChannels(String(term), Number(playlistId));
      } else {
        channels = await storage.searchChannels(String(term));
      }
      
      return res.json(channels);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/channels/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const channel = await storage.getChannelById(Number(id));
      
      if (channel.length === 0) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      return res.json(channel[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post(`${apiPrefix}/channels`, async (req, res) => {
    try {
      const validatedData = schema.channelInsertSchema.parse(req.body);
      const newChannel = await storage.createChannel(validatedData);
      return res.status(201).json(newChannel[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch(`${apiPrefix}/channels/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const channel = await storage.updateChannel(Number(id), req.body);
      
      if (channel.length === 0) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      return res.json(channel[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete(`${apiPrefix}/channels/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const channel = await storage.deleteChannel(Number(id));
      
      if (channel.length === 0) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      return res.json(channel[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch(`${apiPrefix}/channels/:id/toggle-favorite`, async (req, res) => {
    try {
      const { id } = req.params;
      const channel = await storage.toggleFavorite(Number(id));
      
      if (!channel || channel.length === 0) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      return res.json(channel[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch(`${apiPrefix}/channels/:id/update-last-watched`, async (req, res) => {
    try {
      const { id } = req.params;
      const channel = await storage.updateLastWatched(Number(id));
      
      if (channel.length === 0) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      return res.json(channel[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post(`${apiPrefix}/channels/bulk`, async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Expected an array of channels" });
      }
      
      // Validate each channel
      const validatedChannels = [];
      for (const channel of req.body) {
        try {
          const validChannel = schema.channelInsertSchema.parse(channel);
          validatedChannels.push(validChannel);
        } catch (error) {
          console.warn("Skipping invalid channel:", error);
        }
      }
      
      const channels = await storage.bulkInsertChannels(validatedChannels);
      return res.status(201).json(channels);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Category routes
  app.get(`${apiPrefix}/categories`, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      return res.json(categories);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/categories/:id/channels`, async (req, res) => {
    try {
      const { id } = req.params;
      const { playlistId } = req.query;
      let channels;
      
      if (playlistId) {
        channels = await storage.getChannelsByCategory(Number(id), Number(playlistId));
      } else {
        channels = await storage.getChannelsByCategory(Number(id));
      }
      
      return res.json(channels);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/categories/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getCategoryById(Number(id));
      
      if (category.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.json(category[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post(`${apiPrefix}/categories`, async (req, res) => {
    try {
      const validatedData = schema.categoryInsertSchema.parse(req.body);
      const newCategory = await storage.createCategory(validatedData);
      return res.status(201).json(newCategory[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch(`${apiPrefix}/categories/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.updateCategory(Number(id), req.body);
      
      if (category.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.json(category[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete(`${apiPrefix}/categories/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.deleteCategory(Number(id));
      
      if (category.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.json(category[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  // EPG routes
  app.get(`${apiPrefix}/epg/sources`, async (req, res) => {
    try {
      const sources = await storage.getEpgSources();
      return res.json(sources);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/epg/programs/:channelEpgId`, async (req, res) => {
    try {
      const { channelEpgId } = req.params;
      const { startTime, endTime } = req.query;
      
      let startDate, endDate;
      
      if (startTime) {
        startDate = new Date(String(startTime));
      }
      
      if (endTime) {
        endDate = new Date(String(endTime));
      }
      
      const programs = await storage.getProgramsByChannelEpgId(
        channelEpgId,
        startDate,
        endDate
      );
      
      return res.json(programs);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get(`${apiPrefix}/epg/programs/:channelEpgId/current`, async (req, res) => {
    try {
      const { channelEpgId } = req.params;
      const program = await storage.getCurrentProgram(channelEpgId);
      
      if (program.length === 0) {
        return res.status(404).json({ message: "No current program found" });
      }
      
      return res.json(program[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Settings routes
  app.get(`${apiPrefix}/settings/:key`, async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      
      if (setting.length === 0) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      return res.json(setting[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.put(`${apiPrefix}/settings/:key`, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const setting = await storage.updateSetting(key, value);
      return res.json(setting[0]);
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
