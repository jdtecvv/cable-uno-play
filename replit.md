# Cable Uno Play - IPTV Streaming Application

## Overview
Cable Uno Play is a cross-platform IPTV streaming application designed to deliver live and on-demand television content. It supports multiple devices (TV, tablets, mobile, web) and features a Spanish-language interface with Cable Uno's corporate colors. The project aims to provide a robust, ad-free streaming experience with advanced M3U parsing and flexible authentication, addressing common issues like mixed content and CORS. Future ambitions include a comprehensive premium system with VOD, series, and EPG.

## User Preferences
I prefer iterative development with clear, concise summaries of changes. Please prioritize features that enhance user experience and address critical technical challenges like mixed content and CORS. For database interactions, ensure Drizzle ORM is utilized effectively. I appreciate detailed documentation for deployment and setup processes, especially for mobile and server environments. My preferred language for interaction and documentation is Spanish. When making changes, please explain the rationale and potential impacts.

## System Architecture
### UI/UX Decisions
The application uses Cable Uno's corporate colors (red, white, black, gray) and is designed to be responsive across TV, tablets, mobile, and web. The interface is in Spanish. A "Simple Player" mode is available for immediate use without backend configuration, storing channels in localStorage. Progressive Web App (PWA) features are implemented for mobile installation, including `manifest.json` with corporate colors, a Service Worker for offline functionality, and optimized meta tags for Android/iOS.

### Technical Implementations
- **Frontend**: React with Vite, Wouter for routing, Tailwind CSS + shadcn/ui for styling, HLS.js for video streaming, and Zod for form validation.
- **Backend**: Express.js with TypeScript, Drizzle ORM for database interaction, and PostgreSQL (Neon) as the database. Shared Zod schemas are used for validation across frontend and backend.
- **Streaming**: Supports HTTP and HTTPS protocols, HLS streaming (M3U8) via HLS.js, and all known audio/video formats.
- **M3U Parser**: Optimized to handle M3U files with or without `#EXTM3U` headers, direct URLs without `#EXTINF`, incomplete metadata, and automatic naming for channels without information.
- **Proxy System**: A server-side proxy (`/api/proxy/stream` and `/api/proxy/m3u`) converts HTTP streams to HTTPS to prevent mixed content errors and handles CORS issues. It supports range requests and proper header management.
- **Authentication**: Optional user and password for playlists. The parser extracts credentials from URLs, and the proxy converts them to `Authorization: Basic` for the IPTV server, sending them via `X-Stream-Auth` header.
- **Mobile Compilation**: Capacitor is configured for building native Android APKs. Automated scripts (`compilar.sh`, `compilar.bat`) and GitHub Actions workflows are provided for local and automated APK compilation.

### Feature Specifications
- **Metadata Management**: Optional metadata, basic identification for channels, auto-generated names ("Canal N") for missing information, and support for direct URLs in M3U files.
- **Security**: Credentials for the simple mode are stored in localStorage (for personal use only). Credentials are sent via HTTPS headers (`X-Stream-Auth`), Base64 encoded, and converted by the proxy to `Authorization: Basic`.
- **Deployment**: An automated `install-server.sh` script handles full Linux server setup including Node.js, PostgreSQL, Nginx, PM2, SSL/HTTPS with Let's Encrypt, UFW firewall, and daily backups.

### Database Schema
- **Playlists**: `id`, `name`, `url` (M3U file), `username` (optional), `password` (optional), `isActive`, `createdAt`, `updatedAt`.
- **Channels**: `id`, `playlistId`, `name`, `url` (stream), `categoryId` (optional), `logo` (optional), `epgId` (optional), `isFavorite`, `lastWatched`.
- **Categories**: `id`, `name`.

## External Dependencies
- **Frameworks/Libraries**: React, Vite, Wouter, Tailwind CSS, shadcn/ui, HLS.js, Zod, Express.js, Drizzle ORM, Capacitor.
- **Database**: PostgreSQL (specifically Neon for cloud-hosted environments).
- **Web Server/Proxy**: Nginx (used in server deployments).
- **Process Manager**: PM2 (for managing Node.js processes on servers).
- **SSL Certificates**: Let's Encrypt (for automatic HTTPS in server deployments).