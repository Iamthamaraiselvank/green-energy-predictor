import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Droplets, Gauge, Sun, Wind, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard, StatCard } from "@/components/stat-card";
import {
  HourlyLineChart,
  MixPieChart,
  SourceBarChart,
  TotalAreaChart,
} from "@/components/energy-charts";
import {
  DEFAULT_INPUT,
  LOCATIONS,
  MODEL_METRICS,
  buildReportCsv,
  downloadCsv,
  forecast24h,
  historicalMonthly,
  predict,
  type WeatherInput,
} from "@/lib/ecopower";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoPower — Renewable Energy Prediction Dashboard" },
      {
        name: "description",
        content:
          "Predict solar, wind and hydro generation in kWh from live weather inputs with a Random Forest model, interactive charts and downloadable reports.",
      },
      { property: "og:title", content: "EcoPower — Renewable Energy Prediction Dashboard" },
      {
        property: "og:description",
        content:
          "Machine-learning forecasts for solar, wind and hydro energy with interactive analytics and exportable reports.",
      },
    ],
  }),
  component: Dashboard,
});

const FIELDS: {
  key: keyof Omit<WeatherInput, "location">;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "temperature", label: "Temperature", unit: "°C", min: -10, max: 50, step: 0.5 },
  { key: "humidity", label: "Humidity", unit: "%", min: 0, max: 100, step: 1 },
  { key: "windSpeed", label: "Wind Speed", unit: "m/s", min: 0, max: 30, step: 0.2 },
  { key: "solarRadiation", label: "Solar Radiation", unit: "W/m²", min: 0, max: 1100, step: 10 },
  { key: "rainfall", label: "Rainfall", unit: "mm", min: 0, max: 60, step: 0.5 },
  { key: "cloudCover", label: "Cloud Cover", unit: "%", min: 0, max: 100, step: 1 },
  { key: "pressure", label: "Pressure", unit: "hPa", min: 950, max: 1050, step: 1 },
  { key: "hour", label: "Hour of Day", unit: "h", min: 0, max: 23, step: 1 },
];

function Dashboard() {
  const [input, setInput] = useState<WeatherInput>(DEFAULT_INPUT);

  const prediction = useMemo(() => predict(input), [input]);
  const hourly = useMemo(() => forecast24h(input), [input]);
  const monthly = useMemo(() => historicalMonthly(input.location), [input.location]);

  const mix = [
    { name: "Solar", value: prediction.solar, color: "var(--solar)" },
    { name: "Wind", value: prediction.wind, color: "var(--wind)" },
    { name: "Hydro", value: prediction.hydro, color: "var(--primary)" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 pb-4">
      <section className="py-12 md:py-16">
        <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
          <Gauge className="size-3.5 text-primary" />
          Random Forest Regressor · R² {MODEL_METRICS.r2}
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
          Forecast <span className="text-gradient">renewable generation</span> from live weather
          and environmental data.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
          Adjust the environmental features and the model instantly predicts solar, wind and
          hydro output in kWh, with 24-hour forecasts and exportable reports.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <SectionCard
          title="Prediction inputs"
          description="9 features feed the trained ensemble"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Select
                value={input.location}
                onValueChange={(location) => setInput((p) => ({ ...p, location }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Label className="text-muted-foreground">{f.label}</Label>
                  <span className="font-medium tabular-nums">
                    {input[f.key]} {f.unit}
                  </span>
                </div>
                <Slider
                  value={[input[f.key]]}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  onValueChange={([v]) => setInput((p) => ({ ...p, [f.key]: v ?? p[f.key] }))}
                />
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={() => {
                  downloadCsv(
                    `ecopower-report-${Date.now()}.csv`,
                    buildReportCsv(input, prediction),
                  );
                  toast.success("Prediction report downloaded");
                }}
              >
                <Download className="size-4" /> Report
              </Button>
              <Button variant="secondary" onClick={() => setInput(DEFAULT_INPUT)}>
                Reset
              </Button>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Solar Energy"
              value={prediction.solar}
              unit="kWh"
              accent="var(--solar)"
              icon={<Sun className="size-4" />}
            />
            <StatCard
              label="Wind Energy"
              value={prediction.wind}
              unit="kWh"
              accent="var(--wind)"
              icon={<Wind className="size-4" />}
            />
            <StatCard
              label="Hydro Energy"
              value={prediction.hydro}
              unit="kWh"
              accent="var(--hydro)"
              icon={<Droplets className="size-4" />}
            />
            <StatCard
              label="Total Predicted"
              value={prediction.total}
              unit="kWh"
              accent="var(--primary)"
              icon={<Zap className="size-4" />}
              hint={`Model confidence ${prediction.confidence}%`}
            />
          </div>

          <SectionCard
            title="24-hour forecast by source"
            description="Real-time inference across the daily weather cycle"
          >
            <HourlyLineChart data={hourly} />
          </SectionCard>

          <div className="grid gap-5 xl:grid-cols-2">
            <SectionCard title="Total generation curve" description="Aggregated hourly output">
              <TotalAreaChart data={hourly} />
            </SectionCard>
            <SectionCard title="Energy mix" description="Share of current prediction">
              <MixPieChart data={mix} />
            </SectionCard>
          </div>

          <SectionCard
            title="Monthly generation history"
            description="Stacked historical output for the selected location"
          >
            <SourceBarChart data={monthly} />
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
