# Deployment Guide — Hypasia AI v2.0

> How to deploy Hypasia for production use.

---

## Option 1: Local Development (Default)

See [README.md](../README.md) for the standard local setup.

---

## Option 2: Docker (Recommended for Production)

### `Dockerfile` (Backend)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY pyproject.toml .
COPY src/ ./src/

RUN pip install -e .[api]

EXPOSE 8000
CMD ["uvicorn", "hypasia.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `docker-compose.yml`
```yaml
version: '3.9'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - HF_TOKEN=${HF_TOKEN}
    volumes:
      - ./data:/app/data

  frontend:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./web:/app
    command: sh -c "npm install && npm run build && npx serve dist -p 3000"
    ports:
      - "3000:3000"
```

```bash
# Build and run
docker compose up --build

# Access at http://localhost:3000
```

---

## Option 3: Cloud Deployment

### Backend → Railway / Render / Fly.io
1. Push code to GitHub
2. Connect repo to Railway/Render
3. Set `Start Command`: `uvicorn hypasia.api.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `GEMINI_API_KEY`, `HF_TOKEN`
5. Deploy ✅

### Frontend → Vercel / Netlify
```bash
cd web
npm run build
# Upload the dist/ folder to Vercel or Netlify
# Set API base URL to your deployed backend URL
```

> [!IMPORTANT]
> Update the `API` constant in each `.jsx` page file from `http://localhost:8000` to your deployed backend URL before building.

---

## Production Checklist

- [ ] Replace `allow_origins=["*"]` with your specific frontend domain
- [ ] Enable HTTPS (use nginx reverse proxy + Let's Encrypt)
- [ ] Add API authentication (JWT tokens)
- [ ] Rate-limit `/api/synth/generate` (Gemini costs money per call)
- [ ] Migrate SQLite databases to PostgreSQL
- [ ] Set up automated backups for the 3 `.db` files
- [ ] Add logging and monitoring (e.g., Sentry)
- [ ] Set `DEBUG=False` in production

---

## Nginx Reverse Proxy Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/hypasia/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Important for SSE streaming (Chat, Synth)
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```
