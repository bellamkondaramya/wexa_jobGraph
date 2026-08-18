# JobGraph — Graph-Powered Job & Skill Explorer

A small full-stack application built for the WEXA AI CognoDB take-home assignment.

## What it does

JobGraph models candidates, skills, jobs, companies, and skill relationships in a graph database. A user can:

- Browse candidates and their skills
- Browse jobs and required skills
- See companies
- Get job recommendations for a candidate
- Explore direct and indirect skill relationships

### Start the backend

```bash
cd backend
npm run dev
```

The API runs on `http://localhost:5000`.


## API endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/candidates`
- `GET /api/candidates/:id`
- `GET /api/candidates/:id/recommendations`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `GET /api/companies`
- `GET /api/skills`
- `GET /api/graph/:candidateId`

## UI

The application contains:

- Dashboard with graph statistics
- Candidates view
- Candidate detail with skills and recommendations
- Jobs view
- Job detail
- Companies view
- Graph Explorer showing a selected candidate's connected data


## Seed data

The seed contains realistic demo data for candidates, skills, jobs, companies, applications, and related skills. It is intentionally small enough for the CognoDB free tier.

