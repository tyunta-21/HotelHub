import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <h1>HotelHub</h1>
          <p>Find distinctive rooms, book securely, and get real-time booking confirmations across a microservices platform.</p>
          <Link href="/hotels" className="btn primary">Browse hotels</Link>
        </div>
      </section>
      <section className="page">
        <div className="section-title">
          <h2>Built for modern stays</h2>
          <span className="muted">REST bookings · GraphQL catalog · realtime updates</span>
        </div>
        <div className="grid">
          <div className="card"><div className="card-body"><strong>Curated catalog</strong><p className="muted">Search seeded hotels and inspect room availability from the Python GraphQL service.</p></div></div>
          <div className="card"><div className="card-body"><strong>Secure booking</strong><p className="muted">JWT access and refresh tokens protect booking and payment flows in the Node REST service.</p></div></div>
          <div className="card"><div className="card-body"><strong>Live notifications</strong><p className="muted">Socket.io pushes booking confirmations directly into the client session.</p></div></div>
        </div>
      </section>
    </main>
  );
}
