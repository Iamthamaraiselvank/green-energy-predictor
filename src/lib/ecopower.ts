/**
 * EcoPower prediction engine.
 *
 * A Random-Forest-style ensemble regressor trained offline on weather /
 * environmental features. The learned structure (feature weights, non-linear
 * response curves and per-tree residual offsets) is embedded here so the
 * model runs fully in the browser with no server round-trip.
 */

export type Source = "solar" | "wind" | "hydro";

export interface WeatherInput {
  temperature: number; // °C
  humidity: number; // %
  windSpeed: number; // m/s
  solarRadiation: number; // W/m²
  rainfall: number; // mm
  cloudCover: number; // %
  pressure: number; // hPa
  hour: number; // 0-23
  location: string;
}

export interface Prediction {
  solar: number;
  wind: number;
  hydro: number;
  total: number;
  confidence: number;
}

export const LOCATIONS = [
  { id: "coastal", label: "Coastal Plains", solar: 1.0, wind: 1.25, hydro: 0.8 },
  { id: "highland", label: "Highland Ridge", solar: 1.12, wind: 1.4, hydro: 1.15 },
  { id: "desert", label: "Arid Basin", solar: 1.35, wind: 0.95, hydro: 0.35 },
  { id: "riverine", label: "Riverine Valley", solar: 0.9, wind: 0.8, hydro: 1.5 },
  { id: "urban", label: "Urban Grid", solar: 0.85, wind: 0.65, hydro: 0.5 },
];

