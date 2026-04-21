<img width="1909" height="877" alt="image" src="https://github.com/user-attachments/assets/d078ffa9-fbd6-4bea-92a8-c4a5bf09f6dc" /># Najar Nepal

**Public Voice. Public Trust. Public Accountability.**

Najar Nepal is a modern civic-tech platform built for Nepal to improve transparency, public engagement, and accountability. It helps users explore districts, view public leader profiles, track civic activity, rate public experience, and better understand how communities respond to leadership and public issues.

---

## Preview

<img width="1916" height="885" alt="image" src="https://github.com/user-attachments/assets/8c3a1702-92c0-45ed-a60d-b1edbff634b0" />


---

## About the Project

Najar Nepal is a public-facing transparency and civic engagement platform designed for Nepal. Its goal is to make leadership visibility, district-level public sentiment, and accountability easier to explore through a clean, modern, and interactive web experience.

The platform brings together:
- district exploration
- public leader profiles
- verified citizen feedback
- community discussion
- civic rankings
- public project tracking
- bilingual support in English and Nepali

---

## Core Features

### Interactive Nepal District Explorer
- Explore Nepal through an interactive district map
- Click districts to view local public information
- Search and filter by district and province
- View linked representatives and district summaries

### Public Leader Profiles
- Role, district, party, and term information
- Public trust and engagement indicators
- Ratings, likes, comments, and replies
- Report factual mistakes on public profiles
- Clean civic-style profile presentation

### Leaders Ranking
- Civic leaderboard based on public score, rating quality, discussion activity, and engagement
- Top leaders spotlight
- Category-based filtering
- Sortable ranking view

### District Public Feedback
- Citizens can rate district conditions
- Categories include:
  - transportation
  - road condition
  - safety
  - cleanliness
  - public services
  - scenic / visitor experience
- Verified contributors only
- Overall district public score

### Public Projects Tracker
- Track commitments and project status
- View completed, in-progress, stalled, broken, and not-started items
- National progress overview
- Clear status-based dashboard layout

### Verification Center
- Private citizenship verification submission
- Verification documents are never shown publicly
- Public profiles display verification status only

### Bilingual Support
- Global English / Nepali language switching
- Shared language system designed to update the website UI consistently

---

## Why Najar Nepal?

Najar Nepal was created to support:
- transparency in public leadership
- easier access to civic information
- district-level public awareness
- accountability and trust
- community participation
- a modern Nepal-focused civic-tech experience

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication and Platform
- JWT authentication
- Protected routes
- Admin-aware flows
- REST API architecture

---

## UI / UX Focus

This project emphasizes:
- modern civic-tech design
- responsive layout
- interactive map usability
- clear information hierarchy
- public trust signals
- safer discussion flow
- bilingual clarity
- mobile-friendly structure

---

## Security and Privacy

Najar Nepal includes privacy-focused design decisions such as:
- protected user and admin routes
- restricted verification review flow
- private identity document handling
- no public exposure of uploaded citizenship images
- public display limited to verification status only

> Verification documents are intended for authorized review only.

---

## Main Pages

- Home
- Interactive District Explorer
- Leader Profile
- Ranking
- Projects Tracker
- Verification Center
- Edit Profile
- Admin-related flows

---

## Future Improvements

Planned future improvements include:
- larger real-world civic datasets
- stronger moderation tools
- richer district and project analytics
- more advanced leaderboard scaling
- deeper admin insights
- stronger deployment and production security

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/nirajann/your-repo-name.git
cd your-repo-name
```

Install dependencies:

```bash
npm install
```

Create your local environment file from `.env.example` and set:

```bash
MONGO_URI=<mongodb connection string>
JWT_SECRET=<long random secret>
NODE_ENV=development
PORT=5000
VITE_API_BASE_URL=http://localhost:5000/api
CORS_ORIGINS=http://localhost:5173,https://your-frontend.example.com,https://staging-your-frontend.example.com
REQUEST_TIMEOUT_MS=30000
JSON_BODY_LIMIT=1mb
```

The backend exposes `GET /api/health` for deployment checks and monitoring.

Useful scripts:

```bash
npm run server
npm run build
npm run seed:districts
npm run import:leaders
```
