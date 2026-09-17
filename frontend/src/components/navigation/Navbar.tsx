"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import MobileNavDrawer from "./MobileNavDrawer";

type CityOption = { city: string; country: string };
type LocationGroup = { label: string; locations: CityOption[] };

const cities = (country: string, names: string[]): CityOption[] => names.map((city) => ({ city, country }));

const LOCATION_GROUPS: LocationGroup[] = [
  {
    label: "Priority markets · Japan & Korea first",
    locations: [
      ...cities("Japan", ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Hiroshima", "Sendai", "Naha"]),
      ...cities("South Korea", ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Ulsan", "Suwon", "Jeju City"]),
      ...cities("Canada", ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Winnipeg", "Quebec City", "Halifax", "Victoria"]),
      ...cities("Australia", ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra", "Gold Coast", "Newcastle", "Wollongong", "Hobart", "Darwin"]),
      ...cities("Singapore", ["Singapore"]),
      ...cities("Switzerland", ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Lucerne", "Lugano", "St. Gallen"]),
      ...cities("Norway", ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromso", "Drammen"]),
      ...cities("Denmark", ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg"]),
      ...cities("Sweden", ["Stockholm", "Gothenburg", "Malmo", "Uppsala", "Linkoping", "Orebro", "Helsingborg", "Vasteras"]),
      ...cities("Finland", ["Helsinki", "Espoo", "Tampere", "Turku", "Oulu", "Vantaa"]),
      ...cities("Netherlands", ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Breda"]),
      ...cities("Germany", ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Dusseldorf", "Leipzig", "Dortmund", "Dresden", "Nuremberg", "Hanover"]),
      ...cities("United Kingdom", ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Liverpool", "Bristol", "Leeds", "Cardiff", "Belfast", "Nottingham", "Southampton"]),
      ...cities("France", ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Bordeaux", "Lille", "Nantes", "Strasbourg", "Montpellier", "Rennes", "Grenoble"]),
      ...cities("Ireland", ["Dublin", "Cork", "Limerick", "Galway", "Waterford"]),
      ...cities("Austria", ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck"]),
      ...cities("Belgium", ["Brussels", "Antwerp", "Ghent", "Bruges", "Leuven"]),
      ...cities("Italy", ["Rome", "Milan", "Naples", "Turin", "Palermo", "Bologna", "Florence", "Venice", "Genoa", "Bari", "Verona"]),
      ...cities("Spain", ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Bilbao", "Alicante", "Zaragoza", "Murcia", "Palma"]),
      ...cities("Portugal", ["Lisbon", "Porto", "Braga", "Coimbra", "Faro", "Aveiro"]),
      ...cities("Luxembourg", ["Luxembourg City", "Esch-sur-Alzette", "Differdange"]),
    ],
  },
  {
    label: "Bangladesh",
    locations: cities("Bangladesh", ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Rangpur", "Mymensingh", "Cox's Bazar"]),
  },
  {
    label: "Europe · more cities",
    locations: [
      ...cities("Albania", ["Tirana", "Durres", "Vlore"]),
      ...cities("Andorra", ["Andorra la Vella"]),
      ...cities("Belarus", ["Minsk", "Brest", "Grodno", "Gomel"]),
      ...cities("Bosnia and Herzegovina", ["Sarajevo", "Banja Luka", "Mostar", "Tuzla"]),
      ...cities("Bulgaria", ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse"]),
      ...cities("Croatia", ["Zagreb", "Split", "Rijeka", "Dubrovnik", "Osijek"]),
      ...cities("Cyprus", ["Nicosia", "Limassol", "Larnaca", "Paphos"]),
      ...cities("Czechia", ["Prague", "Brno", "Ostrava", "Plzen", "Liberec"]),
      ...cities("Estonia", ["Tallinn", "Tartu", "Parnu", "Narva"]),
      ...cities("Greece", ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"]),
      ...cities("Hungary", ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pecs"]),
      ...cities("Iceland", ["Reykjavik", "Akureyri", "Kopavogur"]),
      ...cities("Kosovo", ["Pristina", "Prizren", "Peja", "Ferizaj"]),
      ...cities("Latvia", ["Riga", "Daugavpils", "Liepaja", "Jelgava"]),
      ...cities("Liechtenstein", ["Vaduz", "Schaan"]),
      ...cities("Lithuania", ["Vilnius", "Kaunas", "Klaipeda", "Siauliai", "Panevezys"]),
      ...cities("Malta", ["Valletta", "Birkirkara", "Sliema", "St. Julian's"]),
      ...cities("Moldova", ["Chisinau", "Balti", "Bender"]),
      ...cities("Monaco", ["Monaco"]),
      ...cities("Montenegro", ["Podgorica", "Budva", "Niksic", "Bar", "Kotor"]),
      ...cities("North Macedonia", ["Skopje", "Bitola", "Ohrid", "Kumanovo"]),
      ...cities("Poland", ["Warsaw", "Krakow", "Wroclaw", "Poznan", "Gdansk", "Lodz", "Katowice", "Lublin", "Szczecin"]),
      ...cities("Romania", ["Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Constanta", "Brasov", "Sibiu"]),
      ...cities("Russia", ["Moscow", "Saint Petersburg", "Kazan", "Novosibirsk", "Yekaterinburg", "Nizhny Novgorod", "Sochi"]),
      ...cities("San Marino", ["San Marino"]),
      ...cities("Serbia", ["Belgrade", "Novi Sad", "Nis", "Kragujevac", "Subotica"]),
      ...cities("Slovakia", ["Bratislava", "Kosice", "Presov", "Zilina", "Nitra"]),
      ...cities("Slovenia", ["Ljubljana", "Maribor", "Koper", "Celje"]),
      ...cities("Turkey", ["Istanbul", "Ankara", "Izmir", "Antalya", "Bursa", "Adana", "Gaziantep", "Konya"]),
      ...cities("Ukraine", ["Kyiv", "Lviv", "Odesa", "Kharkiv", "Dnipro", "Vinnytsia", "Poltava"]),
      ...cities("Vatican City", ["Vatican City"]),
    ],
  },
  {
    label: "Asia-Pacific · China, Indonesia & Malaysia",
    locations: [
      ...cities("China", ["Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu", "Hangzhou", "Wuhan", "Nanjing", "Xiamen", "Qingdao", "Chongqing", "Hong Kong"]),
      ...cities("Indonesia", ["Jakarta", "Surabaya", "Bandung", "Medan", "Denpasar", "Makassar", "Yogyakarta", "Semarang"]),
      ...cities("Malaysia", ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Kota Kinabalu", "Malacca City", "Kuching", "Shah Alam"]),
    ],
  },
];

export default function Navbar() {
  const { firebaseUser, atlasUser, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Dhaka, BD");

  const isEmployer = atlasUser?.roles?.some((r) => r.includes("EMPLOYER"));
  const dashboardHref = isEmployer ? "/dashboard/employer" : "/dashboard/worker";
  const workspaceRoutes = ["/dashboard", "/shifts", "/jobs", "/hire", "/my-shifts", "/messages", "/earnings", "/services", "/workers", "/workpass", "/skills", "/settings"];
  const isWorkspace = workspaceRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const navLinkClass = (href: string, extra = "") =>
    `nav-link ${pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "active text-white" : ""} ${extra}`;

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const location = { lat: coords.latitude, lng: coords.longitude };
      setSelectedLocation("My location");
      setLocationOpen(false);
      window.localStorage.setItem("worvo-user-location", JSON.stringify(location));
      window.dispatchEvent(new CustomEvent("worvo-location-change", { detail: location }));
    });
  };

  const normalizedLocationSearch = locationSearch.trim().toLowerCase();
  const filteredLocationGroups = LOCATION_GROUPS.map((group) => ({
    ...group,
    locations: group.locations.filter((location) =>
      !normalizedLocationSearch
      || `${location.city} ${location.country}`.toLowerCase().includes(normalizedLocationSearch),
    ),
  })).filter((group) => group.locations.length > 0);

  return (
    <>
      <header className={`navbar ${isWorkspace ? "workspace-navbar" : ""}`} role="banner">
        <div className="nav-container">
          <div className="nav-left">
            {/* Logo matching master mockups */}
            <Link href="/" className="brand-logo" aria-label="WORVO by SkillHub Home">
              <svg className="logo-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="10" cy="16" r="6" fill="#3B82F6" />
                <circle cx="22" cy="10" r="4" fill="#8B5CF6" />
                <circle cx="22" cy="22" r="4" fill="#10B981" />
                <line x1="14.5" y1="13.5" x2="18.5" y2="11.5" stroke="#60A5FA" strokeWidth="2" />
                <line x1="14.5" y1="18.5" x2="18.5" y2="20.5" stroke="#34D399" strokeWidth="2" />
              </svg>
              <span className="logo-text font-extrabold tracking-tight">
                WORVO <span className="text-xs font-normal text-slate-400">by SkillHub</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden min-[1100px]:flex items-center gap-2 xl:gap-4 2xl:gap-5" aria-label="Primary navigation">
              <Link href="/shifts" className={navLinkClass("/shifts")}>
                Find Shifts
              </Link>
              <Link href="/jobs" className={navLinkClass("/jobs")}>
                Jobs
              </Link>
              <Link href="/hire" className={navLinkClass("/hire")}>
                Hire People
              </Link>
              <Link href="/my-shifts" className={navLinkClass("/my-shifts", "flex items-center gap-1.5")}>
                <span>My Shifts</span>
              </Link>
              <Link href="/messages" className={navLinkClass("/messages", "flex items-center gap-1.5")}>
                <span>Messages</span>
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
                  3
                </span>
              </Link>
              <Link href="/earnings" className={navLinkClass("/earnings")}>
                Earnings
              </Link>
              <Link href="/services" className={navLinkClass("/services")}>
                Local Help
              </Link>
              <Link href="/workers" className={navLinkClass("/workers")}>
                Workers
              </Link>
              <Link href="/workpass" className={navLinkClass("/workpass")}>
                WorkPass
              </Link>
            </nav>
          </div>

          <div className="nav-right">
            {/* Dhaka Location Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocationOpen(!locationOpen)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-slate-300 transition"
                title="Select Operating Location"
              >
                <span className="dot-green" aria-hidden="true" />
                <span>{selectedLocation}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {locationOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 max-h-[520px] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-700 bg-[#0B1426] p-1.5 shadow-2xl">
                  <button type="button" onClick={useMyLocation} className="mb-1 w-full rounded-lg border border-blue-500/40 bg-blue-600/20 px-2.5 py-2 text-left text-xs font-bold text-blue-200 hover:bg-blue-600 hover:text-white">
                    📍 Use my current location
                  </button>
                  <input
                    value={locationSearch}
                    onChange={(event) => setLocationSearch(event.target.value)}
                    placeholder="Search city or country..."
                    aria-label="Search city or country"
                    className="mb-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                  />
                  {filteredLocationGroups.length === 0 && <p className="px-2.5 py-3 text-xs text-slate-400">No city found.</p>}
                  {filteredLocationGroups.map((group) => (
                    <div key={group.label}>
                      <div className="sticky top-0 z-10 bg-[#0B1426] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.label}</div>
                      {group.locations.map((location) => (
                        <button
                          key={`${location.country}-${location.city}`}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(`${location.city}, ${location.country}`);
                            setLocationSearch("");
                            setLocationOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-200 transition hover:bg-blue-600 hover:text-white"
                        >
                          <span>🌐 {location.city}</span>
                          <span className="ml-2 text-[10px] text-slate-500 group-hover:text-blue-100">{location.country}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell with Badge */}
            <Link
              href="/messages"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition hidden sm:flex"
              aria-label="3 notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                3
              </span>
            </Link>

            {/* Desktop Auth Controls */}
            <div className="hidden xl:flex items-center gap-3">
              {firebaseUser ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="px-3.5 py-1.5 bg-blue-900/50 border border-blue-500/40 text-blue-300 hover:bg-blue-800/60 rounded-full text-xs font-bold transition-colors shadow-sm"
                  >
                    Go to Dashboard →
                  </Link>

                  <div className="user-badge" data-testid="user-profile-badge">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0">
                      {(firebaseUser.displayName || firebaseUser.email || "U")[0].toUpperCase()}
                    </span>
                    <span className="max-w-[130px] truncate text-xs text-slate-200">
                      {firebaseUser.displayName || atlasUser?.email || firebaseUser.email}
                    </span>
                    {atlasUser?.roles?.[0] && (
                      <span className="role-tag">{atlasUser.roles[0].replace("ROLE_", "")}</span>
                    )}
                  </div>

                  <button
                    onClick={() => signOut()}
                    className="btn-text text-xs text-slate-400 hover:text-white"
                    data-testid="logout-button"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-text">
                    Log in
                  </Link>
                  <Link href="/register" className="btn-primary text-xs font-bold">
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="min-[1100px]:hidden p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-slate-200 hover:text-white hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Drawer */}
      <MobileNavDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
