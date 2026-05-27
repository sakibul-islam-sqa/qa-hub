'use client';

import * as React from 'react';
import { Clock, Info } from 'lucide-react';
import { ToolPage } from '@/components/ToolPage';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { TimezoneSelect } from '@/components/ui/TimezoneSelect';
import { CopyButton } from '@/components/ui/CopyButton';
import { ResetButton } from '@/components/ui/ResetButton';

const COMMON_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Tehran',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function getZoneOffset(zone: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

function formatClockParts(date: Date, zone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZoneName: 'short',
      hour12: true,
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    let hour = get('hour');
    if (hour && hour.length === 1) hour = '0' + hour;
    return {
      hour,
      minute: get('minute'),
      second: get('second'),
      period: get('dayPeriod').toUpperCase(),
      weekday: get('weekday'),
      month: get('month'),
      day: get('day'),
      year: get('year'),
      tzName: get('timeZoneName'),
    };
  } catch {
    return null;
  }
}

function isoInZone(date: Date, zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const rawOffset = get('timeZoneName').replace(/^GMT/, '');
    const offset = rawOffset || 'Z';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}${offset}`;
  } catch {
    return 'Invalid timezone';
  }
}

function rfcInZone(date: Date, zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short',
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    return `${get('weekday')}, ${get('day')} ${get('month')} ${get('year')} ${get('hour')}:${get('minute')}:${get('second')} ${get('timeZoneName')}`;
  } catch {
    return 'Invalid timezone';
  }
}

function formatInZone(date: Date, tz: string) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return 'Invalid timezone';
  }
}

export default function TimestampPage() {
  const [now, setNow] = React.useState<number | null>(null);
  const [input, setInput] = React.useState('');
  const [zone, setZone] = React.useState('UTC');
  const localZone = React.useRef('UTC');

  function reset() {
    setInput(String(Math.floor(Date.now() / 1000)));
    setZone(localZone.current);
  }

  React.useEffect(() => {
    const lz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    localZone.current = lz;
    setZone(lz);
    const t = Date.now();
    setInput(String(Math.floor(t / 1000)));
    setNow(t);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsed = React.useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^-?\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      const ms = trimmed.length <= 10 ? n * 1000 : n;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }, [input]);

  const nowDate = now !== null ? new Date(now) : null;
  const clock = nowDate ? formatClockParts(nowDate, zone) : null;
  const offset = nowDate ? getZoneOffset(zone, nowDate) : '';
  const isLocalZone = zone === localZone.current;
  const zoneLabel = zone.replace(/_/g, ' ');
  const zoneOptions = nowDate
    ? Array.from(new Set([localZone.current, ...COMMON_ZONES])).map((z) => ({
        value: z,
        label: z.replace(/_/g, ' '),
        offset: getZoneOffset(z, nowDate) || 'GMT',
        isLocal: z === localZone.current,
      }))
    : [{ value: 'UTC', label: 'UTC', offset: 'GMT', isLocal: true }];

  return (
    <ToolPage slug="timestamp">
      <Card>
        <CardContent className="space-y-6 p-4 sm:p-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <Label>Current time</Label>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <TimezoneSelect value={zone} onChange={setZone} options={zoneOptions} />
                <div className="flex items-center gap-1">
                  <ResetButton onClick={reset} />
                  <InfoTip text="Resets the Convert input to the current Unix timestamp and switches the timezone back to your local timezone." />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-surface to-surface-2 px-4 py-6 shadow-soft sm:px-6 sm:py-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/5 blur-3xl"
              />
              <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                <span className="relative inline-flex h-1.5 w-1.5">
                  {clock && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  )}
                  <span
                    className={
                      'relative inline-flex h-1.5 w-1.5 rounded-full ' +
                      (clock ? 'bg-accent' : 'bg-muted')
                    }
                  />
                </span>
                {clock ? 'Live' : 'Syncing'}
              </div>
              {clock ? (
                <>
                  <div className="mt-2 flex items-center justify-center gap-1.5 font-mono tabular-nums sm:gap-2">
                    <DigitTile value={clock.hour} />
                    <ClockColon />
                    <DigitTile value={clock.minute} />
                    <ClockColon />
                    <DigitTile value={clock.second} muted />
                    <span className="ml-2 self-center rounded-md bg-accent/15 px-2 py-1 text-xs font-bold tracking-[0.2em] text-accent sm:text-sm">
                      {clock.period}
                    </span>
                  </div>
                  <div className="mt-5 text-center text-sm font-medium text-fg">
                    {clock.weekday}, {clock.month} {clock.day}, {clock.year}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted">
                    <span className="font-medium text-fg/80">{zoneLabel}</span>
                    {isLocalZone && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Local
                      </span>
                    )}
                    {clock.tzName && (
                      <>
                        <span className="text-border">·</span>
                        <span>{clock.tzName}</span>
                      </>
                    )}
                    {offset && (
                      <>
                        <span className="text-border">·</span>
                        <span className="font-mono">{offset}</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="mt-2 flex items-center justify-center gap-1.5 font-mono tabular-nums sm:gap-2">
                    <DigitTile value="--" muted />
                    <ClockColon />
                    <DigitTile value="--" muted />
                    <ClockColon />
                    <DigitTile value="--" muted />
                  </div>
                  <div className="text-xs text-muted">Loading…</div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Unix (s)" value={nowDate ? String(Math.floor(now! / 1000)) : '-'} />
              <Stat label="Unix (ms)" value={nowDate ? String(now) : '-'} />
              <Stat
                label={`ISO 8601 · ${zoneLabel}`}
                value={nowDate ? isoInZone(nowDate, zone) : '-'}
              />
              <Stat label="ISO 8601 · UTC" value={nowDate ? nowDate.toISOString() : '-'} />
            </div>
          </div>

          <div>
            <Label>Convert · Input (Unix seconds, ms, or any parseable date)</Label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="mt-2 font-mono"
              placeholder="1716595200 or 2026-05-24T10:00:00Z"
            />
          </div>

          {parsed ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Stat label={`ISO 8601 · ${zoneLabel}`} value={isoInZone(parsed, zone)} />
              <Stat label="ISO 8601 · UTC" value={parsed.toISOString()} />
              <Stat label="Unix seconds" value={String(Math.floor(parsed.getTime() / 1000))} />
              <Stat label="Unix milliseconds" value={String(parsed.getTime())} />
              <Stat label={`Human readable · ${zoneLabel}`} value={formatInZone(parsed, zone)} />
              <Stat label={`RFC 2822 · ${zoneLabel}`} value={rfcInZone(parsed, zone)} />
            </div>
          ) : (
            input && <p className="text-sm text-danger">Could not parse input as a date.</p>
          )}
        </CardContent>
      </Card>
    </ToolPage>
  );
}

function DigitTile({ value, muted = false }: { value: string; muted?: boolean }) {
  return (
    <div className="relative flex min-w-[56px] items-center justify-center rounded-xl border border-border/60 bg-surface/60 px-3 py-3 shadow-inner backdrop-blur-sm sm:min-w-[76px] sm:px-4 sm:py-4">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-fg/15 to-transparent"
      />
      <span
        className={
          'text-5xl font-bold leading-none tracking-tight sm:text-6xl ' +
          (muted ? 'text-muted' : 'text-fg')
        }
      >
        {value}
      </span>
    </div>
  );
}

function ClockColon() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-accent/80 sm:h-2 sm:w-2" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent/80 sm:h-2 sm:w-2" />
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 w-56 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs leading-snug text-fg opacity-0 shadow-soft transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {label}
        </span>
        <CopyButton value={value} label="" />
      </div>
      <div className="break-all font-mono text-xs">{value}</div>
    </div>
  );
}
