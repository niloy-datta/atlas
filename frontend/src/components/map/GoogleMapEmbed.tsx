"use client";

import { useEffect, useRef, useState } from "react";
import DhakaInteractiveMap, { type MapPin } from "./DhakaInteractiveMap";

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface GoogleMapMarker extends MapCoordinate {
  id: string;
  title: string;
  subtitle?: string;
  label?: string;
}

interface GoogleMapInstance {
  setCenter: (center: MapCoordinate) => void;
  setZoom: (zoom: number) => void;
}

interface GoogleMapMarkerInstance {
  setMap: (map: GoogleMapInstance | null) => void;
}

interface MapsApi {
  maps: {
    Map: new (element: HTMLElement, options: { center: MapCoordinate; zoom: number; [key: string]: unknown }) => GoogleMapInstance;
    Marker: new (options: { map: GoogleMapInstance; position: MapCoordinate; title: string }) => GoogleMapMarkerInstance;
  };
}

interface GoogleWindow extends Window {
  google?: MapsApi;
}

interface LeafletLayer {
  addTo: (map: LeafletMapInstance) => LeafletLayer;
}

interface LeafletMarker {
  addTo: (map: LeafletMapInstance) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
  remove: () => void;
}

interface LeafletMapInstance {
  setView: (center: [number, number], zoom: number) => LeafletMapInstance;
}

interface LeafletApi {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMapInstance;
  tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
  circleMarker: (center: [number, number], options: Record<string, unknown>) => LeafletMarker;
}

interface LeafletWindow extends Window {
  L?: LeafletApi;
}

interface GoogleMapEmbedProps {
  query?: string;
  heightClass?: string;
  initialCenter?: MapCoordinate;
  markers?: GoogleMapMarker[];
  fallbackPins?: MapPin[];
  onLocationChange?: (location: MapCoordinate) => void;
}

const DEFAULT_CENTER: MapCoordinate = { lat: 23.8103, lng: 90.4125 };
const GOOGLE_SCRIPT_ID = "worvo-google-maps-js";
const LEAFLET_SCRIPT_ID = "worvo-openstreetmap-leaflet-js";
const LEAFLET_STYLE_ID = "worvo-openstreetmap-leaflet-css";

function loadGoogleMaps(apiKey: string): Promise<MapsApi> {
  const googleWindow = window as GoogleWindow;
  if (googleWindow.google?.maps) return Promise.resolve(googleWindow.google);

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript || document.createElement("script");
    const handleLoad = () => {
      if (googleWindow.google?.maps) resolve(googleWindow.google);
      else reject(new Error("Google Maps loaded without the Maps API."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });

    if (!existingScript) {
      script.id = GOOGLE_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
      document.head.appendChild(script);
    }
  });
}

