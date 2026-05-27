# FRS.md

# Functional Requirements Specification

## Project Overview

Build a full-stack Note Taking Application where authenticated users can:

- Create and manage notes
- Organize notes using tags
- Search notes using full-text search
- Share notes publicly using secure links
- Track and restore note version history

---

# Functional Requirements

## FR-1 Authentication

### FR-1.1 User Registration

Users shall be able to:

- Register using email and password
- Receive validation errors for invalid inputs
- Prevent duplicate email registrations

### FR-1.2 Login

Users shall be able to:

- Login using email and password
- Receive JWT access token
- Receive refresh token

### FR-1.3 Logout

Users shall be able to:

- Logout current session
- Invalidate refresh token

### FR-1.4 Forgot Password

Users shall be able to:

- Request password reset using email
- Receive OTP (console log only)
- Reset password using OTP

---

## FR-2 Notes Management

### FR-2.1 Create Note

Users shall be able to:

- Create notes
- Add title and content
- Add multiple tags

### FR-2.2 Read Notes

Users shall be able to:

- View all notes
- View individual note
- Filter deleted notes

### FR-2.3 Update Note

Users shall be able to:

- Update title
- Update content
- Update tags

### FR-2.4 Delete Note

Users shall be able to:

- Soft delete notes
- Restore deleted notes within 30 days

---

## FR-3 Tags

### FR-3.1 Tag CRUD

Users shall be able to:

- Create tags
- Update tags
- Delete tags

### FR-3.2 Tag Features

Tags shall support:

- Color values
- Note counts
- User-scoped ownership

---

## FR-4 Search

### FR-4.1 Full Text Search

Users shall be able to:

- Search notes using keywords
- Search title and content
- Receive paginated results

### FR-4.2 Highlighting

Search results shall:

- Highlight matched keywords
- Return relevance-ranked results

---

## FR-5 Sharing

### FR-5.1 Public Sharing

Users shall be able to:

- Generate public links
- Revoke public links
- Set expiry dates

### FR-5.2 Public Access

Public users shall:

- View shared note
- Not require authentication

### FR-5.3 View Count

System shall:

- Track public views atomically

---

## FR-6 Version History

### FR-6.1 Snapshots

System shall:

- Create note snapshot on save
- Store historical versions

### FR-6.2 Restore

Users shall be able to:

- View previous versions
- Restore any previous version

### FR-6.3 Retention

System shall:

- Auto-purge old versions after retention window

---

# Non Functional Requirements

## Performance

- API response < 500ms for standard CRUD
- Search results < 1 second

## Security

- JWT authentication required
- Passwords hashed using bcrypt
- Protected routes require auth middleware

## Reliability

- Soft delete recovery window: 30 days
- Refresh token expiry: 7 days

---

# Out of Scope

- Real-time collaboration
- File attachments
- Mobile app
- OAuth login
- Nested folders
- Email provider integration
