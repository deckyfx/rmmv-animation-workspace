/**
 * Bun Development Server
 *
 * Leverages Bun's native TypeScript/React support with HMR
 */

import { serve } from 'bun';
import index from '../index.html';
import { initDatabase } from '@db/client';
import * as animationService from './services/animationService';
import type { RMMVAnimation } from '@decky.fx/rmmv-animation-player/types';

const PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000;

/** Standard RMMV cell size (192×192 pixels) */
const RMMV_CELL_SIZE = 192;

// Initialize database on server start
initDatabase();

const server = serve({
  port: PORT,
  hostname: '0.0.0.0',

  async fetch(req) {
    const url = new URL(req.url);

    // Handle frame cells endpoint: /api/animations/:id/frames/:frameIndex/cells
    const frameCellsMatch = url.pathname.match(/^\/api\/animations\/(\d+)\/frames\/(\d+)\/cells$/);
    if (frameCellsMatch && req.method === 'GET') {
      const animationId = parseInt(frameCellsMatch[1]!, 10);
      const frameIndex = parseInt(frameCellsMatch[2]!, 10);

      try {
        const cells = await animationService.getFrameCellsWithSprites(animationId, frameIndex);
        return Response.json({ cells });
      } catch (error) {
        console.error(`Error fetching cells for animation ${animationId}, frame ${frameIndex}:`, error);
        return Response.json(
          {
            error: 'Failed to fetch frame cells',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Fallthrough to routes
    return undefined as any;
  },

  routes: {
    // API: Get all animations (list view) or create new animation
    '/api/animations': async (req) => {
      if (req.method === 'GET') {
        try {
          const animations = await animationService.getAllAnimations();
          return Response.json({ animations });
        } catch (error) {
          console.error('Error fetching animations:', error);
          return Response.json(
            { error: 'Failed to fetch animations' },
            { status: 500 }
          );
        }
      }

      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const created = await animationService.createAnimation(body);
          return Response.json({ success: true, animation: created }, { status: 201 });
        } catch (error) {
          console.error('Error creating animation:', error);
          return Response.json(
            { error: 'Failed to create animation', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    },

    // API: Get single animation by ID
    '/api/animations/:id': async (req) => {
      const url = new URL(req.url);
      const id = parseInt(url.pathname.split('/').pop() || '0', 10);

      if (req.method === 'GET') {
        try {
          const animation = await animationService.getAnimationById(id);
          if (!animation) {
            return Response.json({ error: 'Animation not found' }, { status: 404 });
          }
          return Response.json({ animation });
        } catch (error) {
          console.error(`Error fetching animation ${id}:`, error);
          return Response.json(
            { error: 'Failed to fetch animation' },
            { status: 500 }
          );
        }
      }

      if (req.method === 'PUT') {
        try {
          const body = await req.json();
          const updated = await animationService.updateAnimation(id, body);
          return Response.json({ success: true, animation: updated });
        } catch (error) {
          console.error(`Error updating animation ${id}:`, error);
          return Response.json(
            { error: 'Failed to update animation', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      if (req.method === 'DELETE') {
        try {
          const deleted = await animationService.deleteAnimation(id);
          if (!deleted) {
            return Response.json({ error: 'Animation not found' }, { status: 404 });
          }
          return Response.json({ success: true, message: 'Animation deleted' });
        } catch (error) {
          console.error(`Error deleting animation ${id}:`, error);
          return Response.json(
            { error: 'Failed to delete animation' },
            { status: 500 }
          );
        }
      }

      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    },

    // API: Duplicate animation
    '/api/animations/:id/duplicate': async (req) => {
      if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
      }

      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const id = parseInt(pathParts[3] || '0', 10);

      try {
        const duplicated = await animationService.duplicateAnimation(id);
        return Response.json({
          success: true,
          animation: duplicated,
          message: `Animation duplicated with ID ${duplicated.id}`,
        }, { status: 201 });
      } catch (error) {
        console.error(`Error duplicating animation ${id}:`, error);
        return Response.json(
          { error: 'Failed to duplicate animation', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    },

    // API: Export single animation (future implementation)
    '/api/animations/:id/export': async (req) => {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const id = parseInt(pathParts[3] || '0', 10);

      try {
        const animation = await animationService.getAnimationById(id);
        if (!animation) {
          return Response.json({ error: 'Animation not found' }, { status: 404 });
        }

        // Build asset manifest
        const spritesheets: Array<{ name: string; path: string; hue: number; slot: number }> = [];
        if (animation.animation1Name) {
          spritesheets.push({
            name: animation.animation1Name,
            path: `assets/img/animations/${animation.animation1Name}.png`,
            hue: animation.animation1Hue,
            slot: 1,
          });
        }
        if (animation.animation2Name) {
          spritesheets.push({
            name: animation.animation2Name,
            path: `assets/img/animations/${animation.animation2Name}.png`,
            hue: animation.animation2Hue,
            slot: 2,
          });
        }

        // Extract unique sound effects from timings
        const soundEffects: Array<{ name: string; path: string }> = [];
        const seSet = new Set<string>();
        if (animation.timings) {
          for (const timing of animation.timings) {
            if (timing.se && timing.se.name && !seSet.has(timing.se.name)) {
              seSet.add(timing.se.name);
              soundEffects.push({
                name: timing.se.name,
                path: `assets/se/${timing.se.name}.ogg`,
              });
            }
          }
        }

        // Build portable export format for SDK standalone playback
        const exportData = {
          animation,
          assets: {
            spritesheets,
            soundEffects,
          },
          metadata: {
            exportedAt: new Date().toISOString(),
            exportedFrom: 'RMMV Animation Studio',
            version: '1.0.0',
            animationId: animation.id,
            animationName: animation.name,
          },
        };

        return Response.json(exportData);
      } catch (error) {
        console.error(`Error exporting animation ${id}:`, error);
        return Response.json(
          { error: 'Failed to export animation' },
          { status: 500 }
        );
      }
    },

    // API: Import animation from custom JSON config
    '/api/animations/import': async (req) => {
      if (req.method !== 'POST') {
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
      }

      try {
        const importData = await req.json();

        // Validate import data structure
        if (!importData.animation) {
          return Response.json(
            { error: 'Invalid import format: missing animation data' },
            { status: 400 }
          );
        }

        const animation = importData.animation;

        // Find next available ID
        const animations = await animationService.getAllAnimations();
        const validAnimations = animations.filter((a: RMMVAnimation) => a != null);
        const maxId =
          validAnimations.length > 0
            ? Math.max(...validAnimations.map((a: RMMVAnimation) => a.id))
            : 0;
        const newId = maxId + 1;

        // Assign new ID to imported animation
        const newAnimation = {
          ...animation,
          id: newId,
          name: `${animation.name} (Imported)`,
        };

        // Save to database
        const savedAnimation = await animationService.createAnimation(newAnimation);

        return Response.json({
          success: true,
          animation: savedAnimation,
          message: `Animation imported successfully with ID ${newId}`,
        });
      } catch (error) {
        console.error('Error importing animation:', error);
        return Response.json(
          { error: 'Failed to import animation' },
          { status: 500 }
        );
      }
    },

    // API: List available sprite sheets
    '/api/spritesheets': async () => {
      try {
        const { readdirSync } = await import('fs');
        const spritesheetsPath = '../../assets/img/animations';
        const files = readdirSync(spritesheetsPath);

        // Filter for image files and get dimensions
        const spriteSheetPromises = files
          .filter((file) => /\.(png|jpg|jpeg)$/i.test(file))
          .map(async (file) => {
            const filename = file.replace(/\.(png|jpg|jpeg)$/i, '');
            const filePath = `${spritesheetsPath}/${file}`;

            try {
              // Load image to get dimensions
              const imageFile = Bun.file(filePath);
              const arrayBuffer = await imageFile.arrayBuffer();

              // For PNG files, read dimensions from header
              const buffer = Buffer.from(arrayBuffer);
              let width = 0;

              // PNG signature check and dimension extraction
              if (buffer[0] === 0x89 && buffer[1] === 0x50) { // PNG
                width = buffer.readUInt32BE(16); // Width is at offset 16
              }

              // Calculate columns (each cell is RMMV_CELL_SIZE px wide)
              const columns = width > 0 ? Math.floor(width / RMMV_CELL_SIZE) : 5; // Default to 5 if can't detect

              return {
                filename,
                path: `/assets/img/animations/${file}`,
                columns, // Number of columns in sprite sheet
                cellSize: RMMV_CELL_SIZE, // Size of each cell
              };
            } catch (err) {
              // Fallback to default if image loading fails
              return {
                filename,
                path: `/assets/img/animations/${file}`,
                columns: 5, // Default to 5 columns
                cellSize: RMMV_CELL_SIZE,
              };
            }
          });

        const spriteSheets = await Promise.all(spriteSheetPromises);
        return Response.json({ spriteSheets });
      } catch (error) {
        console.error('Error listing sprite sheets:', error);
        return Response.json(
          { error: 'Failed to list sprite sheets' },
          { status: 500 }
        );
      }
    },

    // API: List available sound effects
    '/api/se': async () => {
      try {
        const { readdirSync, existsSync } = await import('fs');
        const sePath = '../../assets/se';

        // Check if directory exists
        if (!existsSync(sePath)) {
          return Response.json({ seFiles: [] });
        }

        const files = readdirSync(sePath);

        // Filter for audio files and deduplicate (prefer .ogg over .m4a)
        const seMap = new Map();

        files
          .filter((file) => /\.(ogg|m4a|mp3|wav)$/i.test(file))
          .forEach((file) => {
            const filename = file.replace(/\.(ogg|m4a|mp3|wav)$/i, '');
            const ext = file.match(/\.(ogg|m4a|mp3|wav)$/i)?.[0].toLowerCase();

            // Prefer .ogg over other formats
            if (!seMap.has(filename) || ext === '.ogg') {
              seMap.set(filename, {
                filename,
                path: `/assets/se/${file}`,
              });
            }
          });

        const seFiles = Array.from(seMap.values()).sort((a, b) =>
          a.filename.localeCompare(b.filename)
        );

        return Response.json({ seFiles });
      } catch (error) {
        console.error('Error listing sound effects:', error);
        return Response.json(
          { error: 'Failed to list sound effects' },
          { status: 500 }
        );
      }
    },

    // Serve animation assets (spritesheets, sound effects)
    '/assets/*': async (req) => {
      const url = new URL(req.url);
      const filePath = `../..${url.pathname}`; // e.g., ../../assets/img/animations/Hit1.png or ../../assets/se/Blow1.ogg
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file);
      }
      return new Response('Not Found', { status: 404 });
    },

    // Serve studio public assets (CSS, fonts, etc.)
    '/css/*': async (req) => {
      const url = new URL(req.url);
      const filePath = `./public${url.pathname}`; // e.g., ./public/css/fontawesome.min.css
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file);
      }
      return new Response('Not Found', { status: 404 });
    },

    '/webfonts/*': async (req) => {
      const url = new URL(req.url);
      const filePath = `./public${url.pathname}`; // e.g., ./public/webfonts/fa-solid-900.woff2
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file);
      }
      return new Response('Not Found', { status: 404 });
    },

    // Serve index.html for all unmatched routes (SPA)
    '/*': index,
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
