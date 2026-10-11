# PixelWX

A retro pixel-art weather app that turns the forecast into an animated scene. Search for a city or use your location to see current conditions and a five-day forecast.

## Features

- Live weather data from [Open-Meteo](https://open-meteo.com/), with no API key required
- City search with location names from Open-Meteo Geocoding
- Optional browser geolocation
- Current temperature, feels-like temperature, humidity, and wind speed
- Five-day forecast with daily high and low temperatures
- Celsius and Fahrenheit display
- Animated pixel-art scenes for sun, rain, fog, wind, storms, and night
- Click a forecast day to preview its weather, or use the scene buttons to preview an effect

## Run locally

You’ll need [Node.js](https://nodejs.org/) and npm installed.

```bash
git clone https://github.com/Rohitisavailable/pixel-weather.git
cd pixel-weather
npm start
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The `start` script uses `npx serve` to serve the static files; npm may download `serve` the first time it runs.

You can also serve the project with any static web server. There is no build step or API key configuration.

## Use the app

- Search by city name and select **GO**.
- Select **GPS** to use your device’s location. The browser will ask for location permission, and the app needs a secure context such as `localhost` or HTTPS.
- Select **°C** or **°F** to switch temperature units.
- Select a forecast day to preview its weather in the animated scene.
- Select **SUN**, **RAIN**, **FOG**, or **WIND** to toggle a scene effect. Select the active effect again to return to weather-driven animation.

The app loads Tokyo weather on startup. If that request fails, search for a city to begin.

## Data and privacy

Weather and city-search requests go directly from your browser to Open-Meteo. When you use GPS, the browser provides coordinates to the app, which then sends those coordinates to Open-Meteo for the forecast. The project does not include a server or API key.

## Project layout

```text
pixel-weather/
├── css/
│   └── style.css
├── js/
│   └── app.js
├── index.html
└── package.json
```

## Built with

- HTML, CSS, and vanilla JavaScript
- Canvas 2D for the animated pixel-art scene
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) and [Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) from Google Fonts

## License

No license file is currently included in the repository. Contact the repository owner for permission before reusing or redistributing the project.
