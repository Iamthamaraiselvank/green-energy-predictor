import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import { SectionCard, StatCard } from "@/components/stat-card";
import { SourceBarChart, TotalAreaChart } from "@/components/energy-charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Droplets, Sun, Wind, Zap } from "lucide-react";
import { FEATURE_IMPORTANCE, LOCATIONS, historicalMonthly } from "@/lib/ecopower";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — EcoPower Generation Insights" },
      {
        name: "description",
        content:
          "Explore historical renewable generation, predicted vs actual accuracy and feature importance for the EcoPower forecasting model.",
      },
      { property: "og:title", content: "Analytics — EcoPower Generation Insights" },
      {
        property: "og:description",
        content:
          "Historical trends, predicted vs actual accuracy and feature importance for renewable energy forecasting.",
      },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const [location, setLocation] = useState("coastal");
  const monthly = useMemo(() => historicalMonthly(location), [location]);

  const totals = monthly.reduce(
    (acc, m) => ({
      solar: acc.solar + m.solar,
      wind: acc.wind + m.wind,
      hydro: acc.hydro + m.hydro,
      total: acc.total + m.total,
    }),
    { solar: 0, wind: 0, hydro: 0, total: 0 },
  );

  const axis = {
    stroke: "var(--muted-foreground)",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
  };
  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    fontSize: 12,
  };

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-5 pb-4 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Annual generation performance and model behaviour.
          </p>
        </div>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-52">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Annual Solar"
          value={totals.solar}
          unit="kWh"
          accent="var(--solar)"
          icon={<Sun className="size-4" />}
        />
        <StatCard
          label="Annual Wind"
          value={totals.wind}
          unit="kWh"
          accent="var(--wind)"
          icon={<Wind className="size-4" />}
        />
        <StatCard
          label="Annual Hydro"
          value={totals.hydro}
          unit="kWh"
          accent="var(--hydro)"
          icon={<Droplets className="size-4" />}
        />
        <StatCard
          label="Annual Total"
          value={totals.total}
          unit="kWh"
          accent="var(--primary)"
          icon={<Zap className="size-4" />}
        />
      </div>

      <SectionCard title="Monthly output by source" description="Stacked generation per month">
        <SourceBarChart data={monthly} />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Predicted vs actual" description="Model tracking against metered output">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="total"
                name="Predicted"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="var(--solar)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Feature importance" description="Contribution of each input feature">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={FEATURE_IMPORTANCE}
              layout="vertical"
              margin={{ left: 40, right: 12, top: 8 }}
            >
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" {...axis} />
              <YAxis type="category" dataKey="feature" width={110} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="var(--primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard title="Cumulative generation trend" description="Total monthly output">
        <TotalAreaChart data={monthly} />
      </SectionCard>
    </main>
  );
}
