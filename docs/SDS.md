# SDS.md

# Software Design Specification

## Architecture

Monorepo architecture using pnpm workspaces.

Applications:

- frontend
- backend
- packages/shared

---

# Frontend Architecture

## Stack

- React 19
- TypeScript
- Vite
- Zustand
- TanStack Query
- TipTap
- shadcn/ui

## Structure

frontend/src/

- components/
- pages/
- services/
- store/
- hooks/
- routes/

## State Management

- Zustand for global auth state
- TanStack Query for server state

---

# Backend Architecture

## Stack

- Node.js 22
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL 16

## Structure

backend/src/

- routes/
- controllers/
- services/
- middleware/
- repositories/
- utils/
- validators/

---

# Database Design

## Tables

### users

- id
- email
- passwordHash
- createdAt
- updatedAt

### refresh_tokens

- id
- userId
- token
- expiresAt
- revokedAt

### notes

- id
- userId
- title
- content
- deletedAt
- createdAt
- updatedAt

### tags

- id
- userId
- name
- color

### note_tags

- noteId
- tagId

### shared_links

- id
- noteId
- token
- expiresAt
- revokedAt
- viewCount

### note_versions

- id
- noteId
- title
- content
- createdAt

---

# Authentication Design

## Access Token

- JWT
- Expiry: 15 minutes

## Refresh Token

- Stored in DB
- Expiry: 7 days

## Password Reset

- OTP stored temporarily
- OTP logged to console only

---

# API Design

## REST API

Base URL:

/api/v1

## Response Format

Success:

{
"success": true,
"data": {}
}

Error:

{
"success": false,
"error": {
"message": "",
"code": ""
}
}

---

# Search Design

## PostgreSQL Full Text Search

Use:

- tsvector
- tsquery
- GIN indexes
- ts_rank

Search applies to:

- note title
- note content

---

# Sharing Design

## Public Links

Token-based public links:

- Random secure token
- Read-only access
- Expiry support

---

# Versioning Design

Each note save creates:

- snapshot row
- readonly history

Restore creates:

- new version entry

---

# Shared Package

packages/shared/

Contains:

- zod schemas
- shared types
- API contracts
- constants

Frontend and backend must consume shared package.

---

# Testing Strategy

## Unit Tests

- Vitest

## API Tests

- Supertest

## E2E Tests

- Playwright

Coverage target:

- 80% minimum for new code

---

# Dev Tooling

- ESLint
- Prettier
- Husky
- commitlint

---

# Deployment

## Backend

- Node.js server

## Frontend

- Static Vite build

## Database

- PostgreSQL 16

---

# Constraints

- No real time collboration
- No file and attchments service
- No mobile app
- No OAuth / social login
- No folders or nesting
- No email integration. Email information logs to console
