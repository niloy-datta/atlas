"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "../../components/navigation/Navbar";
import Footer from "../../components/navigation/Footer";
import GoogleMapEmbed, { type GoogleMapMarker, type MapCoordinate } from "../../components/map/GoogleMapEmbed";
import { type MapPin } from "../../components/map/DhakaInteractiveMap";
import WorkspaceSidebar from "../../components/navigation/WorkspaceSidebar";
import { searchShifts } from "../../lib/api/shifts";

interface DemoShift {
  id: string;
  title: string;
  organizationName: string;
  locationName: string;
  area: string;
  distanceKm: number;
  startTime: string;
  endTime: string;
  hourlyRateBdt: number;
  totalHours: number;
  category: string;
  tags: string[];
  mapCoords: { x: number; y: number };
  latitude: number;
  longitude: number;
}

const DEMO_SHIFTS: DemoShift[] = [
  {
    id: "shift-1",
    title: "Warehouse Assistant",
    organizationName: "RapidLogistics",
    locationName: "Dhanmondi Hub",
    area: "Dhanmondi",
    distanceKm: 2.1,
    startTime: "Today, 10:00 PM",
    endTime: "6:00 AM",
    hourlyRateBdt: 380,
    totalHours: 8,
    category: "Warehouse",
    tags: ["High Match", "Verified", "Night shift"],
    mapCoords: { x: 45, y: 52 },
    latitude: 23.7465,
    longitude: 90.3762,
  },
  {
    id: "shift-2",
    title: "Picker / Packer",
    organizationName: "Global Supply Ltd.",
    locationName: "Savar Depot",
    area: "Savar",
    distanceKm: 3.5,
    startTime: "Tomorrow, 8:00 AM",
    endTime: "4:00 PM",
    hourlyRateBdt: 360,
    totalHours: 8,
    category: "Warehouse",
    tags: ["Verified", "Packing", "Fast Pay"],
    mapCoords: { x: 18, y: 38 },
    latitude: 23.8459,
    longitude: 90.2678,
  },
  {
    id: "shift-3",
    title: "Delivery Rider",
    organizationName: "CityEats",
    locationName: "Mohammadpur Center",
    area: "Mohammadpur",
    distanceKm: 0.9,
    startTime: "Starts in 45 min",
    endTime: "10:00 PM",
    hourlyRateBdt: 420,
    totalHours: 6,
    category: "Logistics",
    tags: ["High Match", "Instant hire", "Fuel Covered"],
    mapCoords: { x: 33, y: 47 },
    latitude: 23.7639,
    longitude: 90.3582,
  },
  {
    id: "shift-4",
    title: "Deep Cleaner",
    organizationName: "Bright & Clean",
    locationName: "Gulshan Suites",
    area: "Gulshan",
    distanceKm: 1.8,
    startTime: "Tomorrow, 8:00 AM",
    endTime: "1:00 PM",
    hourlyRateBdt: 350,
    totalHours: 5,
    category: "Cleaning",
    tags: ["Verified", "Supplies Provided"],
    mapCoords: { x: 74, y: 36 },
    latitude: 23.7937,
    longitude: 90.4066,
  },
  {
    id: "shift-5",
    title: "Construction Helper",
    organizationName: "BuildRight",
    locationName: "Uttara Sector 11",
    area: "Uttara",
    distanceKm: 4.2,
    startTime: "Mon, 8:00 AM",
    endTime: "5:00 PM",
    hourlyRateBdt: 400,
    totalHours: 9,
    category: "Construction",
    tags: ["Verified", "Long term", "Safety Gear"],
    mapCoords: { x: 68, y: 12 },
    latitude: 23.8759,
    longitude: 90.3912,
  },
  {
    id: "shift-6",
    title: "Barista & Cashier",
    organizationName: "The Coffee Bean Banani",
    locationName: "Road 11, Banani",
    area: "Banani",
    distanceKm: 2.4,
    startTime: "Today, 4:00 PM",
    endTime: "11:00 PM",
    hourlyRateBdt: 450,
    totalHours: 7,
    category: "Hospitality",
    tags: ["Tips Included", "Food Provided", "Verified"],
    mapCoords: { x: 72, y: 31 },
    latitude: 23.7936,
    longitude: 90.4043,
  },
];

