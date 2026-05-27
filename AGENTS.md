# AGENTS.md

## Project Overview

Full-stack note taking application with:

- Auth
- Notes CRUD
- Tags
- Search
- Sharing
- Version history

## Stack

Frontend:

- React 19
- TypeScript
- Vite
- Zustand
- TanStack Query
- TipTap

Backend:

- Node.js 22
- Express 5
- Prisma
- PostgreSQL

Testing:

- Vitest
- Supertest
- Playwright

## Rules

- Shared schemas in packages/shared only
- Soft delete using deletedAt
- JWT auth with refresh tokens
- Follow OpenSpec workflow strictly
