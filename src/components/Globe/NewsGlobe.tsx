import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { NewsCluster, GlobeNewsPin, NewsCategory } from '../../types';
import { CATEGORY_COLORS, GLOBE } from '../../data/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface NewsGlobeProps {
  clusters: NewsCluster[];
  selectedCluster: NewsCluster | null;
  onPinClick: (cluster: NewsCluster) => void;
  onFlyTo?: { lat: number; lng: number } | null;
}

interface ArcDatum {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

// ── Build globe pins from clusters ───────────────────────────────────────────

function buildPins(clusters: NewsCluster[]): GlobeNewsPin[] {
  return clusters
    .filter(c => c.location)
    .map(c => {
      // Size based on source count: more sources = bigger pin (range 0.3–0.8)
      const sourceCount = c.articles.length;
      const sizeFactor = Math.min(sourceCount / 8, 1); // normalize to 0–1
      const baseSize = 0.3 + sizeFactor * 0.5; // 0.3 to 0.8
      const size = c.isBreaking ? Math.max(baseSize, 0.65) : baseSize;

      return {
        id: c.id,
        lat: c.location.lat,
        lng: c.location.lng,
        label: c.title,
        size,
        color: CATEGORY_COLORS[c.category as NewsCategory] || CATEGORY_COLORS.world,
        category: c.category as NewsCategory,
        sourceCount,
        isBreaking: c.isBreaking,
        cluster: c,
      };
    });
}

// ── Build arcs from selected pin to same-category pins ───────────────────────

function buildArcs(
  pins: GlobeNewsPin[],
  selectedCluster: NewsCluster | null
): ArcDatum[] {
  if (!selectedCluster || !selectedCluster.location) return [];

  const category = selectedCluster.category as NewsCategory;
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.world;
  // 30% opacity hex = 4D
  const arcColor = `${color}4D`;

  return pins
    .filter(
      p => p.category === category && p.cluster.id !== selectedCluster.id
    )
    .map(p => ({
      startLat: selectedCluster.location.lat,
      startLng: selectedCluster.location.lng,
      endLat: p.lat,
      endLng: p.lng,
      color: arcColor,
    }));
}

// ── Module-level accessor functions (no inline closures for GlobeGL) ─────────

// Points
function pointLat(d: object) { return (d as GlobeNewsPin).lat; }
function pointLng(d: object) { return (d as GlobeNewsPin).lng; }
function pointAlt(d: object) { return (d as GlobeNewsPin).isBreaking ? 0.04 : 0.01; }
function pointColor(d: object) { return (d as GlobeNewsPin).color; }
function pointRadius(d: object) { return (d as GlobeNewsPin).size; }

// Rings (breaking news pulse)
function ringLat(d: object) { return (d as GlobeNewsPin).lat; }
function ringLng(d: object) { return (d as GlobeNewsPin).lng; }
function ringColor(d: object) {
  const c = (d as GlobeNewsPin).color;
  return (t: number) => `${c}${Math.round((1 - t) * 255).toString(16).padStart(2, '0')}`;
}
function ringMaxRadius() { return 4; }
function ringPropagationSpeed() { return 1.5; }
function ringRepeatPeriod() { return 2000; }

// Arcs
function arcStartLat(d: object) { return (d as ArcDatum).startLat; }
function arcStartLng(d: object) { return (d as ArcDatum).startLng; }
function arcEndLat(d: object) { return (d as ArcDatum).endLat; }
function arcEndLng(d: object) { return (d as ArcDatum).endLng; }
function arcColor(d: object) { return (d as ArcDatum).color; }
function arcStroke() { return GLOBE.arcStroke; }
function arcDashLength() { return 0.4; }
function arcDashGap() { return 0.2; }
function arcDashAnimateTime() { return 2000; }

// ── Component ────────────────────────────────────────────────────────────────

const NewsGlobe: React.FC<NewsGlobeProps> = ({
  clusters,
  selectedCluster,
  onPinClick,
  onFlyTo,
}) => {
  const globeRef = useRef<any>(null);

  // Build pins
  const pins = useMemo(() => buildPins(clusters), [clusters]);

  // Breaking pins get ring animations
  const breakingPins = useMemo(() => pins.filter(p => p.isBreaking), [pins]);

  // Arcs from selected cluster to same-category pins
  const arcs = useMemo(
    () => buildArcs(pins, selectedCluster),
    [pins, selectedCluster]
  );

  // Handle pin click — open detail panel + fly to location
  const handlePointClick = useCallback((point: object) => {
    const pin = point as GlobeNewsPin;
    onPinClick(pin.cluster);

    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: pin.lat, lng: pin.lng, altitude: 1.5 },
        1500
      );
    }
  }, [onPinClick]);

  // External fly-to
  useEffect(() => {
    if (onFlyTo && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: onFlyTo.lat, lng: onFlyTo.lng, altitude: 1.5 },
        1500
      );
    }
  }, [onFlyTo]);

  // Initial camera position
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 25, lng: 0, altitude: 2.0 }, 0);

      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.enableZoom = true;
        controls.zoomSpeed = 0.6;
        controls.minDistance = 100;
        controls.maxDistance = 700;
      }
    }
  }, []);

  return (
    <Globe
      ref={globeRef}
      globeImageUrl={GLOBE.globeImageUrl}
      bumpImageUrl={GLOBE.bumpImageUrl}
      backgroundImageUrl={GLOBE.backgroundImageUrl}
      atmosphereColor={GLOBE.atmosphereColor}
      atmosphereAltitude={GLOBE.atmosphereAltitude}
      // Points layer — clean colored dots, no text
      pointsData={pins}
      pointLat={pointLat}
      pointLng={pointLng}
      pointAltitude={pointAlt}
      pointColor={pointColor}
      pointRadius={pointRadius}
      pointsMerge={false}
      onPointClick={handlePointClick}
      // Rings layer — breaking news pulse
      ringsData={breakingPins}
      ringLat={ringLat}
      ringLng={ringLng}
      ringColor={ringColor}
      ringMaxRadius={ringMaxRadius}
      ringPropagationSpeed={ringPropagationSpeed}
      ringRepeatPeriod={ringRepeatPeriod}
      // Arcs layer — connects selected pin to same-category pins
      arcsData={arcs}
      arcStartLat={arcStartLat}
      arcStartLng={arcStartLng}
      arcEndLat={arcEndLat}
      arcEndLng={arcEndLng}
      arcColor={arcColor}
      arcStroke={arcStroke}
      arcDashLength={arcDashLength}
      arcDashGap={arcDashGap}
      arcDashAnimateTime={arcDashAnimateTime}
      // Performance
      animateIn={true}
      waitForGlobeReady={true}
    />
  );
};

export default NewsGlobe;
