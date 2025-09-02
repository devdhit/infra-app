# IT Asset Management System (ITAMS) Deployment Options

This document describes the different deployment options available for the IT Asset Management System (ITAMS).

## Table of Contents

- [Deployment Options](#deployment-options)
  - [1. Native Ubuntu Deployment](#1-native-ubuntu-deployment)
  - [2. Docker Deployment](#2-docker-deployment)
  - [3. Docker Compose Deployment](#3-docker-compose-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Post-Deployment Steps](#post-deployment-steps)

## Deployment Options

### 1. Native Ubuntu Deployment

For detailed instructions on deploying ITAMS directly on Ubuntu Desktop 22.04, please refer to the [DEPLOYMENT.md](DEPLOYMENT.md) file.

This deployment method installs all components directly on the Ubuntu system and is recommended for:
- Environments where containerization is not preferred
- Maximum performance requirements
- Direct system integration needs

### 2. Docker Deployment

ITAMS can be deployed using Docker with the provided Dockerfile.

#### Building the Docker Image

```bash
docker build -t itams .
```

#### Running the Container

```bash
docker run -d \
  -p 3000:3000 \
  --name itams \
  -e DATABASE_URL="postgresql://itams_user:Abcd_2025@host.docker.internal:5432/itams_db?schema=public" \
  -e JWT_SECRET="your-production-secret-key-here" \
  -e NODE_ENV="production" \
  itams
```

Note: You'll need to have PostgreSQL running externally for this deployment method.

### 3. Docker Compose Deployment

For the easiest deployment experience, use the provided docker-compose.yml file which includes both the application and database services.

#### Deploying with Docker Compose

```bash
docker-compose up -d
```

This will start both the ITAMS application and PostgreSQL database services with proper networking and volume management.

#### Stopping the Services

```bash
docker-compose down
```

#### Viewing Logs

```bash
docker-compose logs
```

## Environment Variables

The following environment variables must be configured for the application to run properly:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:password@host:port/database |
| JWT_SECRET | Secret key for JWT token signing | your-super-secret-jwt-key |
| NODE_ENV | Node.js environment | production |

## Database Setup

After deploying the application, you'll need to set up the database schema:

### For Native Deployment

```bash
npx prisma migrate deploy
npx prisma generate
```

### For Docker Deployment

```bash
docker exec -it itams npx prisma migrate deploy
docker exec -it itams npx prisma generate
```

### For Docker Compose Deployment

```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate
```

## Post-Deployment Steps

### 1. Seeding Initial Data (Optional)

To populate the database with sample data:

```bash
# Native deployment
npm run seed

# Docker deployment
docker exec -it itams npm run seed

# Docker Compose deployment
docker-compose exec app npm run seed
```

### 2. Creating Initial User Accounts

Access the application and use the default credentials:
- Admin User: admin@demo.com / password
- Regular User: user@demo.com / password

It's highly recommended to change these passwords immediately after first login.

### 3. Configuring SSL (Recommended for Production)

For production deployments, configure SSL certificates to encrypt traffic:
- For native deployment, use Let's Encrypt with Certbot
- For Docker deployments, configure SSL at the reverse proxy level

### 4. Setting Up Backups

Implement regular backup procedures for both application data and database:
- Use cron jobs for automated backups
- Store backups in secure, offsite locations
- Regularly test backup restoration procedures

## Monitoring and Maintenance

### Health Checks

The application provides a health check endpoint at `/api/health` which can be used for monitoring.

### Log Management

- Native deployment: Logs are managed by PM2
- Docker deployment: Use `docker logs` command
- Docker Compose: Use `docker-compose logs` command

### Updates

To update the application:

1. Pull the latest code
2. Rebuild the Docker images (if using Docker)
3. Run database migrations if needed
4. Restart the services

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify database credentials
   - Check if the database service is running
   - Ensure network connectivity between app and database

2. **Application Won't Start**
   - Check logs for error messages
   - Verify all required environment variables are set
   - Ensure required ports are available

3. **Permission Denied Errors**
   - Check file and directory permissions
   - Ensure the application has necessary access rights

For detailed troubleshooting steps, refer to the [DEPLOYMENT.md](DEPLOYMENT.md) file.