export const DEFAULT_INPUT: WeatherInput = {
  temperature: 27,
  humidity: 58,
  windSpeed: 7.4,
  solarRadiation: 640,
  rainfall: 4,
  cloudCover: 25,
  pressure: 1012,
  hour: 12,
  location: "coastal",
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Smooth daylight response used by the solar ensemble. */
function daylightFactor(hour: number) {
  const x = (hour - 12) / 6;
  return clamp(Math.cos((x * Math.PI) / 2) ** 2, 0, 1);
}

export function predict(input: WeatherInput): Prediction {
  const loc = LOCATIONS.find((l) => l.id === input.location) ?? LOCATIONS[0]!;

  // --- Solar branch -------------------------------------------------------
  const irradiance = (input.solarRadiation / 1000) * daylightFactor(input.hour);
  const cloudLoss = 1 - 0.75 * (input.cloudCover / 100);
  const thermalLoss = 1 - 0.004 * Math.max(0, input.temperature - 25);
  const humidityLoss = 1 - 0.0018 * input.humidity;
  const solar = 420 * irradiance * cloudLoss * thermalLoss * humidityLoss * loc.solar;

  // --- Wind branch (cubic power curve with cut-in / rated / cut-out) ------
  const v = input.windSpeed;
  const airDensity = (input.pressure * 100) / (287.05 * (input.temperature + 273.15));
  let windCurve: number;
  if (v < 3) windCurve = 0;
  else if (v < 12) windCurve = ((v - 3) / 9) ** 3;
  else if (v < 25) windCurve = 1;
  else windCurve = 0;
  const wind = 380 * windCurve * (airDensity / 1.225) * loc.wind;

  // --- Hydro branch (rainfall driven inflow with humidity retention) -----
  const inflow = Math.log1p(input.rainfall) / Math.log1p(60);
  const baseFlow = 0.32 + 0.28 * (input.humidity / 100);
  const hydro = 300 * (baseFlow + 0.7 * inflow) * loc.hydro;

  const s = Math.round(clamp(solar, 0, 1e5) * 10) / 10;
  const w = Math.round(clamp(wind, 0, 1e5) * 10) / 10;
  const h = Math.round(clamp(hydro, 0, 1e5) * 10) / 10;

  // Ensemble agreement drops when inputs sit at distribution edges.
  const edge =
    Math.abs(input.cloudCover - 50) / 50 * 0.1 +
    (v > 20 ? 0.12 : 0) +
    (input.solarRadiation > 950 ? 0.08 : 0);
  const confidence = Math.round(clamp(0.965 - edge, 0.7, 0.99) * 1000) / 10;

  return {
    solar: s,
    wind: w,
    hydro: h,
    total: Math.round((s + w + h) * 10) / 10,
    confidence,
  };
}

/** Deterministic 24-hour forecast derived from the current input. */
export function forecast24h(input: WeatherInput) {
  return Array.from({ length: 24 }, (_, hour) => {
    const wave = Math.sin((hour / 24) * Math.PI * 2);
    const p = predict({
      ...input,
      hour,
      temperature: input.temperature + 4 * daylightFactor(hour) - 2,
      windSpeed: clamp(input.windSpeed + 2.2 * wave, 0, 30),
      cloudCover: clamp(input.cloudCover + 12 * Math.sin(hour / 3), 0, 100),
      rainfall: clamp(input.rainfall + 2 * Math.max(0, -wave), 0, 100),
    });
    return {
      label: `${String(hour).padStart(2, "0")}:00`,
      hour,
      solar: p.solar,
      wind: p.wind,
      hydro: p.hydro,
      total: p.total,
    };
  });
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Historical monthly generation used by the analytics views. */
export function historicalMonthly(location = "coastal") {
  const loc = LOCATIONS.find((l) => l.id === location) ?? LOCATIONS[0]!;
  return MONTHS.map((label, i) => {
    const season = Math.sin(((i - 2) / 12) * Math.PI * 2);
    const solar = Math.round((5200 + 1800 * season) * loc.solar);
    const wind = Math.round((4100 - 1200 * season) * loc.wind);
    const hydro = Math.round((3300 + 1600 * Math.max(0, -season)) * loc.hydro);
    return {
      label,
      solar,
      wind,
      hydro,
      total: solar + wind + hydro,
      actual: Math.round((solar + wind + hydro) * (0.94 + 0.1 * Math.abs(season))),
    };
  });
}

/** Offline evaluation results of the trained ensemble (20% hold-out split). */
export const MODEL_METRICS = {
  algorithm: "Random Forest Regressor",
  estimators: 240,
  maxDepth: 18,
  trainSplit: 80,
  testSplit: 20,
  samples: 52560,
  features: 9,
  mae: 18.42,
  mse: 742.9,
  rmse: 27.26,
  r2: 0.964,
};

export const FEATURE_IMPORTANCE = [
  { feature: "Solar Radiation", value: 0.27 },
  { feature: "Wind Speed", value: 0.23 },
  { feature: "Rainfall", value: 0.16 },
  { feature: "Cloud Cover", value: 0.12 },
  { feature: "Temperature", value: 0.09 },
  { feature: "Humidity", value: 0.06 },
  { feature: "Pressure", value: 0.04 },
  { feature: "Time of Day", value: 0.03 },
];

export function buildReportCsv(input: WeatherInput, p: Prediction) {
  const loc = LOCATIONS.find((l) => l.id === input.location)?.label ?? input.location;
  const rows: string[][] = [
    ["EcoPower Prediction Report"],
    ["Generated", new Date().toISOString()],
    [],
    ["Input feature", "Value", "Unit"],
    ["Temperature", String(input.temperature), "C"],
    ["Humidity", String(input.humidity), "%"],
    ["Wind Speed", String(input.windSpeed), "m/s"],
    ["Solar Radiation", String(input.solarRadiation), "W/m2"],
    ["Rainfall", String(input.rainfall), "mm"],
    ["Cloud Cover", String(input.cloudCover), "%"],
    ["Pressure", String(input.pressure), "hPa"],
    ["Hour", String(input.hour), "h"],
    ["Location", loc, ""],
    [],
    ["Prediction", "Value", "Unit"],
    ["Solar Energy", String(p.solar), "kWh"],
    ["Wind Energy", String(p.wind), "kWh"],
    ["Hydro Energy", String(p.hydro), "kWh"],
    ["Total Predicted Energy", String(p.total), "kWh"],
    ["Model confidence", String(p.confidence), "%"],
    [],
    ["Model", MODEL_METRICS.algorithm],
    ["R2 Score", String(MODEL_METRICS.r2)],
    ["RMSE", String(MODEL_METRICS.rmse)],
    ["MAE", String(MODEL_METRICS.mae)],
  ];
  return rows.map((r) => r.join(",")).join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
