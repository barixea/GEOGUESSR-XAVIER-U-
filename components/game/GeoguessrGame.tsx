'use client';

import Image from 'next/image';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import Map, {
  Layer,
  Marker,
  NavigationControl,
  ScaleControl,
  Source,
  type MapRef,
} from 'react-map-gl/mapbox';

import { CAMPUS_BOUNDARY } from '@/data/campus-boundary';
import {
  CAMPUS_BOUNDS,
  CAMPUS_CENTER,
  MAP_STYLE,
  MAX_ZOOM,
  MIN_ZOOM,
  VIEW_2D,
} from '@/lib/map-config';
import {
  DEFAULT_ROUNDS,
  distanceInMeters,
  formatDistance,
  INITIAL_HEARTS,
  isGuessAccepted,
  MODE_LABELS,
  MODE_TOLERANCE_METERS,
  ROUND_TIME_SECONDS,
  scoreForDistance,
  shuffleLocations,
  type Coordinates,
  type GameMode,
} from '@/lib/geoguessr';
import type { BuildingWithPhoto } from '@/lib/types';

type Phase = 'start' | 'playing' | 'result' | 'finished';

type RoundResult = {
  building: BuildingWithPhoto;
  guess: Coordinates | null;
  distance: number | null;
  score: number;
  accepted: boolean;
  failureReason?: 'timeout' | 'hearts';
};

type Props = {
  locations: BuildingWithPhoto[];
};

const RESULT_LINE = {
  id: 'guess-result-line',
  type: 'line' as const,
  layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
  paint: {
    'line-color': '#f97316',
    'line-width': 4,
    'line-opacity': 0.9,
    'line-dasharray': [1.2, 1.2],
  },
};

const MARKER_BASE = 'grid size-8 place-items-center rounded-full border-2 border-white shadow-lg';

// Keep the guessing map visually neutral so map labels do not reveal the answer.
const configureGeoguessrMap = (map: MapboxMap) => {
  const config: Record<string, boolean> = {
    show3dObjects: false,
    showPointOfInterestLabels: false,
    showLandmarkIconLabels: false,
    showRoadLabels: false,
    showPlaceLabels: false,
    showTransitLabels: false,
  };

  for (const [key, value] of Object.entries(config)) {
    try {
      map.setConfigProperty('basemap', key, value);
    } catch {
      // Some Mapbox styles do not expose every Standard basemap property.
    }
  }
};

function GameHeader({
  phase,
  round,
  totalRounds,
  totalScore,
  mode,
  hearts,
  timeLeft,
}: {
  phase: Phase;
  round: number;
  totalRounds: number;
  totalScore: number;
  mode: GameMode;
  hearts: number;
  timeLeft: number;
}) {
  const timerWarning = phase === 'playing' && timeLeft <= 3;
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Xavier University</p>
        <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">Campus Geoguessr</h1>
      </div>
      {phase !== 'start' && (
        <div className="flex shrink-0 items-center gap-3 text-right sm:gap-5">
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Mode</p>
            <p className="text-sm font-semibold text-slate-800">{MODE_LABELS[mode]}</p>
          </div>
          <div aria-label={`${hearts} hearts remaining`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Hearts</p>
            <p className="text-base font-bold leading-5 tracking-[0.16em] text-rose-500" aria-hidden="true">
              {'♥'.repeat(hearts)}<span className="text-slate-200">{'♥'.repeat(INITIAL_HEARTS - hearts)}</span>
            </p>
          </div>
          <div className={timerWarning ? 'xu-timer-warning' : ''}>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Time</p>
            <p className={`text-sm font-bold tabular-nums ${timerWarning ? 'text-rose-600' : 'text-slate-800'}`}>{timeLeft}s</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Round</p>
            <p className="text-sm font-semibold tabular-nums text-slate-800">
              {Math.min(round + 1, totalRounds)} <span className="text-slate-400">/ {totalRounds}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Score</p>
            <p className="text-sm font-bold tabular-nums text-brand">{totalScore.toLocaleString()}</p>
          </div>
        </div>
      )}
    </header>
  );
}

