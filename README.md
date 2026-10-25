# TripThat

A personal trip planner for organizing multi-city travel research. Add your own restaurants, attractions, and hotels — TripThat helps you structure them into daily itineraries and keep everything in one place.

## Features

- **Trip Setup** — Create trips with any cities in the world, travel dates, and per-city date ranges
- **Interactive Map** — Free Leaflet.js map showing city markers (auto-geocoded) and flight route lines
- **Place Cards** — Save places by category (Food, Sightseeing, Accommodation, Night Market, Shopping, Other) with status tracking, notes, links, and backup flags. Food places get extra fields: cuisine, price range, must-try dish
- **Daily Itinerary Builder** — Day-by-day planner with Morning / Afternoon / Evening / Night slots. Add places from your saved list or type custom activities. Drag to reorder within a slot
- **Flight Tracker** — Add flights with airline, flight number, route, times, confirmation code. Sorted by departure time in a clean timeline
- **AI Assistant** — Chat panel powered by Claude. Sends your full trip context (cities, places, flights) with every message
- **Google Maps buttons** — Every place card has "Open in Maps" (uses your saved link, or constructs a search URL) and "Search Reviews"
- **Offline-first** — All data stored in localStorage, no backend needed

## Setup

```bash
npm install
cp .env.example .env
# Add your Anthropic API key to .env
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic API key — enables the AI Assistant tab |

Get an API key at [console.anthropic.com](https://console.anthropic.com).

The AI Assistant works without a key — it just shows an error until one is set. All other features work with no API key.

> **Note:** The API key is included in the client bundle (VITE_ prefix). This is fine for personal use on your own machine. Do not deploy this publicly without moving the AI calls to a backend proxy.

## Tech Stack

- **React 18 + Vite** — fast dev server, instant HMR
- **Tailwind CSS v3** — dark navy theme
- **react-leaflet + Leaflet.js** — free maps, no API key required
- **OpenStreetMap / Nominatim** — free tile server and geocoding
- **@dnd-kit** — drag-and-drop in the itinerary builder
- **Anthropic API** — AI assistant (model: claude-sonnet-4-6)
- **localStorage** — all data persisted locally, no backend

## Usage Tips

- **Add cities in order** — the map draws flight route lines connecting them in sequence
- **Set per-city dates** — arrival/departure dates on each city unlock the day-by-day itinerary builder
- **Mark backups** — toggle "backup option" on any place to track fallback plans; itinerary blocks let you assign a backup place per slot
- **Status workflow** — Want to Go → Confirmed → Done (or Skipped). Place cards dim when marked Done/Skipped
- **Quick status change** — use the status dropdown on the bottom-right of each place card without opening the edit form
- **Print a day** — the Print button on any day card triggers the browser print dialog with a clean stylesheet
