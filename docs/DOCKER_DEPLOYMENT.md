# SentinelNet Docker deployment

This is the intended deployment path for the dedicated SentinelNet server laptop.

## Architecture

```text
Analyst browser
      |
      |  http://SERVER_IP:8080
      v
Web container (Nginx + React)
      |
      | /api/*
      v
Express API container
      |                     \
      |                      \
      v                       v
MongoDB container        FastAPI NLP container
persistent volume        XLM-R transformer
                         persistent Hugging Face cache
```

Only the web port is published to the host. Express, FastAPI and MongoDB remain on an internal Docker network.

## Requirements

Install Docker Engine and Docker Compose v2 on the server laptop.

Verify:

```bash
docker --version
docker compose version
```

## 1. Clone SentinelNet

```bash
git clone https://github.com/aeroslayys/SentinelNet_FullStack_Prototype.git
cd SentinelNet_FullStack_Prototype
git switch feature/mongo-nlp-foundation
```

After this feature branch is merged, deployment should use `main` instead.

## 2. Create deployment environment

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker`.

At minimum, replace:

```env
MONGO_ROOT_PASSWORD=replace-with-a-long-random-password
```

For LAN deployment, set the laptop's LAN address:

```env
PUBLIC_ORIGIN=http://192.168.1.50:8080
WEB_PORT=8080
```

Use a URL-safe MongoDB password unless the URI is updated to use percent-encoding.

Do not commit `.env.docker`.

## 3. Build and start

```bash
docker compose --env-file .env.docker up -d --build
```

The first NLP startup can take several minutes because the transformer model is downloaded. The model is cached in the `hf_cache` Docker volume and survives container recreation.

Check service status:

```bash
docker compose --env-file .env.docker ps
```

Follow logs:

```bash
docker compose --env-file .env.docker logs -f
```

NLP logs only:

```bash
docker compose --env-file .env.docker logs -f nlp
```

API logs only:

```bash
docker compose --env-file .env.docker logs -f api
```

## 4. Open SentinelNet

On the server:

```text
http://localhost:8080
```

On another device on the same LAN:

```text
http://SERVER_LAN_IP:8080
```

Example:

```text
http://192.168.1.50:8080
```

## Persistence

MongoDB data is stored in the named Docker volume:

```text
mongo_data
```

The Hugging Face model cache is stored in:

```text
hf_cache
```

Therefore this is safe:

```bash
docker compose --env-file .env.docker down
docker compose --env-file .env.docker up -d
```

The database and model cache remain.

Do **not** run this unless you intentionally want to erase persistent data:

```bash
docker compose --env-file .env.docker down -v
```

## Updating the server

```bash
git pull
docker compose --env-file .env.docker up -d --build
```

## Security model

Only Nginx publishes a host port.

These services are intentionally not directly exposed:

```text
MongoDB  27017
FastAPI   8000
Express   5050
```

The browser reaches Express through Nginx's `/api` reverse proxy.

For an internet-facing deployment, the next step is HTTPS with a real domain and a TLS reverse proxy such as Caddy, plus authentication and authorization. The current Compose stack is appropriate for a trusted LAN/demo server and as the base for that production deployment.
