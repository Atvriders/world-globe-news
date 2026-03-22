import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { NewsCluster, GlobeNewsPin, NewsCategory } from '../../types';
import { CATEGORY_COLORS, GLOBE, UI } from '../../data/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface NewsGlobeProps {
  clusters: NewsCluster[];
  selectedCluster: NewsCluster | null;
  onPinClick: (cluster: NewsCluster) => void;
  onFlyTo?: { lat: number; lng: number } | null;
}

// ── Build globe pins from clusters ───────────────────────────────────────────

function buildPins(clusters: NewsCluster[]): GlobeNewsPin[] {
  return clusters
    .filter(c => c.location)
    .map(c => ({
      id: c.id,
      lat: c.location.lat,
      lng: c.location.lng,
      label: c.title.length > 50 ? c.title.slice(0, 50) + '…' : c.title,
      size: c.isBreaking ? GLOBE.pinBreakingSize : GLOBE.pinBaseSize + (c.importance * 0.03),
      color: CATEGORY_COLORS[c.category as NewsCategory] || CATEGORY_COLORS.world,
      category: c.category as NewsCategory,
      sourceCount: c.articles.length,
      isBreaking: c.isBreaking,
      cluster: c,
    }));
}

// ── Module-level accessor functions (no inline functions for GlobeGL) ────────

function pointLat(d: object) { return (d as GlobeNewsPin).lat; }
function pointLng(d: object) { return (d as GlobeNewsPin).lng; }
function pointAlt(d: object) { return (d as GlobeNewsPin).isBreaking ? 0.06 : 0.02; }
function pointColor(d: object) { return (d as GlobeNewsPin).color; }
function pointRadius(d: object) { return (d as GlobeNewsPin).size; }

function labelLat(d: object) { return (d as GlobeNewsPin).lat; }
function labelLng(d: object) { return (d as GlobeNewsPin).lng; }
function labelAlt(d: object) { return (d as GlobeNewsPin).isBreaking ? 0.08 : 0.04; }
function labelText(d: object) {
  const pin = d as GlobeNewsPin;
  const count = pin.sourceCount > 1 ? ` [${pin.sourceCount}]` : '';
  return `${pin.label}${count}`;
}
function labelSize(d: object) { return (d as GlobeNewsPin).isBreaking ? 1.2 : 0.8; }
function labelColor(d: object) { return (d as GlobeNewsPin).color; }
function labelDotRadius(d: object) { return (d as GlobeNewsPin).isBreaking ? 0.5 : 0.3; }
const LABEL_RESOLUTION = 2;

function ringLat(d: object) { return (d as GlobeNewsPin).lat; }
function ringLng(d: object) { return (d as GlobeNewsPin).lng; }
function ringColor(d: object) {
  const c = (d as GlobeNewsPin).color;
  return (t: number) => `${c}${Math.round((1 - t) * 255).toString(16).padStart(2, '0')}`;
}
function ringMaxRadius() { return 3; }
function ringPropagationSpeed() { return 2; }
function ringRepeatPeriod() { return 1500; }

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

  // Handle pin click
  const handlePointClick = useCallback((point: object) => {
    const pin = point as GlobeNewsPin;
    onPinClick(pin.cluster);

    // Fly to pin
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: pin.lat, lng: pin.lng, altitude: 1.5 },
        1000
      );
    }
  }, [onPinClick]);

  const handleLabelClick = useCallback((label: object) => {
    handlePointClick(label);
  }, [handlePointClick]);

  // External fly-to
  useEffect(() => {
    if (onFlyTo && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: onFlyTo.lat, lng: onFlyTo.lng, altitude: 1.5 },
        1200
      );
    }
  }, [onFlyTo]);

  // Initial camera position
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 30, lng: 10, altitude: 2.2 }, 0);

      // Configure controls
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.enableZoom = true;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 120;
        controls.maxDistance = 600;
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
      // Points layer — colored dots
      pointsData={pins}
      pointLat={pointLat}
      pointLng={pointLng}
      pointAltitude={pointAlt}
      pointColor={pointColor}
      pointRadius={pointRadius}
      pointsMerge={false}
      onPointClick={handlePointClick}
      // Labels layer — headline text
      labelsData={pins}
      labelLat={labelLat}
      labelLng={labelLng}
      labelAltitude={labelAlt}
      labelText={labelText}
      labelSize={labelSize}
      labelColor={labelColor}
      labelDotRadius={labelDotRadius}
      labelResolution={LABEL_RESOLUTION}
      onLabelClick={handleLabelClick}
      // Rings layer — breaking news pulse
      ringsData={breakingPins}
      ringLat={ringLat}
      ringLng={ringLng}
      ringColor={ringColor}
      ringMaxRadius={ringMaxRadius}
      ringPropagationSpeed={ringPropagationSpeed}
      ringRepeatPeriod={ringRepeatPeriod}
      // Performance
      animateIn={true}
      waitForGlobeReady={true}
    />
  );
};

export default NewsGlobe;
