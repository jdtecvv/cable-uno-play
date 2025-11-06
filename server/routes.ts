import type { Express } from "express";
import { createServer, type Server } from "http";
import * as storage from "./storage";
import { ZodError } from "zod";
import fs from "fs";
import path from "path";
import * as schema from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix for all API routes
  const apiPrefix = "/api";

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

      const response = await fetch(url);
      
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

  // Proxy endpoint for video streams to avoid Mixed Content issues
  app.get(`${apiPrefix}/proxy/stream`, async (req, res) => {
    try {
      const url = req.query.url as string;
      
      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Forward important headers from client to upstream server
      const upstreamHeaders: Record<string, string> = {};
      
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

      const response = await fetch(url, { headers: upstreamHeaders });
      
      // Accept 200, 206 (Partial Content), and 304 (Not Modified)
      if (!response.ok && response.status !== 206 && response.status !== 304) {
        return res.status(response.status).send(`Failed to fetch stream: ${response.statusText}`);
      }

      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, X-Stream-Auth');
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

      // Stream the response body directly without buffering in memory
      if (response.body) {
        const reader = response.body.getReader();
        
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                res.end();
                break;
              }
              
              if (value) {
                res.write(Buffer.from(value));
              }
            }
          } catch (error) {
            console.error('Stream pump error:', error);
            res.end();
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
