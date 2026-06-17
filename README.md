# NCCAOM Biomed Mastery App

A clean, modular, offline-first web app for studying the NCCAOM Biomedicine exam.

## Features

- **Question Bank** — Browse, search, and view full questions with explanations
- **Quiz Mode** — Take quizzes with instant feedback and progress tracking
- **Dashboard** — Visual progress, mastery stats, and weak area detection
- **Analytics** — Deeper performance insights by domain and difficulty
- **Smart Review** — Lightweight review priority system (SRS-lite)
- **Notes** — Add personal notes to any question (saved locally)
- **Import** — Easily update your question bank from GitHub
- **PWA Ready** — Can be installed and used offline

## Project Structure

```
biomed-quiz/
├── index.html              # Main UI
├── css_style.css           # Custom styles
├── questions.json          # Your question bank (easy to update)
├── js_utils.js             # Helper functions
├── js_data.js              # Data loading + progress + import logic
├── js_main.js              # App controller + navigation + modals
├── js_quiz.js              # Quiz engine
├── js_stats.js             # Analytics calculations + rendering
├── js_srs.js               # Lightweight review priority system
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching
└── README.md
```

## How to Use

1. Open the `biomed-quiz` folder in any browser (double-click `index.html`).
2. The app works completely offline after the first load.
3. All your progress, notes, and flags are saved in your browser (`localStorage`).

## Updating the Question Bank

1. Edit your master `Question Bank-Table 1.csv` (or however you maintain it).
2. Export/convert the relevant rows to `questions.json`.
3. In the app, go to **Dashboard → Import Updated Bank**.
4. Paste the new JSON array.
5. Your existing progress, notes, and flags are preserved.

## Enabling PWA (Installable App)

To make the app installable on your phone or computer:

1. The `manifest.json` and `service-worker.js` files are already included.
2. You need to register the service worker (see below).

### Registering the Service Worker

Add this code in `js_main.js` inside the `initializeApp()` function (or at the bottom):

```js
// Register Service Worker for PWA + Offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
```

After adding this and reloading the page, you should see the install prompt (or "Add to Home Screen" on mobile).

## Tech Notes

- Built with vanilla JavaScript + Tailwind CSS (via CDN)
- Fully modular structure as requested
- Progress is stored locally (not sent anywhere)
- Designed to be easy to maintain and extend

## License

Personal use for NCCAOM exam preparation.

---

Built for focused, efficient studying. Good luck on your exam! 🚀
