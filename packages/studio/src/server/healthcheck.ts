#!/usr/bin/env bun
/**
 * Docker Healthcheck Script
 *
 * Pings the server to verify it's running and responding.
 * Exits with 0 if healthy, 1 if unhealthy.
 */

async function healthcheck() {
  const PORT = process.env.SERVER_PORT || '3000';
  const url = `http://localhost:${PORT}/`;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok || response.status === 500) {
      // 200 OK or 500 (server is running, even if build fails)
      console.log(`✓ Server is responding on port ${PORT}`);
      process.exit(0);
    } else {
      console.error(`✗ Server returned status ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`✗ Healthcheck failed:`, error);
    process.exit(1);
  }
}

// Run healthcheck
healthcheck();
