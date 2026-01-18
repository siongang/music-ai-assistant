# Home Server Deployment Plan - Beginner Friendly

**For**: Running Music Assistant on your home server  
**Difficulty**: Beginner  
**Time**: 1-2 days setup + learning

---

## Overview

This guide will help you deploy your Music Assistant to a home server using Docker. We'll go step by step, explaining everything along the way.

---

## Phase 1: Understanding (Start Here)

### What's a Home Server?

A home server is just a computer that runs 24/7 at your home. It can be:
- An old laptop you're not using
- A Raspberry Pi (though might be too weak for this project)
- A desktop PC
- A small dedicated server like an Intel NUC

### Why Use a Home Server?

**Pros:**
- ✅ One-time hardware cost (no monthly cloud fees)
- ✅ Full control over your data
- ✅ Learn valuable skills
- ✅ Can host multiple projects

**Cons:**
- ❌ You pay for electricity (~$10-20/month)
- ❌ Need decent home internet
- ❌ You're responsible for maintenance
- ❌ No automatic backups (you need to set up)

### Minimum Requirements for This Project

| Component | Minimum | Recommended | Why |
|-----------|---------|-------------|-----|
| **CPU** | 4 cores | 8 cores | Demucs model is CPU-intensive |
| **RAM** | 12GB | 16GB+ | Models load into memory |
| **Disk** | 100GB free | 500GB+ | Audio files + models |
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04 LTS | Best Docker support |
| **Internet** | 50 Mbps up | 100+ Mbps up | For uploading/downloading files |

---

## Phase 2: What is Docker? (Learn Before Doing)

### The Container Analogy

Think of your application like moving to a new house:

**Without Docker (Current State):**
- You pack everything loosely in your car
- At the new house, you need to:
  - Install Python
  - Install Redis
  - Install all dependencies
  - Configure everything
  - Hope it works the same way
- Moving again? Start over!

**With Docker:**
- Everything goes in a standardized shipping container
- The container works the same everywhere
- At the new house (or server):
  - Install Docker
  - Run your container
  - Done!
- Moving? Just move the container

### Key Docker Concepts

#### 1. Image
**What**: A blueprint/template for your application
**Like**: A recipe for a cake

```dockerfile
# Example Dockerfile (recipe)
FROM python:3.10           # Start with Python
COPY . /app                # Copy your code
RUN pip install requirements  # Install dependencies
CMD ["run my app"]         # How to start
```

#### 2. Container
**What**: A running instance of an image
**Like**: The actual cake you baked from the recipe

```bash
# Build the image (prepare the recipe)
docker build -t my-app .

# Run a container (bake the cake)
docker run my-app
```

Multiple containers can run from the same image!

#### 3. Docker Compose
**What**: Orchestrates multiple containers
**Like**: A meal with multiple dishes (main, sides, dessert)

```yaml
# docker-compose.yml
services:
  api:        # Main dish (FastAPI)
  worker:     # Side dish (Celery)
  database:   # Dessert (PostgreSQL)
  redis:      # Appetizer (Redis)
```

One command starts everything: `docker-compose up`

#### 4. Volumes
**What**: Persistent storage for containers
**Like**: A separate hard drive that survives even if you delete the container

**Why needed**: Containers are temporary. When you delete them, data inside is lost.
**Solution**: Store important data in volumes.

```yaml
volumes:
  - ./my-data:/app/data  # Maps host folder to container folder
```

---

## Phase 3: Your Dockerization Plan

### What Needs to be Dockerized?

You have 4 components that need to run:

```
┌─────────────────────────────────────────┐
│  1. FastAPI (Your REST API)             │  ← Needs Docker container
│     - Receives uploads                   │
│     - Creates jobs                       │
│     - Serves files                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  2. Celery Worker (Background processor)│  ← Needs Docker container
│     - Runs stem separation               │
│     - Runs MIDI conversion               │
│     - Heavy CPU/RAM usage                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  3. PostgreSQL (Database)               │  ← Use official Docker image
│     - Stores audio metadata              │
│     - Stores job records                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  4. Redis (Message Queue)               │  ← Use official Docker image
│     - Queues jobs                        │
│     - Stores task results                │
└─────────────────────────────────────────┘
```

