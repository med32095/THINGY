# Cube Timer

A mobile-friendly Rubik's cube timer with statistics tracking and personal records.

## Features

- **Timer**: Accurate timing with inspection timer (configurable 8, 10, or 15 seconds)
- **Scramble Generator**: Standard 20-move random scramble generation
- **Personal Records**: Track your best single, ao5, ao12, and ao50
- **History**: View all your solves with filtering (All, Last 10, Last 50)
- **Statistics**: Visual charts showing your progress and time distribution
- **Offline Support**: PWA with service worker for offline access
- **Mobile Friendly**: Touch-friendly interface designed for mobile devices
- **Data Persistence**: All data saved locally in your browser

## How to Use

1. Tap "Scramble" to generate a new scramble
2. Hold or press spacebar (if enabled in settings) to start inspection
3. Release when ready to start solving
4. Tap "Stop" when done to record your time
5. View your statistics and records in the Stats tab

## Settings

- **Inspection Time**: Set 0, 8, 10, or 15 seconds
- **Timer Type**: Choose touch or spacebar controls
- **Theme**: Dark or light mode

## Installation

Open `index.html` in any modern browser, or serve locally:

```bash
npx serve
# or
python -m http.server 8080
```

## Technology

- Vanilla JavaScript, HTML, CSS
- No external dependencies
- PWA with service worker
- LocalStorage for data persistence
