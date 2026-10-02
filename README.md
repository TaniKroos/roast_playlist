# Taste Kharab 🔥 — the playlist roaster

Paste a public **Spotify, YouTube, YouTube Music, Apple Music or Amazon Music** playlist link (or just your songs) → get a savage, specific, PG-13 roast of your music taste in **English or Hinglish**, plus a story-sized share card. **No login. Nothing stored.**

- **Frontend:** Vite + React + TypeScript, mobile-first, self-hosted fonts, no trackers.
- **Backend:** one Cloudflare Worker (`POST /api/roast`), stateless, served from the same Worker as the static site.
- **LLM:** provider-agnostic. Any OpenAI-compatible API, native Claude, or native Gemini — swapped by config only.

---