function loadLeaflet(): Promise<LeafletApi> {
  const leafletWindow = window as LeafletWindow;
  if (leafletWindow.L) return Promise.resolve(leafletWindow.L);

  return new Promise((resolve, reject) => {
    if (!document.getElementById(LEAFLET_STYLE_ID)) {
      const stylesheet = document.createElement("link");
      stylesheet.id = LEAFLET_STYLE_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(stylesheet);
    }

    const existingScript = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript || document.createElement("script");
    const handleLoad = () => {
      if (leafletWindow.L) resolve(leafletWindow.L);
      else reject(new Error("OpenStreetMap loaded without Leaflet."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () => reject(new Error("OpenStreetMap failed to load.")), { once: true });

    if (!existingScript) {
      script.id = LEAFLET_SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(script);
    }
  });
}

function toLeafletCenter(location: MapCoordinate): [number, number] {
  return [location.lat, location.lng];
}

export default function GoogleMapEmbed({
  query = "Dhaka, Bangladesh",
  heightClass = "h-[420px]",
  initialCenter = DEFAULT_CENTER,
  markers = [],
  fallbackPins = [],
  onLocationChange,
}: GoogleMapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleElementRef = useRef<HTMLDivElement>(null);
  const leafletElementRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<GoogleMapInstance | null>(null);
  const leafletMapRef = useRef<LeafletMapInstance | null>(null);
  const googleMarkerRefs = useRef<GoogleMapMarkerInstance[]>([]);
  const leafletMarkerRefs = useRef<LeafletMarker[]>([]);
  const [mapsApi, setMapsApi] = useState<MapsApi | null>(null);
  const [leafletApi, setLeafletApi] = useState<LeafletApi | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapLoadError, setMapLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadFreeMap = () => {
      void loadLeaflet()
        .then((loadedApi) => {
          if (!cancelled) setLeafletApi(loadedApi);
        })
        .catch(() => {
          if (!cancelled) setMapLoadError(true);
        });
    };

    if (apiKey) {
      void loadGoogleMaps(apiKey)
        .then((loadedApi) => {
          if (!cancelled) setMapsApi(loadedApi);
        })
        .catch(loadFreeMap);
    } else {
      loadFreeMap();
    }

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapsApi || !googleElementRef.current || googleMapRef.current) return;
    let savedCenter = initialCenter;
    try {
      const savedLocation = window.localStorage.getItem("worvo-user-location");
      if (savedLocation) savedCenter = JSON.parse(savedLocation) as MapCoordinate;
    } catch {
      // Ignore malformed local location data and use the default center.
    }

    googleMapRef.current = new mapsApi.maps.Map(googleElementRef.current, {
      center: savedCenter,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      clickableIcons: true,
    });
    if (savedCenter !== initialCenter) onLocationChange?.(savedCenter);
  }, [initialCenter, mapsApi, onLocationChange]);

  useEffect(() => {
    if (!leafletApi || mapsApi || !leafletElementRef.current || leafletMapRef.current) return;
    let savedCenter = initialCenter;
    try {
      const savedLocation = window.localStorage.getItem("worvo-user-location");
      if (savedLocation) savedCenter = JSON.parse(savedLocation) as MapCoordinate;
    } catch {
      // Ignore malformed local location data and use the default center.
    }

    const map = leafletApi.map(leafletElementRef.current, { zoomControl: true, attributionControl: true });
    map.setView(toLeafletCenter(savedCenter), 12);
    leafletApi.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    leafletMapRef.current = map;
    if (savedCenter !== initialCenter) onLocationChange?.(savedCenter);
  }, [initialCenter, leafletApi, mapsApi, onLocationChange]);

  useEffect(() => {
    const handleLocationChange = (event: Event) => {
      const location = (event as CustomEvent<MapCoordinate>).detail;
      if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") return;
      googleMapRef.current?.setCenter(location);
      googleMapRef.current?.setZoom(13);
      leafletMapRef.current?.setView(toLeafletCenter(location), 13);
      onLocationChange?.(location);
    };

    window.addEventListener("worvo-location-change", handleLocationChange);
    return () => window.removeEventListener("worvo-location-change", handleLocationChange);
  }, [onLocationChange]);

  useEffect(() => {
    if (!mapsApi || !googleMapRef.current) return;
    googleMarkerRefs.current.forEach((marker) => marker.setMap(null));
    googleMarkerRefs.current = markers.map((marker) => new mapsApi.maps.Marker({
      map: googleMapRef.current as GoogleMapInstance,
      position: { lat: marker.lat, lng: marker.lng },
      title: marker.subtitle ? `${marker.title} · ${marker.subtitle}` : marker.title,
    }));
  }, [markers, mapsApi]);

  useEffect(() => {
    if (!leafletApi || mapsApi || !leafletMapRef.current) return;
    leafletMarkerRefs.current.forEach((marker) => marker.remove());
    leafletMarkerRefs.current = markers.map((marker) => leafletApi.circleMarker(toLeafletCenter(marker), {
      radius: 9,
      color: "#dbeafe",
      weight: 2,
      fillColor: "#2563eb",
      fillOpacity: 0.95,
    }).addTo(leafletMapRef.current as LeafletMapInstance).bindPopup(
      `<strong>${marker.title}</strong>${marker.subtitle ? `<br />${marker.subtitle}` : ""}`,
    ));
  }, [leafletApi, mapsApi, markers]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        googleMapRef.current?.setCenter(location);
        googleMapRef.current?.setZoom(13);
        leafletMapRef.current?.setView(toLeafletCenter(location), 13);
        onLocationChange?.(location);
        setLocationLoading(false);
      },
      () => {
        setLocationError("Location permission was not granted. Enable location and try again.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  if (mapLoadError && !mapsApi && !leafletApi) {
    return (
      <div className="relative">
        <DhakaInteractiveMap pins={fallbackPins} heightClass={heightClass} />
        <div className="absolute right-3 top-3 z-20 rounded-xl border border-amber-400/30 bg-[#0B1324]/95 px-3 py-2 text-xs font-bold text-amber-200 shadow-lg">
          Free map is unavailable right now
        </div>
      </div>
    );
  }

  const isFreeMap = Boolean(leafletApi && !mapsApi);
  const mapLabel = isFreeMap ? "OpenStreetMap" : "Google Maps";

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0B1324] shadow-2xl`}>
      {!mapsApi && !leafletApi && <div className="grid h-full place-items-center text-sm text-slate-400">Loading free map…</div>}
      <div ref={googleElementRef} className={`${mapsApi ? "block" : "hidden"} h-full w-full`} aria-label={`${mapLabel} of ${query}`} />
      <div ref={leafletElementRef} className={`${isFreeMap ? "block" : "hidden"} h-full w-full`} aria-label={`${mapLabel} of ${query}`} />
      {(mapsApi || leafletApi) && (
        <>
          <div className="absolute left-3 top-3 rounded-xl border border-slate-700/80 bg-[#0B1324]/90 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle shadow-[0_0_10px_#34d399]" />
            {mapLabel} · {query}
          </div>
          <div className="absolute right-3 top-3 z-[500] flex flex-col items-end gap-1.5">
            <button type="button" onClick={useMyLocation} className="rounded-xl border border-slate-700/80 bg-[#0B1324]/95 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:bg-blue-600">
              {locationLoading ? "Locating…" : "Use my location"}
            </button>
            {locationError && <span className="max-w-56 rounded-lg bg-red-950/90 px-2 py-1 text-right text-[10px] text-red-200">{locationError}</span>}
          </div>
        </>
      )}
    </div>
  );
}
