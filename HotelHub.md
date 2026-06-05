# HotelHub

Fullstack microservices hotel booking platform.

## Services

- `frontend`: Next.js, TanStack Query, Zustand, Socket.io client
- `gateway`: Express API gateway, CORS, REST and GraphQL routing
- `server1`: Express REST API, Socket.io, Prisma, PostgreSQL, Redis, JWT auth
- `server2`: FastAPI, Strawberry GraphQL, SQLAlchemy, PostgreSQL
- `postgres_server1`, `postgres_server2`, `redis`: infrastructure containers

## Run

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Gateway: http://localhost:8080
- Server 1 REST: http://localhost:4001/health
- Server 2 GraphQL: http://localhost:4002/graphql

Server 1 runs Prisma migrations and seeds an admin/user on startup. Server 2 creates catalog tables and seeds 5 hotels, 3 rooms each, and sample reviews on startup.
