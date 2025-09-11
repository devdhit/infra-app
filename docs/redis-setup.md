# Redis Setup for IT Asset Management System

This document explains how to set up Redis caching for the ITAMS application to improve performance.

## Prerequisites

- Docker (recommended) or a Redis server installation

## Setup Options

### Option 1: Using Docker (Recommended)

1. Make sure Docker Desktop is running
2. Run the following command to start a Redis container:

```bash
docker run -d -p 6379:6379 --name redis-cache redis
```

3. Verify Redis is running:

```bash
docker ps
```

You should see the redis-cache container in the list.

### Option 2: Using Redis on Windows

1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Redis will start on port 6379 by default

### Option 3: Using Redis on Linux/macOS

1. Install Redis using your package manager:
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

   **macOS:**
   ```bash
   brew install redis
   brew services start redis
   ```

2. Start Redis service if not automatically started

## Configuration

1. Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

2. Update the Redis URL in your `.env` file if needed:

```env
REDIS_URL=redis://localhost:6379
```

## Cache Structure

The application uses the following cache key structure:

- `permissions:{roleId}:{tenantId}` - Role permissions
- `assets:{modelType}:{tenantId}:{assetId}` - Individual assets
- `asset_list:{modelType}:{tenantId}:{page}:{limit}:{search}:{status}` - Asset lists
- `custom_fields:{tenantId}:{modelType}` - Custom fields for a model type

## Cache TTL (Time To Live)

- Assets: 5 minutes
- Asset lists: 2 minutes
- Permissions: 5 minutes
- Custom fields: 10 minutes
- Search results: 1 minute

## Testing Redis Connection

Run the test script to verify Redis is working:

```bash
npx tsx script/test-redis-cache.ts
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Make sure Redis is running and accessible on port 6379
2. **Permission Denied**: Check Redis configuration for binding to localhost
3. **Docker Issues**: Ensure Docker Desktop is running properly

### Checking Redis Status

```bash
# If using Docker
docker ps | grep redis

# If Redis CLI is available
redis-cli ping
```

The response should be `PONG` if Redis is running correctly.

## Disabling Redis

If you want to disable Redis caching, simply remove or comment out the `REDIS_URL` from your `.env` file. The application will fall back to database queries only.