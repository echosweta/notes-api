# Notes API

A RESTful backend API for creating and managing personal notes, built with Node.js, Express, and SQLite. Features secure user authentication with hashed passwords and JWT tokens, with full data isolation between users.

## Features
- User signup and login with hashed passwords (bcrypt)
- JWT-based authentication
- Full CRUD for notes (Create, Read, Update, Delete)
- Per-user data isolation — users can only access their own notes
- SQLite database with parameterized queries (SQL-injection safe)

## Tech Stack
- Node.js
- Express
- SQLite (better-sqlite3)
- bcrypt
- JSON Web Tokens (jsonwebtoken)

## Setup
1. Clone the repo
2. Run `npm install`
3. Create a `.env` file with a `JWT_SECRET` value
4. Run `node index.js`
5. Server runs on `http://localhost:3000`

## API Endpoints
| Method | Endpoint | Description | Auth required |
|--------|----------|--------------|----------------|
| POST | /signup | Create a new user | No |
| POST | /login | Log in, returns a JWT | No |
| POST | /notes | Create a note | Yes |
| GET | /notes | List your notes | Yes |
| GET | /notes/:id | Get a single note | Yes |
| PUT | /notes/:id | Update a note | Yes |
| DELETE | /notes/:id | Delete a note | Yes |

## What I learned
Building this project taught me REST API design, SQL databases, password security, and authentication with JWTs and middleware.
