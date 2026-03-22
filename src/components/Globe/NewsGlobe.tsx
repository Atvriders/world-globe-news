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
  lowPerf?: boolean;
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
    .filter(c => c.location && typeof c.location.lat === 'number' && typeof c.location.lng === 'number')
    .map(c => {
      // Size based on source count: more sources = bigger pin (range 0.35–0.85)
      const sourceCount = c.articles.length;
      const sizeFactor = Math.min(sourceCount / 8, 1); // normalize to 0–1
      const baseSize = 0.35 + sizeFactor * 0.5; // 0.35 to 0.85
      const size = c.isBreaking ? Math.max(baseSize, 0.7) : baseSize;

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
  if (
    !selectedCluster ||
    !selectedCluster.location ||
    typeof selectedCluster.location.lat !== 'number' ||
    typeof selectedCluster.location.lng !== 'number'
  ) return [];

  const loc = selectedCluster.location;
  const category = selectedCluster.category as NewsCategory;
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.world;
  const arcColor = `${color}3A`; // softer opacity for ethereal arcs

  return pins
    .filter(
      p => p.category === category && p.cluster.id !== selectedCluster.id && typeof p.lat === 'number' && typeof p.lng === 'number'
    )
    .map(p => ({
      startLat: loc.lat,
      startLng: loc.lng,
      endLat: p.lat,
      endLng: p.lng,
      color: arcColor,
    }));
}

// ── Module-level accessor functions (no inline closures for GlobeGL) ─────────

// Points — soft translucent glow (BB = 73% alpha for gentle holographic feel)
function pointLat(d: object) { return (d as GlobeNewsPin).lat; }
function pointLng(d: object) { return (d as GlobeNewsPin).lng; }
function pointAlt(d: object) { return (d as GlobeNewsPin).isBreaking ? 0.06 : 0.02; }
function pointColor(d: object) { return `${(d as GlobeNewsPin).color}BB`; }
function pointRadius(d: object) { return (d as GlobeNewsPin).size; }

// Rings — dreamy slow breathing pulse
function ringLat(d: object) { return (d as GlobeNewsPin).lat; }
function ringLng(d: object) { return (d as GlobeNewsPin).lng; }
function ringColor(d: object) {
  const c = (d as GlobeNewsPin).color;
  // Softer opacity fade for dreamier rings
  return (t: number) => `${c}${Math.round((1 - t) * (1 - t) * 200).toString(16).padStart(2, '0')}`;
}
function ringMaxRadius() { return 6; }
function ringPropagationSpeed() { return 0.8; }
function ringRepeatPeriod() { return 3000; }

// Arcs — ethereal, thin, slow flowing
function arcStartLat(d: object) { return (d as ArcDatum).startLat; }
function arcStartLng(d: object) { return (d as ArcDatum).startLng; }
function arcEndLat(d: object) { return (d as ArcDatum).endLat; }
function arcEndLng(d: object) { return (d as ArcDatum).endLng; }
function arcColor(d: object) { return (d as ArcDatum).color; }
function arcStroke() { return 0.2; }
function arcDashLength() { return 0.4; }
function arcDashGap() { return 0.2; }
function arcDashAnimateTime() { return 4000; }
function arcAltitude() { return 0.15; }

// ── Component ────────────────────────────────────────────────────────────────

const MAX_VISIBLE_PINS_LOW = 50;

const NewsGlobe: React.FC<NewsGlobeProps> = ({
  clusters,
  selectedCluster,
  onPinClick,
  onFlyTo,
  lowPerf = false,
}) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const altitudeRef = useRef<number>(2.5);
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

  const pinLimit = lowPerf ? MAX_VISIBLE_PINS_LOW : MAX_VISIBLE_PINS;

  const pins = useMemo(() => {
    if (allPins.length <= pinLimit) return allPins;
    return [...allPins]
      .sort((a, b) => b.cluster.importance - a.cluster.importance)
      .slice(0, pinLimit);
  }, [allPins, pinLimit]);

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
        2500
      );
    }
  }, [onPinClick]);

  // External fly-to — cinematic 2.5s duration
  useEffect(() => {
    if (onFlyTo && globeRef.current) {
      globeRef.current.pointOfView(
        { lat: onFlyTo.lat, lng: onFlyTo.lng, altitude: 1.5 },
        2500
      );
    }
  }, [onFlyTo]);

  // Auto-rotate: enable when no cluster selected, not interacting, and zoomed out
  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;

    const shouldRotate = !lowPerf && !selectedCluster && !userInteracting && altitudeRef.current >= 1.8;
    controls.autoRotate = shouldRotate;
    controls.autoRotateSpeed = 0.15;
  }, [selectedCluster, userInteracting, lowPerf]);

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
        const shouldRotate = !lowPerf && !selectedCluster && !userInteracting && nowAbove;
        controls.autoRotate = shouldRotate;
      }
    };

    controls.addEventListener('change', onCameraChange);
    return () => {
      controls.removeEventListener('change', onCameraChange);
    };
  }, [selectedCluster, userInteracting, lowPerf]);

  // Initial camera position — slightly tilted cinematic view, more zoomed out for grandeur
  useEffect(() => {
    if (!globeRef.current) return;

    globeRef.current.pointOfView({ lat: 20, lng: 30, altitude: 2.5 }, 0);

    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.15;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.4;
      controls.minDistance = 100;
      controls.maxDistance = 700;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

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
      globeImageUrl="/img/earth-blue-marble.jpg"
      bumpImageUrl={lowPerf ? undefined : GLOBE.bumpImageUrl}
      backgroundImageUrl={GLOBE.backgroundImageUrl}
      atmosphereColor="#6366f1"
      atmosphereAltitude={lowPerf ? 0 : 0.35}
      showGraticules={!lowPerf}
      // @ts-ignore — react-globe.gl supports this but types may lag
      globeMaterial={undefined}
      // Points layer — soft holographic glow dots, floating slightly above surface
      pointsData={pins}
      pointLat={pointLat}
      pointLng={pointLng}
      pointAltitude={pointAlt}
      pointColor={pointColor}
      pointRadius={pointRadius}
      pointsMerge={false}
      onPointClick={handlePointClick}
      // Rings layer — dreamy slow breathing pulse for breaking news (top 10 only)
      ringsData={lowPerf ? [] : breakingPins}
      ringLat={ringLat}
      ringLng={ringLng}
      ringColor={ringColor}
      ringMaxRadius={ringMaxRadius}
      ringPropagationSpeed={ringPropagationSpeed}
      ringRepeatPeriod={ringRepeatPeriod}
      // Arcs layer — ethereal, thin, slow flowing with gentle curve
      arcsData={lowPerf ? [] : arcs}
      arcStartLat={arcStartLat}
      arcStartLng={arcStartLng}
      arcEndLat={arcEndLat}
      arcEndLng={arcEndLng}
      arcColor={arcColor}
      arcStroke={arcStroke}
      arcDashLength={arcDashLength}
      arcDashGap={arcDashGap}
      arcDashAnimateTime={arcDashAnimateTime}
      arcAltitude={arcAltitude}
      // Performance
      animateIn={false}
      waitForGlobeReady={false}
    />
    </div>
  );
};

export default NewsGlobe;
