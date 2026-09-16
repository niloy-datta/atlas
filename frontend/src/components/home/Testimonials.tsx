import Image from "next/image";

export default function Testimonials() {
  const reviews = [
    {
      id: "rev-1",
      quote:
        "Booked a verified electrician in Dhanmondi when our main circuit tripped. Arrived within 25 minutes with WorkPass credentials, diagnosed the fault, and charged transparent BDT rates.",
      name: "Fahim Chowdhury",
      role: "Homeowner, Dhanmondi",
      avatar: "/assets/daniel_morgan.jpg",
      isImage: true,
    },
    {
      id: "rev-2",
      quote:
        "I take barista shifts around Dhanmondi and Gulshan on my days off. Every hour worked is logged via GPS check-in and paid out to my bKash account automatically without friction.",
      name: "Farzana Akhter",
      role: "Senior Barista & Crew",
      avatar: "/assets/maria_santos.jpg",
      isImage: true,
    },
    {
      id: "rev-3",
      quote:
        "WORVO eliminated our weekend staffing shortages. Workers arrive on time with verified hospitality skills, and the automated backup system ensures our café never runs short-staffed.",
      name: "Artisan Roast Roastery",
      role: "Specialty Café, Dhanmondi",
      avatar: "ROAST",
      isImage: false,
    },
  ];

  return (
    <section className="testimonials-section" aria-label="Pilot reviews and user experiences">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold mb-3">
            <span>⭐</span>
            <span>Real Experiences from Dhaka Pilot</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Trusted by workers, businesses, and homeowners
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Feedback from participants in our active Dhaka pilot zone.
          </p>
        </div>

        <div className="reviews-grid">
          {reviews.map((rev) => (
            <div key={rev.id} className="review-card">
              <div>
                <div className="stars" aria-label="5 out of 5 stars">
                  ★★★★★
                </div>
                <p className="review-text">&ldquo;{rev.quote}&rdquo;</p>
              </div>

              <div className="reviewer pt-4 border-t border-slate-800/80">
                {rev.isImage ? (
                  <Image
                    src={rev.avatar}
                    alt={rev.name}
                    width={40}
                    height={40}
                    className="reviewer-img"
                  />
                ) : (
                  <div className="reviewer-logo">
                    ARTISAN
                    <br />
                    ROAST
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{rev.name}</h3>
                  <p className="text-xs text-slate-400">{rev.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
