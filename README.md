# DevCircle 🌐

A modern developer community platform where developers can create posts, share knowledge, and build their profiles. Built as part of the Agentic Software Engineer intern assignment.

## Tech Stack 🛠️
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, React Query
- **Backend**: Node.js, Express, TypeScript, Prisma (ORM)
- **Database**: PostgreSQL

## Features
- **Authentication**: JWT-based auth with refresh token rotation.
- **Developer Profiles**: View, edit, and list your skills and professional experiences.
- **Posts & Feed**: Create posts with markdown, image uploads, and search/filtering.
- **Ranking System**: Posts are organically ranked by community engagement.
- **Interactions**: Threaded/nested comments and like/dislike reactions on both posts and comments.
- **Communities**: Organize posts into specific tech communities.

## Local Setup 🚀

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### 2. Clone & Install
```bash
git clone https://github.com/darksoul-atik/DevCircle.git
cd DevCircle

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 3. Environment Variables
You will need to create `.env` files in both the `backend` and `frontend` directories. Do not commit secrets.

**`backend/.env`** (required variables):
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT` (defaults to 3000)
- `FRONTEND_URL`

**`frontend/.env`** (required variables):
- `VITE_API_URL`

### 4. Database Setup
Inside the `backend` directory, run the Prisma migrations:
```bash
npx prisma migrate dev
```
*(Optional)* Seed the database if a seed script is provided:
```bash
npx prisma db seed
```

### 5. Running the App
Run both servers concurrently or in separate terminal tabs:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The app will typically be available at `http://localhost:5173`.

---

## Swagger API Documentation 📖
All public APIs are documented using OpenAPI/Swagger.

To view the interactive docs locally:
1. Start the backend server (`npm run dev` in the `backend` folder).
2. Open your browser and navigate to: **`http://localhost:3000/api-docs`**

---

## Ranking Formula 📈
Posts on the feed are dynamically ranked based on user engagement using the following formula:

```
Score = (Likes - Dislikes) + (CommentCount * 2)
```
- A higher score ranks higher.
- A weight of `2` is given to comments to prioritize active discussions.
- **Tie-breaker**: In the event of a tied score, the newest post (`createdAt`) wins.

The sorting and scoring is computed efficiently in memory on the backend API layer before being sent to the client.

---

## AI Usage Notes 🤖
Extensive usage of AI coding agents was used to accelerate the development of this full-stack application. For a complete breakdown of the AI tools used, the agent instructions/workflows, the portions that were manually reviewed/rewritten, and bugs that were caught and fixed, please see the [AI_USAGE.md](./AI_USAGE.md) file.

## Assumptions & Known Limitations ⚠️
- **File Uploads**: Image uploads are stored locally on the disk (`backend/uploads`) using Multer. In a production environment, this should be swapped to AWS S3 or Cloudinary.
- **Ranking Engine**: The post ranking formula is calculated in memory inside the controller because Prisma lacks deep aggregation sorting. This is perfectly fine for small-to-medium datasets but would need a materialized view or raw SQL for high-scale production.
- **Authentication**: Using HTTP-only cookies for refresh tokens. Cross-origin domain setups may require additional CORS tuning for cookies to attach correctly depending on the deployment environment.
- **RBAC System**: Role-Based Access Control (RBAC) is implemented with separate permissions for **Central Admin** and **Moderators**. The current implementation is designed around the application's requirements and may require more granular permissions for a larger production environment.
- **User Blocking**: Users can be blocked to restrict their access and interactions within the platform. The current implementation focuses on the core blocking functionality.
- **Post Hiding & Moderation**: Admins and moderators can hide posts that violate platform rules. Hidden posts are excluded from normal user-facing content while remaining manageable by authorized administrative users.
- **Comment Moderation**: The application currently does **not include automatic slang, profanity, or inappropriate-comment detection**. Comments are not automatically analyzed using AI or a dedicated content moderation service. A production deployment could integrate a profanity filter, moderation API, or AI-based content moderation system.
