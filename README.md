# DepLens Phase 1

Phase 1 provides password-based authentication for the Next.js App Router frontend and Express API.

## Architecture

- MongoDB/Mongoose stores users and only scrypt password hashes.
- Short-lived HMAC-signed access tokens are kept in frontend memory.
- Rotating, hashed refresh tokens are stored in an HttpOnly cookie and hashed in MongoDB.
- Zod validates every authentication request body; protected routes use bearer-token middleware.
- Authentication endpoints have an in-memory IP rate limit suitable for local/single-instance deployment.

## Local setup

1. Copy `Backend/.env.example` to `Backend/.env` and set a unique `JWT_SECRET`.
2. Start MongoDB.
3. Run `pnpm install` in `Backend` and `frontend`.
4. Run `pnpm dev` in `Backend` and `frontend` in separate terminals.

Set `frontend/.env.local` to `NEXT_PUBLIC_API_URL=http://localhost:4000` when the API is not on its default URL.

## API examples

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"correct horse battery staple"}'
curl http://localhost:4000/api/v1/auth/me -H 'Authorization: Bearer ACCESS_TOKEN'
curl -X POST http://localhost:4000/api/v1/auth/refresh --cookie 'refreshToken=COOKIE_VALUE'
curl -X POST http://localhost:4000/api/v1/auth/logout
```

GitHub OAuth, dependency analysis, and AI are intentionally outside Phase 1.
