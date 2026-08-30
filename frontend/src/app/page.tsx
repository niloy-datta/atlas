import { ATLAS_API_URL } from "@/lib/config";

const foundationItems = [
  "Spring Boot API boundary",
  "PostgreSQL and PostGIS migrations",
  "Redis development service",
  "Strict TypeScript and automated checks",
];

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 sm:px-10">
      <header className="border-b border-slate-200 pb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          Phase 1 foundation
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          ATLAS
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
          Verified Workforce Infrastructure. The product surface is ready for
          the approved UI design and domain integrations.
        </p>
      </header>

      <section aria-labelledby="foundation-heading" className="py-10">
        <h2 id="foundation-heading" className="text-xl font-semibold text-slate-950">
          Foundation status
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {foundationItems.map((item) => (
            <li key={item} className="rounded-md border border-slate-200 p-4 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="Design handoff status" className="border-t border-slate-200 pt-8">
        <h2 className="text-base font-semibold text-slate-950">Design handoff pending</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Final routes, visual tokens, components, responsive behavior, and
          product content will be implemented from the supplied design. No
          placeholder dashboard has been treated as finished UI.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          API origin: <code className="rounded bg-slate-100 px-2 py-1">{ATLAS_API_URL}</code>
        </p>
      </aside>
    </main>
  );
}

