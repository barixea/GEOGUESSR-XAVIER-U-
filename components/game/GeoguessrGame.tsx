'use client';

import Image from 'next/image';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useMemo, useRef, useState } from 'react';
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
  scoreForDistance,
  shuffleLocations,
  type Coordinates,
} from '@/lib/geoguessr';
import type { BuildingWithPhoto } from '@/lib/types';

type Phase = 'start' | 'playing' | 'result' | 'finished';

type RoundResult = {
  building: BuildingWithPhoto;
  guess: Coordinates;
  distance: number;
  score: number;
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

function GameHeader({
  phase,
  round,
  totalRounds,
  totalScore,
}: {
  phase: Phase;
  round: number;
  totalRounds: number;
  totalScore: number;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Xavier University</p>
        <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">Campus Geoguessr</h1>
      </div>
      {phase !== 'start' && (
        <div className="flex shrink-0 items-center gap-5 text-right">
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

function StartScreen({ onStart, locationCount }: { onStart: () => void; locationCount: number }) {
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
        <div className="flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-12 sm:py-9">
          <div>
            <p className="text-sm font-semibold text-slate-900">{DEFAULT_ROUNDS} rounds per game</p>
            <p className="mt-1 text-sm text-slate-500">{locationCount} campus locations available</p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-7 text-sm font-bold text-brand-fg shadow-sm transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Start game
          </button>
        </div>
      </section>
    </div>
  );
}

function ResultPanel({
  result,
  totalScore,
  onNext,
}: {
  result: RoundResult;
  totalScore: number;
  onNext: () => void;
}) {
  return (
    <aside className="border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-l lg:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Location revealed</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{result.building.name}</h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Round score</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand">{result.score.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Distance</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{formatDistance(result.distance)}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Game total</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{totalScore.toLocaleString()}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        Next round
      </button>
    </aside>
  );
}

function FinishedScreen({ results, onRestart }: { results: RoundResult[]; onRestart: () => void }) {
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const averageDistance = results.length
    ? results.reduce((sum, result) => sum + result.distance, 0) / results.length
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
                <p className="text-xs text-slate-400">{formatDistance(result.distance)} away</p>
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
  const [rounds, setRounds] = useState<BuildingWithPhoto[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState<Coordinates | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);

  const current = rounds[roundIndex] ?? null;
  const currentResult = results[results.length - 1] ?? null;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);

  const startGame = useCallback(() => {
    const nextRounds = shuffleLocations(locations).slice(0, Math.min(DEFAULT_ROUNDS, locations.length));
    setRounds(nextRounds);
    setRoundIndex(0);
    setGuess(null);
    setResults([]);
    setPhase(nextRounds.length ? 'playing' : 'start');
  }, [locations]);

  const submitGuess = useCallback(() => {
    if (!current || !guess || phase !== 'playing') return;
    const distance = distanceInMeters(guess, current.coordinates as Coordinates);
    const score = scoreForDistance(distance);
    setResults((previous) => [...previous, { building: current, guess, distance, score }]);
    setPhase('result');
    mapRef.current?.getMap().fitBounds(
      [
        [Math.min(guess[0], current.coordinates[0]), Math.min(guess[1], current.coordinates[1])],
        [Math.max(guess[0], current.coordinates[0]), Math.max(guess[1], current.coordinates[1])],
      ],
      { padding: 90, maxZoom: 18.2, duration: 700, essential: true },
    );
  }, [current, guess, phase]);

  const nextRound = useCallback(() => {
    if (roundIndex >= rounds.length - 1) {
      setPhase('finished');
      return;
    }
    setRoundIndex((index) => index + 1);
    setGuess(null);
    setPhase('playing');
    mapRef.current?.getMap().easeTo({
      center: [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude],
      ...VIEW_2D,
      duration: 500,
      essential: true,
    });
  }, [roundIndex, rounds.length]);

  const lineGeoJson = useMemo(() => {
    if (phase !== 'result' || !current || !guess) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: [guess, current.coordinates] },
    };
  }, [current, guess, phase]);

  if (phase === 'start') {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950">
        <GameHeader phase={phase} round={0} totalRounds={DEFAULT_ROUNDS} totalScore={0} />
        <StartScreen onStart={startGame} locationCount={locations.length} />
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950">
        <GameHeader phase={phase} round={roundIndex} totalRounds={rounds.length} totalScore={totalScore} />
        <FinishedScreen results={results} onRestart={startGame} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100">
      <GameHeader phase={phase} round={roundIndex} totalRounds={rounds.length} totalScore={totalScore} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid min-h-full w-full max-w-[1600px] grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(480px,1.35fr)] lg:gap-6 lg:p-8">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                  Pin the spot where you think this image was taken. Your score is higher when your marker is closer.
                </p>
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
                  onLoad={(event) => {
                    try {
                      event.target.setConfigProperty('basemap', 'show3dObjects', false);
                    } catch {
                      // Older styles may not expose the Standard basemap config.
                    }
                  }}
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
                  {guess && (
                    <Marker longitude={guess[0]} latitude={guess[1]} anchor="center">
                      <div className={`${MARKER_BASE} bg-orange-500`} aria-label="Your guess">
                        <span className="size-2 rounded-full bg-white" />
                      </div>
                    </Marker>
                  )}
                  {phase === 'result' && current && (
                    <Marker longitude={current.coordinates[0]} latitude={current.coordinates[1]} anchor="center">
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
                  Click anywhere to move your pin
                </div>
              )}
            </div>
            {phase === 'result' && currentResult && (
              <ResultPanel result={currentResult} totalScore={totalScore} onNext={nextRound} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