function StartScreen({
  onStart,
  locationCount,
  mode,
  onModeChange,
}: {
  onStart: () => void;
  locationCount: number;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}) {
  const modeCopy: Record<GameMode, string> = {
    easy: 'Guesses within 200 m are accepted.',
    medium: 'Guesses within 100 m are accepted.',
    hard: 'Guesses within 25 m are accepted.',
  };

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-slate-950 px-5 py-10">
      <section className="w-full max-w-3xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl shadow-slate-950/40">
        <div className="relative overflow-hidden bg-brand px-6 py-12 text-brand-fg sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border-[36px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-36 left-1/3 size-80 rounded-full border-[48px] border-white/10" />
          <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-brand-fg/70">Xavier University Ateneo de Cagayan</p>
          <h2 className="relative mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">How well do you know campus?</h2>
          <p className="relative mt-5 max-w-lg text-base leading-relaxed text-brand-fg/80 sm:text-lg">
            Identify a campus location from one image, then pin your best guess on the 2D Xavier University map.
          </p>
        </div>
        <div className="space-y-7 px-6 py-7 sm:px-12 sm:py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{DEFAULT_ROUNDS} rounds per game</p>
              <p className="mt-1 text-sm text-slate-500">{locationCount} campus locations available</p>
            </div>
            <div className="sm:w-[22rem]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Choose difficulty</p>
              <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Choose difficulty">
                {(['easy', 'medium', 'hard'] as GameMode[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onModeChange(option)}
                    aria-pressed={mode === option}
                    className={`min-h-10 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${mode === option ? 'border-brand bg-brand text-brand-fg' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    {MODE_LABELS[option]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">{modeCopy[mode]} You have {INITIAL_HEARTS} hearts total and 10 seconds per attempt.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={locationCount === 0}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-7 text-sm font-bold text-brand-fg shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {locationCount > 0 ? 'Start game' : 'No enabled locations'}
          </button>
        </div>
      </section>
    </div>
  );
}

function ResultPanel({
  result,
  hearts,
  onNext,
}: {
  result: RoundResult;
  hearts: number;
  onNext: () => void;
}) {
  const failed = !result.accepted;
  return (
    <aside className={`border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-l lg:border-t-0 ${failed ? 'xu-guess-wrong' : 'xu-guess-correct'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${failed ? 'text-rose-600' : 'text-emerald-600'}`}>
            {failed ? (result.failureReason === 'timeout' ? "Time's up" : 'Out of hearts') : 'Location accepted'}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{result.building.name}</h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Round score</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${failed ? 'text-slate-400' : 'text-brand'}`}>{result.score.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Distance</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{result.distance === null ? 'No guess' : formatDistance(result.distance)}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Hearts left</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{hearts} / {INITIAL_HEARTS}</p>
        </div>
      </div>
      {failed && <p className="mt-4 text-sm leading-relaxed text-slate-600">The correct location is shown on the map. {hearts > 0 ? 'Use your next attempt carefully.' : 'Your three hearts are gone.'}</p>}
      <button
        type="button"
        onClick={onNext}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {hearts > 0 ? 'Next round' : 'See final results'}
      </button>
    </aside>
  );
}

function FinishedScreen({ results, onRestart }: { results: RoundResult[]; onRestart: () => void }) {
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const averageDistance = results.length
    ? results.reduce((sum, result) => sum + (result.distance ?? 0), 0) / results.length
    : 0;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-slate-950 px-5 py-10">
      <section className="w-full max-w-2xl rounded-[1.5rem] bg-white p-6 shadow-2xl shadow-slate-950/40 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Game complete</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your campus result</h2>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-brand p-4 text-brand-fg">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-fg/65">Total score</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{totalScore.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Average distance</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-800">{formatDistance(averageDistance)}</p>
          </div>
          <div className="col-span-2 rounded-xl bg-slate-100 p-4 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Rounds played</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-800">{results.length}</p>
          </div>
        </div>
        <div className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {results.map((result, index) => (
            <div key={`${result.building.id}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Round {index + 1}</p>
                <p className="truncate text-sm font-semibold text-slate-800">{result.building.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-brand">{result.score.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{result.distance === null ? 'No guess' : `${formatDistance(result.distance)} away`}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-brand-fg transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Play again
        </button>
      </section>
    </div>
  );
}

export default function GeoguessrGame({ locations }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [phase, setPhase] = useState<Phase>('start');
  const [mode, setMode] = useState<GameMode>('medium');
  const [rounds, setRounds] = useState<BuildingWithPhoto[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState<Coordinates | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [hearts, setHearts] = useState(INITIAL_HEARTS);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const [attemptId, setAttemptId] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'wrong' | 'correct'>('idle');

  const current = rounds[roundIndex] ?? null;
  const currentResult = results[results.length - 1] ?? null;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);

  useEffect(() => {
    if (phase !== 'playing' || !current) return;
    setTimeLeft(ROUND_TIME_SECONDS);
    const interval = window.setInterval(() => {
      setTimeLeft((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, roundIndex, attemptId, current]);

  const handleFailedAttempt = useCallback(
    (failedGuess: Coordinates | null, reason: 'timeout' | 'hearts') => {
      if (!current || phase !== 'playing') return;
      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
      setFeedback('wrong');
      window.setTimeout(() => setFeedback('idle'), 450);

      if (nextHearts === 0) {
        const distance = failedGuess ? distanceInMeters(failedGuess, current.coordinates as Coordinates) : null;
        setResults((previous) => [
          ...previous,
          { building: current, guess: failedGuess, distance, score: 0, accepted: false, failureReason: reason === 'timeout' ? 'timeout' : 'hearts' },
        ]);
        setPhase('result');
        if (failedGuess) {
          mapRef.current?.getMap().fitBounds(
            [
              [Math.min(failedGuess[0], current.coordinates[0]), Math.min(failedGuess[1], current.coordinates[1])],
              [Math.max(failedGuess[0], current.coordinates[0]), Math.max(failedGuess[1], current.coordinates[1])],
            ],
            { padding: 90, maxZoom: 18.2, duration: 700, essential: true },
          );
        }
        return;
      }

      setGuess(null);
      setAttemptId((id) => id + 1);
    },
    [current, hearts, phase],
  );

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) handleFailedAttempt(null, 'timeout');
  }, [handleFailedAttempt, phase, timeLeft]);

  const startGame = useCallback(() => {
    const nextRounds = shuffleLocations(locations).slice(0, Math.min(DEFAULT_ROUNDS, locations.length));
    setRounds(nextRounds);
    setRoundIndex(0);
    setGuess(null);
    setResults([]);
    setHearts(INITIAL_HEARTS);
    setTimeLeft(ROUND_TIME_SECONDS);
    setAttemptId(0);
    setFeedback('idle');
    setPhase(nextRounds.length ? 'playing' : 'start');
  }, [locations]);

  const submitGuess = useCallback(() => {
    if (!current || !guess || phase !== 'playing' || hearts <= 0) return;
    const distance = distanceInMeters(guess, current.coordinates as Coordinates);
    if (!isGuessAccepted(distance, mode)) {
      handleFailedAttempt(guess, 'hearts');
      return;
    }
    const score = scoreForDistance(distance);
    setResults((previous) => [...previous, { building: current, guess, distance, score, accepted: true }]);
    setFeedback('correct');
    setPhase('result');
    mapRef.current?.getMap().fitBounds(
      [
        [Math.min(guess[0], current.coordinates[0]), Math.min(guess[1], current.coordinates[1])],
        [Math.max(guess[0], current.coordinates[0]), Math.max(guess[1], current.coordinates[1])],
      ],
      { padding: 90, maxZoom: 18.2, duration: 700, essential: true },
    );
  }, [current, guess, phase, hearts, mode, handleFailedAttempt]);

  const nextRound = useCallback(() => {
    if (roundIndex >= rounds.length - 1 || hearts <= 0) {
      setPhase('finished');
      return;
    }
    setRoundIndex((index) => index + 1);
    setGuess(null);
    setTimeLeft(ROUND_TIME_SECONDS);
    setAttemptId((id) => id + 1);
    setFeedback('idle');
    setPhase('playing');
    mapRef.current?.getMap().easeTo({
      center: [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude],
      ...VIEW_2D,
      duration: 500,
      essential: true,
    });
  }, [roundIndex, rounds.length, hearts]);

  const lineGeoJson = useMemo(() => {
    if (phase !== 'result' || !currentResult?.guess) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: [currentResult.guess, currentResult.building.coordinates] },
    };
  }, [currentResult, phase]);

  const mapGuess = phase === 'result' ? currentResult?.guess ?? null : guess;

  if (phase === 'start') {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950">
        <GameHeader phase={phase} round={0} totalRounds={DEFAULT_ROUNDS} totalScore={0} mode={mode} hearts={INITIAL_HEARTS} timeLeft={ROUND_TIME_SECONDS} />
        <StartScreen onStart={startGame} locationCount={locations.length} mode={mode} onModeChange={setMode} />
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950">
        <GameHeader phase={phase} round={roundIndex} totalRounds={rounds.length} totalScore={totalScore} mode={mode} hearts={hearts} timeLeft={0} />
        <FinishedScreen results={results} onRestart={startGame} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100">
      <GameHeader phase={phase} round={roundIndex} totalRounds={rounds.length} totalScore={totalScore} mode={mode} hearts={hearts} timeLeft={timeLeft} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid min-h-full w-full max-w-[1600px] grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(480px,1.35fr)] lg:gap-6 lg:p-8">
          <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${feedback === 'wrong' ? 'xu-guess-wrong' : feedback === 'correct' ? 'xu-guess-correct' : ''}`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Identify the location</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">Where on campus is this?</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Still image</span>
            </div>
            <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/10] lg:aspect-auto lg:min-h-[340px] lg:flex-1">
              {current && (
                <Image
                  src={current.photo?.url ?? '/images/placeholder-building.svg'}
                  alt={`Campus clue for round ${roundIndex + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 to-transparent px-4 pb-4 pt-16">
                <p className="text-xs font-semibold text-white/75">One image. One best guess.</p>
              </div>
            </div>
            {current && (
              <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
                <p className="text-sm leading-relaxed text-slate-600">
                  Pin the spot where you think this image was taken. {MODE_LABELS[mode]} accepts guesses within {MODE_TOLERANCE_METERS[mode]} m.
                </p>
                {phase === 'playing' && timeLeft <= 3 && <p className="mt-2 text-sm font-bold text-rose-600 xu-timer-warning">Hurry, your guess is almost out of time.</p>}
                {phase === 'playing' && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={`${timeLeft} seconds remaining`}>
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${timeLeft <= 3 ? 'bg-rose-500' : 'bg-brand'}`}
                      style={{ width: `${(timeLeft / ROUND_TIME_SECONDS) * 100}%` }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={submitGuess}
                  disabled={!guess || phase !== 'playing' || !token}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {phase === 'result' ? 'Guess submitted' : 'Submit guess'}
                </button>
                {!token && <p className="mt-2 text-center text-xs text-amber-700">Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the map.</p>}
              </div>
            )}
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Place your pin</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">Xavier University map</h2>
              </div>
              {guess && phase === 'playing' && <span className="text-xs font-semibold text-brand">Pin selected</span>}
              {phase === 'playing' && !guess && <span className="text-xs font-semibold text-slate-400">Choose a point</span>}
            </div>
            <div className="relative min-h-[420px] flex-1 bg-slate-200">
              {token ? (
                <Map
                  ref={mapRef}
                  mapboxAccessToken={token}
                  mapStyle={MAP_STYLE}
                  initialViewState={{ ...CAMPUS_CENTER, ...VIEW_2D }}
                  maxBounds={CAMPUS_BOUNDS}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  dragRotate={false}
                  pitchWithRotate={false}
                  touchPitch={false}
                  attributionControl
                  reuseMaps
                  onLoad={(event) => configureGeoguessrMap(event.target)}
                  onClick={(event) => {
                    if (phase !== 'playing') return;
                    setGuess([event.lngLat.lng, event.lngLat.lat]);
                  }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <NavigationControl position="top-right" showCompass={false} />
                  <ScaleControl position="bottom-left" unit="metric" maxWidth={90} />
                  <Source id="geoguessr-campus-boundary" type="geojson" data={CAMPUS_BOUNDARY}>
                    <Layer
                      id="geoguessr-campus-fill"
                      type="fill"
                      paint={{ 'fill-color': '#2563eb', 'fill-opacity': 0.08 }}
                    />
                    <Layer
                      id="geoguessr-campus-line"
                      type="line"
                      paint={{ 'line-color': '#1d4ed8', 'line-width': 2.5, 'line-opacity': 0.8 }}
                    />
                  </Source>
                  {lineGeoJson && (
                    <Source id="guess-result" type="geojson" data={lineGeoJson}>
                      <Layer {...RESULT_LINE} />
                    </Source>
                  )}
                  {mapGuess && (
                    <Marker longitude={mapGuess[0]} latitude={mapGuess[1]} anchor="center">
                      <div className={`${MARKER_BASE} bg-orange-500`} aria-label="Your guess">
                        <span className="size-2 rounded-full bg-white" />
                      </div>
                    </Marker>
                  )}
                  {phase === 'result' && currentResult && (
                    <Marker longitude={currentResult.building.coordinates[0]} latitude={currentResult.building.coordinates[1]} anchor="center">
                      <div className={`${MARKER_BASE} bg-emerald-600`} aria-label="Correct location">
                        <span className="text-xs font-black text-white">✓</span>
                      </div>
                    </Marker>
                  )}
                </Map>
              ) : (
                <div className="grid h-full place-items-center p-6 text-center">
                  <div>
                    <p className="font-semibold text-slate-800">Map unavailable</p>
                    <p className="mt-1 text-sm text-slate-500">Configure a Mapbox token to place a guess.</p>
                  </div>
                </div>
              )}
              {phase === 'playing' && guess && token && (
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-black/5">
                  Click anywhere to move your pin · {timeLeft}s left
                </div>
              )}
              {phase === 'playing' && !guess && token && (
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-black/5">
                  Click the map to place your pin · {timeLeft}s left
                </div>
              )}
            </div>
            {phase === 'result' && currentResult && (
              <ResultPanel result={currentResult} hearts={hearts} onNext={nextRound} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
