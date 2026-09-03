const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

const weatherCache = new Map();

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes


// Convert Open-Meteo weather codes into readable conditions
function getWeatherCondition(weatherCode) {
  if (weatherCode === 0) return "Clear";

  if ([1, 2, 3].includes(weatherCode)) {
    return "Cloudy";
  }

  if ([45, 48].includes(weatherCode)) {
    return "Fog";
  }

  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return "Drizzle";
  }

  if ([61, 63, 65, 66, 67].includes(weatherCode)) {
    return "Rain";
  }

  if ([71, 73, 75, 77].includes(weatherCode)) {
    return "Snow";
  }

  if ([80, 81, 82].includes(weatherCode)) {
    return "Rain Showers";
  }

  if ([85, 86].includes(weatherCode)) {
    return "Snow Showers";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "Thunderstorm";
  }

  return "Unknown";
}


// Calculate a weather severity score from REAL weather data
function calculateWeatherSeverity(weather) {
  let score = 0;

  const precipitation = Number(weather.precipitation ?? 0);
  const rain = Number(weather.rain ?? 0);
  const showers = Number(weather.showers ?? 0);
  const snowfall = Number(weather.snowfall ?? 0);
  const windSpeed = Number(weather.wind_speed_10m ?? 0);
  const weatherCode = Number(weather.weather_code ?? 0);


  // Precipitation
  score += Math.min(45, precipitation * 9);

  // Rain
  score += Math.min(25, rain * 5);

  // Showers
  score += Math.min(15, showers * 3);

  // Snow
  score += Math.min(25, snowfall * 5);


  // Wind
  if (windSpeed >= 60) {
    score += 20;
  } else if (windSpeed >= 40) {
    score += 12;
  } else if (windSpeed >= 25) {
    score += 5;
  }


  // Severe weather
  if ([95, 96, 99].includes(weatherCode)) {
    score += 30;
  } else if ([65, 67, 75, 82, 86].includes(weatherCode)) {
    score += 20;
  } else if ([63, 73, 81].includes(weatherCode)) {
    score += 10;
  }


  return Math.round(Math.min(100, score));
}


// Fetch current weather from Open-Meteo
async function fetchWeather(latitude, longitude) {
  const url = new URL(OPEN_METEO_URL);

  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);

  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "wind_speed_10m"
    ].join(",")
  );

  url.searchParams.set("timezone", "Asia/Kolkata");


  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Open-Meteo request failed with status ${response.status}`
    );
  }


  const data = await response.json();


  if (!data.current) {
    throw new Error("Open-Meteo returned no current weather data.");
  }


  return data.current;
}


// Get weather for one district
export async function getWeatherForDistrict(district) {
  const cacheKey = district.id;

  const cached = weatherCache.get(cacheKey);

  // Use cached data if it is still fresh
  if (
    cached &&
    Date.now() - cached.timestamp < CACHE_DURATION_MS
  ) {
    return cached.data;
  }


  // Get REAL weather from Open-Meteo
  const current = await fetchWeather(
    district.lat,
    district.lng
  );


  const result = {
    districtId: district.id,
    name: district.name,
    state: district.state,

    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,

    precipitation: current.precipitation,
    rain: current.rain,
    showers: current.showers,
    snowfall: current.snowfall,

    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,

    condition: getWeatherCondition(
      current.weather_code
    ),

    severity: calculateWeatherSeverity(current),

    observedAt: current.time,

    source: "Open-Meteo"
  };


  // Save real result temporarily
  weatherCache.set(cacheKey, {
    timestamp: Date.now(),
    data: result
  });


  return result;
}


// Get weather for all districts
export async function getWeatherForDistricts(districts) {
  const results = [];


  for (const district of districts) {
    try {
      const weather = await getWeatherForDistrict(district);

      results.push(weather);

    } catch (error) {
      console.error(
        `Weather request failed for ${district.name}:`,
        error.message
      );


      // IMPORTANT:
      // We do NOT generate fake weather if the API fails.
      results.push({
        districtId: district.id,
        name: district.name,
        state: district.state,

        error: true,

        message: "Weather data temporarily unavailable",

        source: "Open-Meteo"
      });
    }
  }


  return results;
}


// Get only severity values
export async function getWeatherSeverityMap(districts) {
  const weatherData =
    await getWeatherForDistricts(districts);


  const severityMap = {};


  for (const weather of weatherData) {
    if (!weather.error) {
      severityMap[weather.districtId] =
        weather.severity;
    }
  }


  return severityMap;
}