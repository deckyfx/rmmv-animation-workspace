# Docker Deployment Guide

This guide explains how to deploy RMMV Animation Studio using Docker.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 1.29+)
- At least 512MB RAM available
- Port 10021 available

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at http://localhost:10021

### Using Docker CLI

```bash
# Build the image
docker build -t rmmv-animation-studio .

# Run the container
docker run -d \
  --name rmmv-animation-studio \
  -p 10021:10021 \
  -v $(pwd)/animations.db:/app/animations.db \
  -v $(pwd)/assets:/app/assets \
  rmmv-animation-studio

# View logs
docker logs -f rmmv-animation-studio

# Stop the container
docker stop rmmv-animation-studio
docker rm rmmv-animation-studio
```

## Volume Mounts

The Docker setup uses two volume mounts for data persistence:

1. **Database**: `./animations.db:/app/animations.db`
   - Persists animation data between container restarts
   - SQLite database file

2. **Assets**: `./assets:/app/assets`
   - Animation sprite sheets (`assets/img/animations/*.png`)
   - Sound effects (`assets/se/*.ogg`)
   - Easy to update by adding files to the host directory

## Environment Variables

You can customize the deployment with environment variables:

```yaml
# docker-compose.yml
environment:
  - NODE_ENV=production
  - SERVER_PORT=10021  # Change port if needed
```

Or with Docker CLI:

```bash
docker run -d \
  -e NODE_ENV=production \
  -e SERVER_PORT=10021 \
  -p 10021:10021 \
  rmmv-animation-studio
```

## Adding Assets

To add new animation sprite sheets or sound effects:

1. **Add sprite sheets**:
   ```bash
   # Copy PNG files to assets/img/animations/
   cp MyAnimation.png assets/img/animations/
   ```

2. **Add sound effects**:
   ```bash
   # Copy OGG files to assets/se/
   cp MySound.ogg assets/se/
   ```

3. The assets are immediately available (no container restart needed)

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Port Already in Use

If port 10021 is already in use, change it in `docker-compose.yml`:

```yaml
ports:
  - "8080:10021"  # Use port 8080 instead
```

### Database Permissions

If you encounter database permission errors:

```bash
# Fix permissions
chmod 666 animations.db

# Rebuild container
docker-compose up -d --force-recreate
```

### View Container Logs

```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

### Reset Database

To start fresh:

```bash
# Stop container
docker-compose down

# Remove database
rm animations.db

# Rebuild (database will be recreated)
docker-compose up -d --build
```

## Production Deployment

For production deployment, consider:

1. **Reverse Proxy**: Use nginx or Traefik for SSL/TLS
2. **Resource Limits**: Set memory and CPU limits
3. **Monitoring**: Use Prometheus + Grafana
4. **Backups**: Regular backups of `animations.db`

Example with resource limits:

```yaml
services:
  rmmv-animation-studio:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Health Check

The container includes a health check that verifies the server is running:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' rmmv-animation-studio
```

Possible statuses:
- `starting`: Container is starting up
- `healthy`: Server is responding
- `unhealthy`: Server is not responding

## Security Considerations

1. **Do not expose to public internet** without proper authentication
2. **Use environment variables** for sensitive configuration
3. **Keep Docker and dependencies updated**
4. **Use read-only volumes** where possible:
   ```yaml
   volumes:
     - ./assets:/app/assets:ro  # Read-only assets
   ```

## Support

For issues or questions:
- Check container logs: `docker-compose logs`
- Verify port availability: `netstat -an | grep 10021`
- Ensure assets directory exists and has proper permissions
