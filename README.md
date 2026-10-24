# Raza Theory & Driving Academy: Phase 1

Landing page + mock test engine (timer, flagging, navigator, scored review). Runs with no database yet.

## Run it online (no installs)
1. On github.com create a new repository called `raza-academy`. Click "uploading an existing file", drag in everything from this unzipped folder, and commit.
2. Open `https://stackblitz.com/github/YOUR-GITHUB-USERNAME/raza-academy`. It installs and starts the site by itself.

## Publish it
1. Sign in to vercel.com with GitHub, click "Add New > Project", pick `raza-academy`, and press Deploy.

## Database (needed from phase 2)
Create a free project at supabase.com, open SQL Editor, paste `supabase/schema.sql`, and press Run.

## Where things are
- `lib/questions.js` the question bank (any number of questions works)
- `lib/config.js` brand name, phone, WhatsApp number
- `app/page.js` landing page, `app/test/page.js` mock test