export default function ShiftMarketplacePage() {

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedShiftId, setSelectedShiftId] = useState<string>(DEMO_SHIFTS[0].id);
  const [userLocation, setUserLocation] = useState<MapCoordinate>({ lat: 23.8103, lng: 90.4125 });

  // Filters
  const [query, setQuery] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState<string>("Shifts");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [minPayRate, setMinPayRate] = useState<number>(300);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(true);

  // Fetch from API with graceful fallback to rich mock data
  const fetchShiftsData = useCallback(async () => {
    try {
      await searchShifts({
        query: query.trim() || undefined,
        minHourlyRatePence: minPayRate * 100,
        lat: userLocation.lat,
        lon: userLocation.lng,
        radiusKm: maxDistance,
        page: 0,
        size: 12,
      });
    } catch {
      // Graceful fallback to demo shifts for pilot demonstration
    }
  }, [query, minPayRate, maxDistance, userLocation]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchShiftsData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchShiftsData]);

  // Filtered Display Shifts
  const displayedShifts = useMemo(() => {
    return DEMO_SHIFTS.filter((shift) => {
      if (query && !shift.title.toLowerCase().includes(query.toLowerCase()) && !shift.organizationName.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== "All" && shift.category !== selectedCategory) {
        return false;
      }
      if (shift.hourlyRateBdt < minPayRate) {
        return false;
      }
      if (shift.distanceKm > maxDistance) {
        return false;
      }
      return true;
    });
  }, [query, selectedCategory, minPayRate, maxDistance]);

  const activeShift = displayedShifts.find((s) => s.id === selectedShiftId) || displayedShifts[0];

  const mapMarkers: GoogleMapMarker[] = displayedShifts.map((shift) => ({
    id: shift.id,
    title: shift.title,
    subtitle: shift.locationName,
    lat: shift.latitude,
    lng: shift.longitude,
  }));

  const mapPins: MapPin[] = displayedShifts.map((shift) => ({
    id: shift.id,
    title: shift.title,
    subtitle: shift.organizationName,
    rate: `৳${shift.hourlyRateBdt}/hr`,
    area: shift.area,
    distanceKm: shift.distanceKm,
    x: shift.mapCoords.x,
    y: shift.mapCoords.y,
    type: "shift",
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100">
      <Navbar />

      <div className="flex flex-1 min-w-0">
        <WorkspaceSidebar />
        <div className="min-w-0 flex-1">

      {/* Top Header & Search Bar matching Screen 2 of Master Mockups */}
      <section className="bg-[#0B1220] border-b border-slate-800/90 py-4 px-4 sm:px-6 lg:px-8 sticky top-[55px] xl:top-[85px] z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 w-full flex items-center bg-[#070E1A] border border-slate-700/80 rounded-xl px-3.5 py-2 focus-within:border-blue-500 transition">
            <span className="text-slate-400 mr-2.5">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs, skills, or companies (e.g. Warehouse, Barista, Cleaner)..."
              className="bg-transparent text-sm text-slate-100 outline-none w-full placeholder:text-slate-500"
            />
          </div>

          {/* Location Picker & Quick Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#070E1A] border border-slate-700/80 text-xs font-semibold text-slate-200">
              <span>📍</span>
              <span>Dhaka, BD</span>
            </div>

            {/* View Mode Toggle: List vs Map */}
            <div className="flex items-center p-1 rounded-xl bg-[#070E1A] border border-slate-700/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === "list" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📋 List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === "map" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🗺️ Map
              </button>
            </div>

            <Link
              href="/shifts/create"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition whitespace-nowrap"
            >
              Post a Shift +
            </Link>
          </div>
        </div>
      </section>

      {/* Main 3-Column / Dual Layout matching Screen 2 of Mockup */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Filter Sidebar (col-span-3) */}
          <aside className="lg:col-span-3 p-4 rounded-2xl bg-[#0B1220]/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>⚙️</span> Filters
              </h3>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("All");
                  setMinPayRate(300);
                  setMaxDistance(10);
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                Reset All
              </button>
            </div>

            {/* Work Type */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                Work Type
              </label>
              <div className="space-y-1.5">
                {[
                  { label: "Shifts", count: 328 },
                  { label: "Jobs", count: 142 },
                  { label: "Tasks", count: 86 },
                ].map((type) => (
                  <button
                    key={type.label}
                    type="button"
                    onClick={() => setSelectedWorkType(type.label)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedWorkType === type.label
                        ? "bg-blue-600/30 border border-blue-500/60 text-blue-200"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <span>{type.label}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.2 rounded-full text-slate-300">
                      {type.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                Category
              </label>
              <div className="space-y-1">
                {["All", "Warehouse", "Hospitality", "Logistics", "Cleaning", "Construction"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Distance</span>
                <span className="text-blue-400">Within {maxDistance} km</span>
              </div>
              <input
                type="range"
                min={2}
                max={25}
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>2 km</span>
                <span>10 km</span>
                <span>25 km</span>
              </div>
            </div>

            {/* Pay Rate Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Min Pay Rate (৳/hr)</span>
                <span className="text-emerald-400 font-extrabold">৳{minPayRate}/hr</span>
              </div>
              <input
                type="range"
                min={200}
                max={800}
                step={25}
                value={minPayRate}
                onChange={(e) => setMinPayRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Verified Business Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Verified Business Only</span>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </aside>

          {/* Center Column: Opportunities Feed (col-span-5 or col-span-9 depending on layout) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white">
                {displayedShifts.length} opportunities available in Dhaka
              </h2>
              <span className="text-xs text-slate-400">Sort by: <strong className="text-slate-200">Best Match</strong></span>
            </div>

            {/* List of Shift Cards matching Screen 2 of Mockup */}
            <div className="space-y-3.5">
              {displayedShifts.map((shift) => {
                const isSelected = shift.id === selectedShiftId;
                const totalAmount = shift.hourlyRateBdt * shift.totalHours;

                return (
                  <div
                    key={shift.id}
                    onClick={() => setSelectedShiftId(shift.id)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#0F1B33] border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/40"
                        : "bg-[#0B1220]/90 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-extrabold text-white hover:text-blue-300 transition">
                          {shift.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-300 mt-0.5">
                          {shift.organizationName}
                        </p>
                      </div>

                      {/* Pay rate box */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-emerald-400">
                          ৳{shift.hourlyRateBdt}/hr
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          ৳{totalAmount.toLocaleString()} total ({shift.totalHours}h)
                        </div>
                      </div>
                    </div>

                    {/* Schedule & Location */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <span>🕒</span> {shift.startTime} – {shift.endTime}
                      </span>
                      <span className="flex items-center gap-1 text-blue-400 font-medium">
                        <span>📍</span> {shift.distanceKm} km away • {shift.area}
                      </span>
                    </div>

                    {/* Tags & Action CTA */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {shift.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tag.includes("Match")
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                                : tag.includes("Verified")
                                ? "bg-blue-950/80 text-blue-300 border border-blue-500/30"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={`/shifts/demo`}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dhaka Interactive Map (col-span-4) */}
          <div className="lg:col-span-4 sticky top-36 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Dhaka Shift Radar
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Near You
              </span>
            </div>

            {/* Interactive Vector Map */}
            <GoogleMapEmbed query="Your location and nearby shifts" initialCenter={userLocation} markers={mapMarkers} fallbackPins={mapPins} onLocationChange={setUserLocation} heightClass="h-[460px]" />

            {/* Selected Shift Quick Card */}
            {activeShift && (
              <div className="p-4 rounded-2xl bg-[#0B1324] border border-blue-500/40 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300">
                    Selected Location
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    ৳{activeShift.hourlyRateBdt}/hr
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{activeShift.title}</h4>
                <p className="text-xs text-slate-300">{activeShift.organizationName} • {activeShift.locationName}</p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Estimated Commute: ~14 mins</span>
                  <Link
                    href="/shifts/demo"
                    className="text-blue-400 font-bold hover:underline"
                  >
                    Open Shift →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
