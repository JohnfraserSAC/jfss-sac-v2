# JFSS SAC Portal

The John Fraser Secondary School SAC Portal is a centralized platform for managing student clubs and Student Activity Council workflows. It allows students to discover clubs, submit applications, manage memberships, request teacher supervision, and send announcements or funding requests for review.

## Key Features

- Google authentication for PDSB users
- Public directory of active school clubs
- New club applications and club reapplications
- Club membership invitations and role management
- Owner, executive, member, faculty, and SAC administrator permissions
- Teacher-supervisor request and approval workflow
- Club announcement and event-request review
- Club archiving and historical record preservation
- Responsive design for desktop and mobile devices

## Technology

- React 19
- Vite
- JavaScript and JSX
- React Router
- Supabase Authentication
- Supabase PostgreSQL, Storage, RPC functions, and Row Level Security

## Local Development

Install the project dependencies:

```bash
npm install
```

Configure the required Supabase environment variables, then start the development server:

```bash
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Security

Authentication, authorization, club-role limits, and administrative workflows are enforced through Supabase Row Level Security and server-side database functions. Sensitive administrative actions are not trusted to frontend validation alone.

## Project Status

The JFSS SAC Portal is under active development for use by John Fraser Secondary School students, club leaders, faculty advisors, and SAC administrators.
