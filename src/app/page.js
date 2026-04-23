import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 via-red-50 to-amber-50">
      {/* Navigation Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-serif font-bold text-orange-700">
            🍽️ TableReserve
          </div>
          <div className="flex gap-6">
            <Link href="/restaurant-login" className="text-foreground hover:text-primary font-medium transition">
              Restaurant Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground leading-tight">
                Your Restaurant's <span className="text-primary">Perfect Booking</span> Platform
              </h1>
              <p className="text-xl text-muted-foreground">
                Streamline reservations, manage tables, and deliver exceptional dining experiences with our modern restaurant booking system.
              </p>
            </div>

            {/* Features List */}
            <div className="pt-8 space-y-4">
              <div className="flex gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <h3 className="font-semibold text-foreground">Smart Reservations</h3>
                  <p className="text-sm text-muted-foreground">Manage bookings effortlessly with real-time availability</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🪑</span>
                <div>
                  <h3 className="font-semibold text-foreground">Table Management</h3>
                  <p className="text-sm text-muted-foreground">Optimize seating arrangements and table assignments</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="font-semibold text-foreground">Time Optimization</h3>
                  <p className="text-sm text-muted-foreground">Maximize occupancy and improve service flow</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image Area */}
          <div className="flex items-center justify-center">
            <div className="w-full h-80 bg-gradient-to-br from-orange-200 to-red-200 rounded-2xl shadow-lg flex items-center justify-center">
              <div className="text-6xl text-center">
                🍽️✨
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-24 py-16 border-t border-orange-200">
          <h2 className="text-4xl font-serif font-bold text-center text-foreground mb-12">
            Why Choose TableReserve?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "💼",
                title: "For Restaurants",
                description: "Complete control over reservations, staffing, and daily operations"
              },
              {
                icon: "👥",
                title: "For Customers",
                description: "Easy online booking with instant confirmation and reminders"
              },
              {
                icon: "📊",
                title: "Analytics",
                description: "Track bookings, occupancy rates, and customer preferences"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 border border-orange-100 shadow-sm hover:shadow-md transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-24 py-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join restaurants worldwide using TableReserve to optimize their booking experience.
            <br /><br />
            <span className="text-primary font-medium">Click "Restaurant Login" above to get started.</span>
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-serif font-bold text-orange-700 mb-4">🍽️ TableReserve</div>
              <p className="text-sm text-muted-foreground">Modern restaurant booking made simple</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-primary">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-orange-100 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 TableReserve. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
