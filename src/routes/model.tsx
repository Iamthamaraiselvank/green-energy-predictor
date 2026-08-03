import { createFileRoute } from "@tanstack/react-router";
import { SectionCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FEATURE_IMPORTANCE, MODEL_METRICS } from "@/lib/ecopower";

export const Route = createFileRoute("/model")({
  head: () => ({
    meta: [
      { title: "Model — EcoPower Random Forest Performance" },
      {
        name: "description",
        content:
          "Training setup, dataset features and evaluation metrics (MAE, MSE, RMSE, R²) of the EcoPower Random Forest renewable energy regressor.",
      },
      { property: "og:title", content: "Model — EcoPower Random Forest Performance" },
      {
        property: "og:description",
        content:
          "Dataset, training split and evaluation metrics for the EcoPower renewable energy prediction model.",
      },
    ],
  }),
  component: ModelPage,
});

const METRICS = [
  { label: "MAE", value: MODEL_METRICS.mae, hint: "Mean absolute error (kWh)" },
  { label: "MSE", value: MODEL_METRICS.mse, hint: "Mean squared error" },
  { label: "RMSE", value: MODEL_METRICS.rmse, hint: "Root mean squared error (kWh)" },
  { label: "R² Score", value: MODEL_METRICS.r2, hint: "Explained variance" },
];

const INPUTS = [
  "Temperature",
  "Humidity",
  "Wind Speed",
  "Solar Radiation",
  "Rainfall",
  "Cloud Cover",
  "Pressure",
  "Time of Day",
  "Location",
];

const FUTURE = [
  "IoT sensor integration",
  "Live weather API ingestion",
  "AI-based forecast refinement",
  "Mobile application",
  "Cloud deployment",
  "Power grid integration",
];

function ModelPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-5 pb-4 pt-10">
      <div>
        <h1 className="text-3xl font-semibold">Model</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {MODEL_METRICS.algorithm} trained on {MODEL_METRICS.samples.toLocaleString()} hourly
          weather observations with an {MODEL_METRICS.trainSplit}/{MODEL_METRICS.testSplit}{" "}
          train-test split across {MODEL_METRICS.features} features.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="glass rounded-2xl p-5">
            <span className="text-sm text-muted-foreground">{m.label}</span>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{m.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Training configuration" description="Ensemble hyperparameters">
          <dl className="divide-y divide-border text-sm">
            {[
              ["Algorithm", MODEL_METRICS.algorithm],
              ["Estimators", String(MODEL_METRICS.estimators)],
              ["Max depth", String(MODEL_METRICS.maxDepth)],
              ["Training split", `${MODEL_METRICS.trainSplit}%`],
              ["Testing split", `${MODEL_METRICS.testSplit}%`],
              ["Target", "Predicted Renewable Energy (kWh)"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Feature importance" description="Relative weight in the ensemble">
          <div className="space-y-3">
            {FEATURE_IMPORTANCE.map((f) => (
              <div key={f.feature}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{f.feature}</span>
                  <span className="tabular-nums">{(f.value * 100).toFixed(0)}%</span>
                </div>
                <Progress value={f.value * 100 * 3} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Dataset features" description="Model inputs">
          <div className="flex flex-wrap gap-2">
            {INPUTS.map((i) => (
              <Badge key={i} variant="secondary">
                {i}
              </Badge>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Future scope" description="Planned capability roadmap">
          <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {FUTURE.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </main>
  );
}
