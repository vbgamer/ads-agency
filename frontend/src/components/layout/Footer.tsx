import { Link } from "react-router-dom";
import { Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/Adssimsim_Logo.png"
                alt="ADSSIMSIM Logo"
                className="h-8 w-8 rounded-xl shadow-glow object-contain"
              />
              <span className="font-display text-lg font-bold">ADSSIMSIM</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Earn cashback on every purchase. Shop smarter, save bigger with ADSSIMSIM.
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-display font-semibold">For Brands</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground">Brand FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-display font-semibold">Support</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ADSSIMSIM. All rights reserved.
          </p>
          <div className="flex gap-3">
            <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