### Strategy

1. **PostgreSQL & Redis**: Use official Docker images (no work needed!)
2. **FastAPI**: Create Dockerfile (we'll help you)
3. **Celery Worker**: Create Dockerfile (similar to FastAPI, with modifications)
4. **Orchestration**: Create docker-compose.yml to run everything

---

## Phase 4: Database Migration (SQLite → PostgreSQL)

### Why Switch?

**SQLite (current)**:
- ❌ File-based (not great for servers)
- ❌ Can't handle multiple connections well
- ❌ Locks entire database when writing
- ✅ Good for development

**PostgreSQL (target)**:
- ✅ Real database server
- ✅ Handles many connections
- ✅ Better performance
- ✅ Production-ready
- ✅ Industry standard

### Migration Steps (We'll Do This Later)

1. Export your current SQLite data
2. Set up PostgreSQL in Docker
3. Create tables in PostgreSQL
4. Import data from SQLite
5. Update connection string in your code

**Don't worry**: Your database schema doesn't change! Same tables, same structure.

---

## Phase 5: File Storage Strategy

### Current State
```
backend/tmp/
├── audio/
└── jobs/
```

### Docker Strategy

**Option 1: Docker Volumes (Recommended for beginners)**
```yaml
volumes:
  - ./storage:/app/storage
```
- Files are on your home server's disk
- Easy to backup (just copy the folder)
- Easy to access outside Docker

**Option 2: Named Volumes**
```yaml
volumes:
  - music-storage:/app/storage
```
- Docker manages the storage
- Slightly more isolated
- Need Docker commands to access

**Recommendation**: Use Option 1 for now (simpler to understand and manage).

---

## Phase 6: Step-by-Step Docker Setup (When Ready)

### Step 1: Install Docker on Your Machine (For Testing)

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add yourself to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Logout and login again

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Verify
docker --version
docker compose version
```

### Step 2: Create Dockerfiles (We'll Help)

You'll need to create these files:
- `backend/Dockerfile` - For FastAPI
- `backend/Dockerfile.worker` - For Celery Worker
- `docker-compose.yml` - To orchestrate everything

**Don't worry, we'll create these together once you're ready!**

### Step 3: Test Locally First

Before moving to home server:
```bash
# Build everything
docker compose build

# Start everything
docker compose up

# Test if it works
curl http://localhost:8000/api/health
```

### Step 4: Deploy to Home Server

Once working locally:
```bash
# On your home server
git clone your-repo
cd your-repo

# Start everything
docker compose up -d  # -d means "detached" (runs in background)
```

---

## Phase 7: Home Server Access

### Local Network Only (Easiest)

Access from any device on your home network:
```
http://192.168.1.100:8000
```
- Find your server's local IP
- Access from any device at home
- No security concerns
- No port forwarding needed

### Internet Access (Advanced)

If you want to access from outside your home:

**Option 1: Port Forwarding**
- Configure your router
- Forward port 8000 to your server
- Use your public IP: `http://your-public-ip:8000`
- ⚠️ Security risk if not done properly

**Option 2: Cloudflare Tunnel (Recommended)**
- Free service
- No port forwarding needed
- Encrypted connection
- Gets you a domain: `https://your-app.trycloudflare.com`

**Option 3: VPN**
- Use Tailscale or WireGuard
- Access as if you're on home network
- Most secure option

---

## Phase 8: Maintenance & Monitoring

### Starting/Stopping

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Restart one service
docker compose restart worker

# View logs
docker compose logs -f worker
```

### Auto-Start on Reboot

Add to docker-compose.yml:
```yaml
services:
  api:
    restart: unless-stopped  # Auto-restarts if crashes or server reboots
```

### Monitoring

```bash
# See what's running
docker compose ps

# See resource usage
docker stats

# See logs
docker compose logs --tail=100 worker
```

### Backup Strategy

**What to backup:**
1. Database (PostgreSQL data)
2. Audio files (`storage/` folder)
3. Your code (use Git)

```bash
# Simple backup script
tar -czf backup-$(date +%Y%m%d).tar.gz storage/ docker-compose.yml
```

---

## Phase 9: Costs

### Electricity Cost Estimate

**Assumptions:**
- Average desktop: 100W
- Running 24/7
- Electricity: $0.12/kWh (US average)

**Calculation:**
```
100W × 24 hours × 30 days = 72 kWh/month
72 kWh × $0.12 = $8.64/month
```

**Low power server (like NUC): ~$3-5/month**
**Regular desktop: ~$8-15/month**
**High-end desktop: ~$15-30/month**

Much cheaper than cloud! ($150-500/month)

---

## Common Beginner Questions

### Q: Do I need to know Linux?
**A**: Basic familiarity helps. You should know:
- How to use terminal/command line
- How to navigate directories (`cd`, `ls`)
- How to edit files (`nano` or `vim`)

### Q: What if I break something?
**A**: With Docker, it's easy to recover:
```bash
docker compose down  # Stop everything
docker compose up    # Start fresh
```
Your data in volumes is safe!

### Q: Can I use Windows?
**A**: Yes, with WSL2 (Windows Subsystem for Linux). Docker works great on WSL2.

### Q: How much will I learn?
**A**: You'll learn:
- Docker fundamentals
- Linux server management
- Database administration basics
- Networking basics
- System monitoring

**These skills are valuable for any developer!**

### Q: What if my internet goes down?
**A**: If you're accessing locally (same network), everything still works! If accessing from internet, obviously you can't connect until internet is back.

### Q: Can other people use it?
**A**: Yes! If you:
- Expose it to internet (with proper security)
- Or give them VPN access to your home network

---

## Next Steps

### ✅ Phase 1: Read and Understand (You're doing this now!)
- [ ] Read this document
- [ ] Read CURRENT_STATE.md
- [ ] Understand what you have

### ⏳ Phase 2: Prepare
- [ ] Ensure you have a home server (or can get one)
- [ ] Install Docker on your development machine
- [ ] Complete a Docker tutorial (see resources below)
- [ ] Understand basic Docker concepts

### ⏳ Phase 3: Answer These Questions
1. Do you have a home server ready? What specs?
2. Have you used Docker before? How comfortable are you?
3. Do you want local-only access or internet access?
4. Are you comfortable with Linux command line?

### ⏳ Phase 4: Create Dockerfiles (We'll do this together)
Once you're comfortable with Docker basics, we'll create:
- Dockerfile for FastAPI
- Dockerfile for Worker
- docker-compose.yml

---

## Learning Resources

### Docker
- **Official Tutorial**: https://docs.docker.com/get-started/
- **Docker Compose**: https://docs.docker.com/compose/gettingstarted/
- **YouTube**: "Docker Tutorial for Beginners" by TechWorld with Nana

### PostgreSQL
- **PostgreSQL Tutorial**: https://www.postgresqltutorial.com/
- **Docker & PostgreSQL**: https://www.docker.com/blog/how-to-use-the-postgres-docker-official-image/

### Home Server
- **r/homelab** - Reddit community
- **r/selfhosted** - Self-hosting community
- **Awesome Selfhosted**: https://github.com/awesome-selfhosted/awesome-selfhosted

---

## Timeline Estimate

| Phase | Time | What You're Doing |
|-------|------|-------------------|
| Learn Docker basics | 4-8 hours | Tutorials, practice |
| Create Dockerfiles | 2-4 hours | Writing, testing |
| Migrate to PostgreSQL | 2-3 hours | Database migration |
| Test locally | 2-4 hours | Debugging, fixing issues |
| Set up home server | 2-4 hours | OS install, Docker setup |
| Deploy | 1-2 hours | Copy, run, test |
| **Total** | **13-25 hours** | **Spread over 1-2 weeks** |

Don't rush! Take time to understand each step.

---

## When You're Ready

Let me know:
1. Your Docker comfort level (beginner/intermediate)
2. Your home server specs (if you have one)
3. Any specific concerns or questions
4. If you're ready to start creating Dockerfiles

Then we'll proceed to the next phase: **Creating your Docker configuration**.

---

**Remember**: You're not just deploying an app, you're learning valuable skills that will help you in future projects!



