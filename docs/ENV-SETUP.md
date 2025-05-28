# Environment Configuration

This document outlines how to properly configure environment variables for the inventory application, particularly for authentication with Clerk.

## Required Environment Variables

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (starts with `pk_`) | `pk_test_abc123...` |
| `CLERK_SECRET_KEY` | Clerk secret key (starts with `sk_`) | `sk_test_abc123...` |
| `NEXT_PUBLIC_SKIP_CLERK_AUTH` | Skip authentication (development only) | `false` |

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |

### Application

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `local` or `1.0.0` |

## Setup for Different Environments

### Local Development

1. Create a `.env.local` file in the project root
2. Add the required environment variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_SKIP_CLERK_AUTH=false

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/inventory?schema=public"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Start the development server with `npm run dev`

### Production Deployment

For production deployment, ensure the environment variables are set in your hosting environment.

#### Docker

When building with Docker, pass environment variables as build arguments:

```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key \
  --build-arg CLERK_SECRET_KEY=sk_live_your_key \
  --build-arg NEXT_PUBLIC_SKIP_CLERK_AUTH=false \
  -t inventory-app .
```

When running the container, set the environment variables:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key \
  -e CLERK_SECRET_KEY=sk_live_your_key \
  -e NEXT_PUBLIC_SKIP_CLERK_AUTH=false \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  inventory-app
```

#### Choreo Deployment

For Choreo deployment, set the environment variables in the Choreo dashboard. See [CHOREO-DEPLOYMENT.md](./CHOREO-DEPLOYMENT.md) for detailed instructions.

## Troubleshooting

### Authentication Errors

If you encounter authentication errors:

1. Verify your Clerk API keys in the [Clerk Dashboard](https://dashboard.clerk.com/)
2. Check that the environment variables are correctly set
3. Try setting `NEXT_PUBLIC_SKIP_CLERK_AUTH=true` temporarily to bypass authentication
4. Check the application logs for detailed error messages
5. Use the `/api/health` endpoint to verify environment configuration

### Checking Environment Configuration

Access the `/api/health` endpoint to verify that environment variables are correctly set:

```bash
curl http://localhost:3000/api/health
```

The response will show if authentication is enabled and if the required keys are set (without exposing the actual keys).

## Security Considerations

- Never commit your `.env.local` file or any file containing actual API keys to version control
- Use different API keys for development and production environments
- Rotate API keys periodically for security
- In production, use secrets management solutions provided by your hosting platform 