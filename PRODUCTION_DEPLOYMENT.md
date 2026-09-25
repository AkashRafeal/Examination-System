# Production Deployment Guide: Examination System

## 1. Production Architecture Overview

```
                          [ Internet Traffic ]
                                   │
                                   ▼
             [ Reverse Proxy / Load Balancer: NGINX / Caddy ]
               • TLS/SSL Termination (HTTPS)
               • Gzip / Brotli Compression
               • Static Asset Caching (_next/static/*)
               • Rate Limiting & DDoS Shield
                                   │
                                   ▼
          [ Examination App: Node.js 22 Production Cluster ]
               • Next.js Production Build (`npm run start`)
               • 200+ Concurrent Virtual User Capability
               • In-Memory Question Cache
               • In-Memory Sliding Window Rate Limiter
               • Authoritative 1-Hour Server Countdown Timer
                                   │
                                   ▼
             [ Database Tier: PostgreSQL 15+ Cluster ]
               • Dedicated Connection Pooling (`connection_limit=30`)
               • Tuned Composite Indexes on Assessments & Questions
               • Automated Daily Logical Backups (`pg_dump`)
```

---

## 2. Environment Variables Checklist

Create a production `.env` file (do NOT commit secrets to git):

```env
# Database Connection (Tune connection_limit and pool_timeout for production)
DATABASE_URL="postgresql://db_user:secure_password@db-host:5432/examination_db?schema=public&connection_limit=30&pool_timeout=20"

# Application Security (Must be random, at least 32 characters)
AUTH_SECRET="your-ultra-secure-random-32-byte-hex-string-here"

# Domain URL
NEXT_PUBLIC_APP_URL="https://exam.yourdomain.com"

# Upload Limits
MAX_UPLOAD_SIZE_MB="20"

# Exam Rules
EXAM_DURATION_MINUTES="60"
```

---

## 3. Production Build & Execution

Never run `npm run dev` in production. Always build and run the optimized production bundle:

```bash
# 1. Install dependencies
npm ci --omit=dev

# 2. Sync database schema
npx prisma db push
npx prisma generate

# 3. Compile optimized production build
npm run build

# 4. Start Next.js production server
npm run start
```

---

## 4. Process Management (PM2)

Use PM2 for zero-downtime execution and automatic restarts:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "examination-portal" -- start -- -p 3000

# Configure system startup
pm2 startup
pm2 save
```

---

## 5. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/exam-portal`:

```nginx
server {
    listen 80;
    server_name exam.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name exam.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/exam.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/exam.yourdomain.com/privkey.pem;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static Assets Cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API and Dynamic Pages
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for concurrent operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## 6. Database Backup Strategy

1. **Daily Automated Dump (Cron):**
   ```bash
   0 2 * * * pg_dump -U postgres -d examination_db -Fc -f /backups/exam_db_$(date +\%Y\%m\%d).dump
   ```
2. **Retention Policy:** Retain daily dumps for 14 days, weekly dumps for 8 weeks, monthly dumps for 1 year.
3. **Restore Verification:**
   ```bash
   pg_restore -U postgres -d examination_db_test -v /backups/exam_db_YYYYMMDD.dump
   ```
