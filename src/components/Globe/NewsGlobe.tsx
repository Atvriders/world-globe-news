import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import Globe from 'react-globe.gl';
import { NewsCluster, GlobeNewsPin, NewsCategory } from '../../types';
import { CATEGORY_COLORS, GLOBE } from '../../data/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_VISIBLE_PINS = 150;
const MAX_RING_PINS = 10;
const RESIZE_DEBOUNCE_MS = 200;

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

// Points — slightly translucent colors (append CC = 80% alpha)
function pointLat(d: object) { return (d as GlobeNewsPin).lat; }
function pointLng(d: object) { return (d as GlobeNewsPin).lng; }
function pointAlt(d: object) { return (d as GlobeNewsPin).isBreaking ? 0.04 : 0.01; }
function pointColor(d: object) { return `${(d as GlobeNewsPin).color}CC`; }
function pointRadius(d: object) { return (d as GlobeNewsPin).size; }

// Rings — slow breathing pulse
function ringLat(d: object) { return (d as GlobeNewsPin).lat; }
function ringLng(d: object) { return (d as GlobeNewsPin).lng; }
function ringColor(d: object) {
  const c = (d as GlobeNewsPin).color;
  return (t: number) => `${c}${Math.round((1 - t) * 255).toString(16).padStart(2, '0')}`;
}
function ringMaxRadius() { return 5; }
function ringPropagationSpeed() { return 1.0; }
function ringRepeatPeriod() { return 2500; }

// Arcs — thinner, slower dash animation
function arcStartLat(d: object) { return (d as ArcDatum).startLat; }
function arcStartLng(d: object) { return (d as ArcDatum).startLng; }
function arcEndLat(d: object) { return (d as ArcDatum).endLat; }
function arcEndLng(d: object) { return (d as ArcDatum).endLng; }
function arcColor(d: object) { return (d as ArcDatum).color; }
function arcStroke() { return 0.3; }
function arcDashLength() { return 0.4; }
function arcDashGap() { return 0.2; }
function arcDashAnimateTime() { return 3000; }

// ── Component ────────────────────────────────────────────────────────────────

const NewsGlobe: React.FC<NewsGlobeProps> = ({
  clusters,
  selectedCluster,
  onPinClick,
  onFlyTo,
}) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const altitudeRef = useRef<number>(2.3);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Resize observer — debounced so it doesn't fire on every frame during resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDimensions({ width, height });
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(el);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  // Build all pins, then limit to top 150 by importance
  const allPins = useMemo(() => buildPins(clusters), [clusters]);

  const pins = useMemo(() => {
    if (allPins.length <= MAX_VISIBLE_PINS) return allPins;
    return [...allPins]
      .sort((a, b) => b.cluster.importance - a.cluster.importance)
      .slice(0, MAX_VISIBLE_PINS);
  }, [allPins]);

  // Breaking pins get ring animations — limit to top 10 by importance
  const breakingPins = useMemo(() => {
    const breaking = pins.filter(p => p.isBreaking);
    if (breaking.length <= MAX_RING_PINS) return breaking;
    return [...breaking]
      .sort((a, b) => b.cluster.importance - a.cluster.importance)
      .slice(0, MAX_RING_PINS);
  }, [pins]);

  // Arcs from selected cluster to same-category pins (only when cluster selected)
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
        2000
      );
    }
  }, [onPinClick]);

  // External fly-to — cinematic 2s duration
  useEffect(() => {
    if (onFlyTo && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: onFlyTo.lat, lng: onFlyTo.lng, altitude: 1.5 },
        2000
      );
    }
  }, [onFlyTo]);

  // Auto-rotate: enable when no cluster selected, not interacting, and zoomed out
  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;

    const shouldRotate = !selectedCluster && !userInteracting && altitudeRef.current >= 1.8;
    controls.autoRotate = shouldRotate;
    controls.autoRotateSpeed = 0.3;
  }, [selectedCluster, userInteracting]);

  // Monitor altitude via OrbitControls 'change' event to toggle rotation on zoom
  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;

    const onCameraChange = () => {
      const pov = globeRef.current?.pointOfView?.();
      if (!pov) return;
      const prevAbove = altitudeRef.current >= 1.8;
      altitudeRef.current = pov.altitude;
      const nowAbove = pov.altitude >= 1.8;

      // Only update autoRotate when crossing the threshold
      if (prevAbove !== nowAbove) {
        const shouldRotate = !selectedCluster && !userInteracting && nowAbove;
        controls.autoRotate = shouldRotate;
      }
    };

    controls.addEventListener('change', onCameraChange);
    return () => {
      controls.removeEventListener('change', onCameraChange);
    };
  }, [selectedCluster, userInteracting]);

  // Initial camera position — slightly tilted cinematic view
  useEffect(() => {
    if (!globeRef.current) return;

    globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: 2.3 }, 0);

    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.5;
      controls.minDistance = 100;
      controls.maxDistance = 700;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;

      // Stop auto-rotate on user interaction, resume on release
      const renderer = globeRef.current.renderer();
      const domElement = renderer?.domElement;
      if (domElement) {
        const onInteractStart = () => setUserInteracting(true);
        const onInteractEnd = () => setUserInteracting(false);

        domElement.addEventListener('mousedown', onInteractStart);
        domElement.addEventListener('touchstart', onInteractStart, { passive: true });
        domElement.addEventListener('mouseup', onInteractEnd);
        domElement.addEventListener('touchend', onInteractEnd);

        // Wheel: pause rotation, resume after 1.5s idle
        let wheelTimer: ReturnType<typeof setTimeout> | undefined;
        const onWheel = () => {
          setUserInteracting(true);
          clearTimeout(wheelTimer);
          wheelTimer = setTimeout(() => setUserInteracting(false), 1500);
        };
        domElement.addEventListener('wheel', onWheel, { passive: true });

        return () => {
          domElement.removeEventListener('mousedown', onInteractStart);
          domElement.removeEventListener('touchstart', onInteractStart);
          domElement.removeEventListener('mouseup', onInteractEnd);
          domElement.removeEventListener('touchend', onInteractEnd);
          domElement.removeEventListener('wheel', onWheel);
          clearTimeout(wheelTimer);
        };
      }
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
    <Globe
      ref={globeRef}
      width={dimensions.width}
      height={dimensions.height}
      globeImageUrl="/img/earth-day.jpg"
      bumpImageUrl={GLOBE.bumpImageUrl}
      backgroundImageUrl={GLOBE.backgroundImageUrl}
      atmosphereColor="#7c5cfc"
      atmosphereAltitude={0.2}
      // Points layer — slightly translucent colored dots, merged for performance
      pointsData={pins}
      pointLat={pointLat}
      pointLng={pointLng}
      pointAltitude={pointAlt}
      pointColor={pointColor}
      pointRadius={pointRadius}
      pointsMerge={false}
      onPointClick={handlePointClick}
      // Rings layer — slow breathing pulse for breaking news (top 10 only)
      ringsData={breakingPins}
      ringLat={ringLat}
      ringLng={ringLng}
      ringColor={ringColor}
      ringMaxRadius={ringMaxRadius}
      ringPropagationSpeed={ringPropagationSpeed}
      ringRepeatPeriod={ringRepeatPeriod}
      // Arcs layer — thin, slow dash animation
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
      animateIn={false}
      waitForGlobeReady={false}
    />
    </div>
  );
};

export default NewsGlobe;
