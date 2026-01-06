# Deployment Guide - Floating Theraphy Frontend

This guide explains how to deploy the Floating Theraphy Frontend to a VPS using GitHub Actions and Docker.

## Prerequisites

- Docker Hub account
- VPS server (Hostinger or any other VPS provider)
- Docker installed on VPS
- GitHub repository with push access

## Setup Instructions

### 1. Create a Release Branch

```bash
git checkout -b release
git push origin release
```

### 2. Configure GitHub Secrets

Go to your GitHub repository: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add the following secrets:

#### Docker Hub Credentials

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username | `your-dockerhub-username` |
| `DOCKER_HUB_ACCESS_TOKEN` | Docker Hub access token | Generate from Docker Hub → Account Settings → Security |

#### VPS Server Credentials

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HOSTINGER_VPS_HOST` | VPS server IP address or hostname | `123.45.67.89` or `server.example.com` |
| `HOSTINGER_VPS_USERNAME` | SSH username for VPS | `root` or `ubuntu` |
| `HOSTINGER_VPS_PASSWORD` | SSH password for VPS | `your-secure-password` |
| `HOSTINGER_VPS_PORT` | SSH port (optional, defaults to 22) | `22` |

#### Application Environment Variables

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.thetalounge.com` |

### 3. VPS Server Setup

SSH into your VPS and ensure Docker is installed:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker installation
docker --version
```

### 4. Configure Firewall (Optional)

If you're using a firewall (like ufw), allow port 3001:

```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

### 5. Deploy

Push changes to the `release` branch to trigger automatic deployment:

```bash
git checkout release
git merge main
git push origin release
```

The GitHub Action will:
1. ✅ Checkout code
2. ✅ Setup Node.js and install dependencies
3. ✅ Build the Vite application
4. ✅ Build Docker image with timestamp tag
5. ✅ Push image to Docker Hub
6. ✅ SSH into VPS
7. ✅ Pull latest image
8. ✅ Stop and remove old container
9. ✅ Start new container on port 3001

## Manual Deployment (Fallback)

If you need to deploy manually:

### Build and Push Docker Image

```bash
# Build image
docker build \
  --build-arg VITE_API_URL="https://api.thetalounge.com" \
  -t your-dockerhub-username/theta-lounge-fe:latest .

# Push to Docker Hub
docker login
docker push your-dockerhub-username/theta-lounge-fe:latest
```

### Deploy on VPS

```bash
# SSH into VPS
ssh username@your-vps-ip

# Pull latest image
docker pull your-dockerhub-username/theta-lounge-fe:latest

# Stop old container
docker stop theta-lounge-frontend || true
docker rm theta-lounge-frontend || true

# Run new container
docker run -d -p 3001:3001 --name theta-lounge-frontend \
  -e VITE_API_URL="https://api.thetalounge.com" \
  --restart unless-stopped \
  your-dockerhub-username/theta-lounge-fe:latest

# Check container status
docker ps | grep theta-lounge-frontend
docker logs theta-lounge-frontend
```

## Accessing the Application

After successful deployment, your application will be available at:

- **Direct Access:** `http://your-vps-ip:3001`
- **With Domain:** Configure Nginx or Apache as reverse proxy

### Optional: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name thetalounge.com www.thetalounge.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Health Check

The application includes a health check endpoint:

```bash
curl http://your-vps-ip:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00+00:00"
}
```

## Monitoring and Logs

```bash
# View container logs
docker logs theta-lounge-frontend

# Follow logs in real-time
docker logs -f theta-lounge-frontend

# Check container stats
docker stats theta-lounge-frontend

# Inspect container
docker inspect theta-lounge-frontend
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs theta-lounge-frontend

# Check if port is already in use
sudo netstat -tulpn | grep 3001

# Remove all stopped containers
docker container prune -f
```

### Image Pull Fails

```bash
# Re-login to Docker Hub
docker login -u your-dockerhub-username

# Pull image manually
docker pull your-dockerhub-username/theta-lounge-fe:latest
```

### Deployment Fails

1. Check GitHub Actions logs in repository
2. Verify all secrets are correctly set
3. Ensure VPS has enough resources (RAM, disk space)
4. Verify Docker is running on VPS: `sudo systemctl status docker`

## Rollback

To rollback to a previous version:

```bash
# List available image tags
docker images | grep theta-lounge-fe

# Stop current container
docker stop theta-lounge-frontend
docker rm theta-lounge-frontend

# Run specific version (replace TIMESTAMP with actual tag)
docker run -d -p 3001:3001 --name theta-lounge-frontend \
  -e VITE_API_URL="https://api.thetalounge.com" \
  --restart unless-stopped \
  your-dockerhub-username/theta-lounge-fe:TIMESTAMP
```

## Security Best Practices

1. ✅ Use strong passwords for VPS access
2. ✅ Keep Docker and system packages updated
3. ✅ Use SSH keys instead of passwords (recommended)
4. ✅ Configure firewall to allow only necessary ports
5. ✅ Use HTTPS with SSL certificates (Let's Encrypt)
6. ✅ Regularly backup your VPS
7. ✅ Monitor application logs for suspicious activity

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Production Deployment](https://vitejs.dev/guide/static-deploy.html)

## Support

For issues or questions, please open an issue on the GitHub repository.

