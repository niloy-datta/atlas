"use client";

import { useState } from "react";

export interface MapPin {
  id: string;
  title: string;
  subtitle?: string;
  rate?: string;
  area: string;
  distanceKm?: number;
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  type?: "worker" | "job" | "shift";
  avatar?: string;
  rating?: number;
  badge?: string;
}

interface DhakaInteractiveMapProps {
  pins: MapPin[];
  selectedPinId?: string;
  onSelectPin?: (pin: MapPin) => void;
  heightClass?: string;
  showCommuteToggle?: boolean;
}

export default function DhakaInteractiveMap({
  pins,
  selectedPinId,
  onSelectPin,
  heightClass = "h-[420px]",
  showCommuteToggle = true,
}: DhakaInteractiveMapProps) {
  const [activePinId, setActivePinId] = useState<string>(selectedPinId || pins[0]?.id || "");
  const [showCommute, setShowCommute] = useState<boolean>(true);
  const [searchAreaChecked, setSearchAreaChecked] = useState<boolean>(true);

  const activePin = pins.find((p) => p.id === (selectedPinId || activePinId)) || pins[0];

  const handlePinClick = (pin: MapPin) => {
    setActivePinId(pin.id);
    if (onSelectPin) {
      onSelectPin(pin);
    }
  };

  // Center "You" location is Dhanmondi / City Center
  const userLocation = { x: 50, y: 55, name: "You" };

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-[#070E1A] border border-slate-800/90 shadow-2xl flex flex-col select-none`}>
      {/* Top Map Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0B1324]/90 border border-slate-700/80 backdrop-blur-md pointer-events-auto shadow-lg">
          <button
            type="button"
            className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm"
          >
            Map View
          </button>
          <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Dhaka Live
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1324]/90 border border-slate-700/80 text-xs font-medium text-slate-200 backdrop-blur-md cursor-pointer shadow-md">
            <input
              type="checkbox"
              checked={searchAreaChecked}
              onChange={(e) => setSearchAreaChecked(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600 text-blue-500 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Search this area</span>
          </label>
        </div>
      </div>

      {/* Interactive Canvas / SVG Map Background */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162238" strokeWidth="0.8" strokeOpacity="0.6" />
            </pattern>
            {/* Radar Pulse Radial */}
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
            {/* River Gradient */}
            <linearGradient id="buriganga" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1A30" />
              <stop offset="50%" stopColor="#0E2442" />
              <stop offset="100%" stopColor="#091426" />
            </linearGradient>
          </defs>

          {/* Background & Grid */}
          <rect width="1000" height="700" fill="#070E1A" />
          <rect width="1000" height="700" fill="url(#grid)" />

          {/* Stylized Dhaka Rivers (Buriganga & Turag) */}
          <path
            d="M 50 680 Q 250 630, 480 620 T 950 580"
            fill="none"
            stroke="url(#buriganga)"
            strokeWidth="38"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M 120 20 Q 200 240, 260 420 T 350 640"
            fill="none"
            stroke="#0B1C33"
            strokeWidth="24"
            opacity="0.75"
          />

          {/* Major Dhaka Transit Arteries (Mirpur Rd, Airport Rd, Pragati Sarani) */}
          <path d="M 200 100 L 450 350 L 520 620" stroke="#1F3354" strokeWidth="2.5" fill="none" strokeDasharray="6 4" />
          <path d="M 680 50 L 620 300 L 520 540" stroke="#1F3354" strokeWidth="3" fill="none" />
          <path d="M 180 340 L 780 310" stroke="#192A45" strokeWidth="2" fill="none" />
          <path d="M 320 480 Q 500 450, 750 490" stroke="#192A45" strokeWidth="2" fill="none" />

          {/* District Labels */}
          <text x="680" y="90" fill="#4B638A" fontSize="13" fontWeight="700" letterSpacing="1">UTTARA</text>
          <text x="710" y="210" fill="#3D5273" fontSize="11" fontWeight="600">AIRPORT</text>
          <text x="730" y="320" fill="#4B638A" fontSize="13" fontWeight="700" letterSpacing="1">BANANI</text>
          <text x="750" y="370" fill="#4B638A" fontSize="13" fontWeight="700" letterSpacing="1">GULSHAN</text>
          <text x="320" y="260" fill="#4B638A" fontSize="13" fontWeight="700" letterSpacing="1">MIRPUR</text>
          <text x="140" y="360" fill="#3D5273" fontSize="12" fontWeight="600">SAVAR</text>
          <text x="310" y="470" fill="#3D5273" fontSize="12" fontWeight="600">MOHAMMADPUR</text>
          <text x="430" y="520" fill="#60A5FA" fontSize="15" fontWeight="800" letterSpacing="1.5">DHANMONDI</text>
          <text x="560" y="580" fill="#93C5FD" fontSize="18" fontWeight="900" letterSpacing="2">DHAKA</text>
          <text x="820" y="540" fill="#3D5273" fontSize="12" fontWeight="600">DEMRA</text>
          <text x="320" y="650" fill="#3D5273" fontSize="12" fontWeight="600">KERANIGANJ</text>

          {/* Active Route Line connecting "You" to active pin */}
          {activePin && (
            <>
              <line
                x1={`${userLocation.x * 10}`}
                y1={`${userLocation.y * 7}`}
                x2={`${activePin.x * 10}`}
                y2={`${activePin.y * 7}`}
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                className="animate-pulse"
              />
              <circle
                cx={`${(userLocation.x * 10 + activePin.x * 10) / 2}`}
                cy={`${(userLocation.y * 7 + activePin.y * 7) / 2}`}
                r="4"
                fill="#60A5FA"
              />
            </>
          )}

          {/* "You" Radar Circle */}
          <circle
            cx={`${userLocation.x * 10}`}
            cy={`${userLocation.y * 7}`}
            r="45"
            fill="url(#radarGlow)"
          />
          <circle
            cx={`${userLocation.x * 10}`}
            cy={`${userLocation.y * 7}`}
            r="14"
            fill="#1D4ED8"
            stroke="#60A5FA"
            strokeWidth="3"
          />
          <circle
            cx={`${userLocation.x * 10}`}
            cy={`${userLocation.y * 7}`}
            r="5"
            fill="#FFFFFF"
          />
        </svg>

        {/* You Label */}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-8 pointer-events-none"
          style={{ left: `${userLocation.x}%`, top: `${userLocation.y}%` }}
        >
          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md ring-1 ring-blue-300">
            You
          </span>
        </div>

        {/* Render Map Pins */}
        {pins.map((pin) => {
          const isSelected = pin.id === activePin?.id;

          return (
            <div
              key={pin.id}
              className="absolute z-15 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 cursor-pointer group"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              onClick={() => handlePinClick(pin)}
            >
              {/* Pin Indicator */}
              <div
                className={`relative flex items-center justify-center transition-all ${
                  isSelected ? "scale-125 z-30" : "hover:scale-115"
                }`}
              >
                {/* Glowing halo */}
                <div
                  className={`absolute -inset-2 rounded-full blur-sm transition ${
                    isSelected
                      ? "bg-blue-500/80 animate-ping"
                      : "bg-emerald-500/40 group-hover:bg-blue-500/60"
                  }`}
                />

                {/* Avatar Pin or Dot Pin */}
                {pin.avatar ? (
                  <div className={`relative w-8 h-8 rounded-full overflow-hidden border-2 shadow-xl ${
                    isSelected ? "border-blue-400 ring-2 ring-blue-500" : "border-emerald-400"
                  }`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pin.avatar} alt={pin.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 ${
                      isSelected
                        ? "bg-gradient-to-tr from-blue-600 to-indigo-500 border-blue-300 ring-2 ring-blue-400"
                        : "bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300"
                    }`}
                  >
                    {pin.type === "worker" ? "👤" : "💼"}
                  </div>
                )}

                {/* Rate Tag on pin */}
                {pin.rate && (
                  <div className={`absolute -bottom-4 px-1.5 py-0.2 rounded-md text-[9px] font-extrabold whitespace-nowrap shadow-md ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900/90 text-emerald-400 border border-slate-700"
                  }`}>
                    {pin.rate}
                  </div>
                )}
              </div>

              {/* Selected Pin Tooltip / Badge */}
              {isSelected && (
                <div className="absolute left-1/2 -top-12 -translate-x-1/2 z-40 bg-[#0B1528] border border-blue-500/80 rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md whitespace-nowrap pointer-events-none flex items-center gap-2">
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{pin.title}</p>
                    <p className="text-[10px] text-blue-300 font-semibold">
                      {pin.rate} {pin.distanceKm !== undefined ? `• ${pin.distanceKm} km away` : ""}
                    </p>
                  </div>
                  <span className="text-xs">›</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Map Floating Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Active Pin Info Card */}
        {activePin && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#091122]/95 border border-slate-700/90 shadow-xl backdrop-blur-md pointer-events-auto max-w-[70%] truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0"></span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{activePin.title}</p>
              <p className="text-[11px] text-slate-300 truncate">
                {activePin.area} {activePin.distanceKm !== undefined ? `(${activePin.distanceKm} km away)` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Commute time / Map Controls */}
        <div className="flex items-center gap-2 ml-auto pointer-events-auto">
          {showCommuteToggle && (
            <button
              type="button"
              onClick={() => setShowCommute(!showCommute)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5 shadow-md ${
                showCommute
                  ? "bg-blue-600/30 border-blue-500/60 text-blue-300"
                  : "bg-slate-900/80 border-slate-700 text-slate-400"
              }`}
            >
              <span>⏱</span>
              <span className="hidden sm:inline">Commute:</span>
              <span>12 min</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center rounded-xl bg-[#0B1324]/90 border border-slate-700/80 shadow-md">
            <button
              type="button"
              className="px-2 py-1 text-slate-300 hover:text-white font-bold text-sm border-r border-slate-700"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="px-2 py-1 text-slate-300 hover:text-white font-bold text-sm"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
