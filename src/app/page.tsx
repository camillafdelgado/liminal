"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useUsageStore } from "@/lib/useUsageStore";

function formatDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function DashboardPage() {
  const { humanPercent, monthlyPledge, dailyLogs, logToday, setPledge } =
    useUsageStore();
  const [sliderValue, setSliderValue] = useState(humanPercent);
  const [pledgeInput, setPledgeInput] = useState(monthlyPledge);

  const aiPercent = 100 - humanPercent;
  const belowPledge = humanPercent < monthlyPledge;

  const donutData = useMemo(
    () => [
      { name: "Human", value: humanPercent, fill: "var(--chart-human)" },
      { name: "AI", value: aiPercent, fill: "var(--chart-ai)" },
    ],
    [humanPercent, aiPercent]
  );

  const weeklyData = useMemo(
    () =>
      dailyLogs.map((log) => ({
        day: formatDayLabel(log.date),
        human: log.humanPercent,
        ai: 100 - log.humanPercent,
      })),
    [dailyLogs]
  );

  const handleLogSubmit = () => {
    logToday(sliderValue);
  };

  const handlePledgeSave = () => {
    setPledge(pledgeInput);
  };

  return (
    <div className="relative min-h-screen terminal-grid">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F0D0B]" />

      <main className="relative mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <header className="mb-12 border-b border-border pb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {"// system.online"}
          </p>
          <h1 className="font-mono text-3xl font-medium glow-text text-[var(--accent)] md:text-4xl">
            LIMINAL
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Track the boundary between your hand and the machine. Stay human.
          </p>
        </header>

        {belowPledge && (
          <div
            role="alert"
            className="mb-8 rounded-lg border border-[var(--accent)]/40 bg-[var(--rust-deep)]/60 px-5 py-4 glow-accent"
          >
            <p className="font-mono text-sm text-[var(--accent)]">
              ⚠ THRESHOLD BREACH
            </p>
            <p className="mt-1 text-sm text-foreground/80">
              Today&apos;s human work is at{" "}
              <span className="font-mono text-[var(--accent)]">
                {humanPercent}%
              </span>
              — below your pledge of{" "}
              <span className="font-mono">{monthlyPledge}%</span>. The machine
              is winning.
            </p>
          </div>
        )}

        <Link
          href="/detect"
          className="group mb-10 block overflow-hidden rounded-xl border border-[var(--accent)]/40 bg-card/90 p-8 backdrop-blur-sm transition-all duration-300 glow-accent hover:border-[var(--accent)]/70 hover:bg-card"
        >
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
            <div className="signal-ring-preview shrink-0">
              <div
                className="signal-ring signal-ring--outer signal-ring--human opacity-80"
                aria-hidden
              />
              <div
                className="signal-ring signal-ring--mid signal-ring--human opacity-90"
                aria-hidden
              />
              <div
                className="signal-ring signal-ring--inner signal-ring--human"
                aria-hidden
              />
              <span className="signal-ring-preview__label font-mono text-[9px] uppercase tracking-[0.25em] text-[#6b8f71]">
                live
              </span>
            </div>

            <div className="flex-1 text-center md:text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                {"// primary.flow"}
              </p>
              <h2 className="mt-2 font-mono text-2xl font-medium text-[var(--accent)] glow-text md:text-3xl">
                Signal Monitor
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Let the ring watch your work. Typing patterns, paste events, and
                velocity bursts are scored automatically — no manual logging
                required.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-8 py-3 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-colors group-hover:bg-[var(--accent-muted)]">
                Begin monitoring
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                recommended
              </span>
            </div>
          </div>
        </Link>

        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-7">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                Today
              </CardTitle>
              <CardDescription className="text-foreground/70">
                Human vs AI split for the current session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto h-72 w-full max-w-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#171310",
                        border: "1px solid rgba(232, 139, 79, 0.2)",
                        borderRadius: "6px",
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "12px",
                        color: "#F2EDE4",
                      }}
                      formatter={(value) => [`${value ?? 0}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-5xl font-medium text-[var(--accent)] glow-text">
                    {humanPercent}
                  </span>
                  <span className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    % human
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-8 font-mono text-xs uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[var(--chart-human)]" />
                  Human {humanPercent}%
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-[var(--chart-ai)] ring-1 ring-[var(--accent)]/20" />
                  AI {aiPercent}%
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm glow-accent">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                  Your pledge this month
                </CardTitle>
                <CardDescription>
                  Minimum human work you committed to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-6xl font-medium text-[var(--accent)]">
                  {monthlyPledge}
                  <span className="text-2xl text-muted-foreground">%</span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {belowPledge
                    ? "You are currently below threshold."
                    : "You are holding the line."}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pledgeInput}
                    onChange={(e) =>
                      setPledgeInput(Number(e.target.value))
                    }
                    className="w-20 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePledgeSave}
                    className="border-[var(--accent)]/30 font-mono text-xs uppercase tracking-wider hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                  >
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60 backdrop-blur-sm opacity-90">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                  Manual override
                </CardTitle>
                <CardDescription>
                  Fallback only — prefer Signal Monitor for automatic tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between font-mono text-sm">
                  <span className="text-muted-foreground">Human work</span>
                  <span className="text-[var(--accent)]">{sliderValue}%</span>
                </div>
                <Slider
                  value={[sliderValue]}
                  onValueChange={(values) => {
                    const next = Array.isArray(values) ? values[0] : values;
                    if (typeof next === "number") setSliderValue(next);
                  }}
                  max={100}
                  step={1}
                  className="[&_[data-slot=slider-range]]:bg-[var(--accent)]"
                />
                <Button
                  onClick={handleLogSubmit}
                  variant="outline"
                  className="w-full border-border font-mono text-xs uppercase tracking-widest hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5"
                >
                  Commit manual entry
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-12">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
                Weekly signal
              </CardTitle>
              <CardDescription>
                Seven-day human vs AI usage pattern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#9a8f84",
                        fontSize: 11,
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#9a8f84",
                        fontSize: 11,
                        fontFamily: "var(--font-geist-mono)",
                      }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(232, 139, 79, 0.06)" }}
                      contentStyle={{
                        background: "#171310",
                        border: "1px solid rgba(232, 139, 79, 0.2)",
                        borderRadius: "6px",
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: "12px",
                        color: "#F2EDE4",
                      }}
                    />
                    <Bar
                      dataKey="human"
                      name="Human"
                      stackId="a"
                      fill="var(--chart-human)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="ai"
                      name="AI"
                      stackId="a"
                      fill="var(--chart-ai)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-16 border-t border-border pt-6">
          <p className="font-mono text-xs text-muted-foreground">
            liminal v0.1 — the space between human and machine
          </p>
        </footer>
      </main>
    </div>
  );
}
