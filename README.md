# Exit Ticket Generator

A lightweight, teacher-focused formative assessment tool for quickly creating and analyzing exit tickets.

Built with **React**, **Vite**, and **Firebase** **(Firestore + Anonymous Auth).**

## Overview

Built from real classroom experience, this project focuses on rapid formative assessment without unnecessary friction.

The Exit Ticket Generator is designed for teachers who need:

- Fast question creation

- Clean student submission flow

- Immediate classroom feedback data

- Simple, distraction-free UI

This tool allows teachers to create exit tickets, share a live link with students, and instantly view aggregated response data.

No accounts required for students.
Anonymous authentication keeps the workflow simple.

## Features
### Teacher

- Create exit tickets
- Clean dashboard view

- Add:

    - Multiple Choice questions

    - Short Answer questions

    - Publish tickets live for students

    - View real-time submissions

- View:

    - MCQ distribution statistics

    - Short answer responses

    - Confidence metrics per question

    

### Student

- Access live ticket via link

- Answer questions

- Select confidence level

- Submit anonymously

- Clean, mobile-friendly interface

## Tech Stack

- Frontend: React + Vite

- Routing: React Router

- Backend: Firebase

  - Firestore
  - Anonymous Authentication

- Styling: Custom CSS

## Project Structure
```text 
 src/
  app/
    components/
      Student/
      Dashboard/
      TicketBuilder/
    routes/
    services/
    styles/
```

## Authentication Model

- Firebase Anonymous Authentication

- Teachers and students are differentiated by route context

- Firestore security rules require authenticated access

- No persistent student accounts

## Data Model (High Level)


### tickets collection

- title

- createdAt

- isLive

- questions[]

### submissions subcollection

- answers[]

- confidence

- submittedAt

## Design Philosophy

This tool is intentionally:

- Minimal

- Fast

- Classroom-ready

- Low cognitive load

- Focused on instructional feedback, not student accounts

The goal is to support real teachers in real classrooms.

## Setup

1. Clone the repository

2. Install dependencies
```bash
npm install
```

3. Create a .env.local file with your Firebase config:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

4. Run the dev server:
```bash
npm run dev
```

## Deployment

This project can be deployed to:

- Firebase Hosting

- GitHub Pages

- Vercel

- Netlify

## Future Improvements

- CSV export for teacher data

- Question bank library

- Standards tagging (NGSS / state standards)

- Student trend analysis over time

- Improved analytics dashboard

- PDF export of results

## Built By

Shep Sheperdigian
Physics Teacher → EdTech Builder