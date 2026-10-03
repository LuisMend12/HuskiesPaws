# Big Red Hacks 2026

Our project repo for [Big Red Hacks](https://www.bigredhacks.com/) 2026, Cornell's annual hackathon.

> **Status:** Brainstorming. We haven't picked an idea yet. Add new ideas, then vote below.

## Team

| Name | Strengths | Contact |
|------|-----------|---------|
| Luis Mendez | | |
| | | |
| | | |

## How we pick an idea

We score each idea from 1 to 5 on these questions:

1. **Demo-able:** Can we show it working live in under 3 minutes?
2. **Buildable:** Can we get a working MVP in about 24 hours?
3. **Track fit:** Does it fit a hackathon track or sponsor prize? (Fill these in once tracks are announced.)
4. **Wow factor:** Will judges remember it?
5. **Excitement:** Do we actually want to build it?

Pick the highest total. Break ties with a gut-check vote.

---

## Idea backlog

### 1. CampusPulse: real-time crowd levels on campus
Shows how busy dining halls, libraries and gyms are right now, using anonymous Wi-Fi or Bluetooth counts or crowdsourced check-ins, and predicts the best time to go.
- **Stack:** React or Next.js, FastAPI, a simple time-series forecast
- **MVP:** Map of 5 locations with crowd levels and a "best time today" estimate
- **Stretch:** Push alert when your favorite dining hall clears out

### 2. StudyBuddy Matcher
Matches students in the same course who want to study together, based on schedule overlap, study style and topics they're stuck on.
- **Stack:** Next.js, Supabase (auth and database), a matching algorithm
- **MVP:** Sign up, pick courses and free time, see your matches
- **Stretch:** Auto-book a study room and create a shared notes page

### 3. Lecture-to-Flashcards
Upload lecture slides, notes or a recording. An LLM pulls out the key concepts and makes spaced-repetition flashcards and practice questions.
- **Stack:** Python, Whisper (speech to text), Claude API, a simple web UI
- **MVP:** PDF in, flashcard deck out (exportable to Anki)
- **Stretch:** Adaptive quizzes that focus on cards you keep getting wrong

### 4. FridgeChef: reduce food waste
Snap a photo of your fridge. A vision model identifies ingredients and suggests recipes that use what expires first.
- **Stack:** Mobile web app, vision LLM, recipe API
- **MVP:** Photo in, ingredient list and 3 recipe ideas out
- **Stretch:** Expiry tracking, and sharing leftovers with neighbors or student groups

### 5. AccessiMap: accessible campus routes
Walking directions that avoid stairs, broken elevators and steep hills (Ithaca has a lot of hills), with crowdsourced reports of obstacles.
- **Stack:** Leaflet or Mapbox, OpenStreetMap, a routing engine (OSRM or GraphHopper)
- **MVP:** Step-free routing between 10 campus buildings
- **Stretch:** Live "elevator out of service" reports

### 6. PhishGuard: browser extension
A Chrome extension that flags suspicious emails and links in Gmail and explains in plain English *why* they look like phishing.
- **Stack:** Chrome extension (Manifest V3), URL heuristics, LLM classifier
- **MVP:** Highlight risky links with an explanation tooltip
- **Stretch:** Quiz mode that teaches users to spot phishing themselves

### 7. GreenCommute
Tracks your commute carbon footprint, suggests lower-emission options (TCAT bus, bike, carpool) and runs friendly competitions between dorms or clubs.
- **Stack:** React Native or PWA, Google Maps or TCAT GTFS data
- **MVP:** Log trips, see CO₂ saved, view a leaderboard
- **Stretch:** Carpool matching for trips home on break

### 8. MoneyMentor: budgeting for students
Connect a bank account in sandbox mode (or upload a CSV). An AI coach categorizes spending, flags subscriptions you forgot about and builds a semester budget.
- **Stack:** Plaid sandbox, Next.js, LLM summaries, charts
- **MVP:** CSV upload, then a spending breakdown and 3 personalized tips
- **Stretch:** "Can I afford this?" chat assistant

### 9. SignBridge: sign language practice
Uses a webcam and hand-tracking to give real-time feedback while you practice the ASL alphabet and basic signs.
- **Stack:** MediaPipe Hands, TensorFlow.js, a web app
- **MVP:** Recognize the ASL alphabet letters with live feedback
- **Stretch:** Gamified lessons and streaks

### 10. OfficeHours Queue
A better office-hours queue: students join with a short question, TAs see questions grouped by topic, and duplicate questions get merged into group help.
- **Stack:** Next.js, WebSockets or Supabase Realtime, embeddings to group questions
- **MVP:** Join queue, TA dashboard, live position updates
- **Stretch:** Auto-suggest relevant Ed/Piazza posts while you wait

---

## Scoring sheet

| # | Idea | Demo | Buildable | Track fit | Wow | Excitement | **Total** |
|---|------|:----:|:---------:|:---------:|:---:|:----------:|:---------:|
| 1 | CampusPulse | | | | | | |
| 2 | StudyBuddy Matcher | | | | | | |
| 3 | Lecture-to-Flashcards | | | | | | |
| 4 | FridgeChef | | | | | | |
| 5 | AccessiMap | | | | | | |
| 6 | PhishGuard | | | | | | |
| 7 | GreenCommute | | | | | | |
| 8 | MoneyMentor | | | | | | |
| 9 | SignBridge | | | | | | |
| 10 | OfficeHours Queue | | | | | | |

## Hackathon tips

- **Lock the idea within the first 2 hours.** Indecision costs more than picking a slightly worse idea.
- **Build the demo path first.** One polished end-to-end flow beats five half-built features.
- **Fake what you must.** Hard-coded or seeded data is fine for a demo; say so if judges ask.
- **Freeze features about 4 hours before the deadline.** After that, only fix bugs and polish.
- **Record a backup demo video** in case Wi-Fi or the live demo fails.
- **Write the Devpost early.** Do the screenshots, the "how we built it" section and the challenges as you go.

## Getting started

_To be filled in once we pick an idea and stack._

```bash
git clone <repo-url>
cd big-red-hacks2026
# setup steps go here
```
