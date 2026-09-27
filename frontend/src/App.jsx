import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import KitBuilder from "@/pages/KitBuilder";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import PaymentResult from "@/pages/PaymentResult";

function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Chrome() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  return (
    <>
      <AnnouncementBanner />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/kit" element={<KitBuilder />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/payment/:result" element={<PaymentResult />} />
      </Routes>
      {!isAdmin && <Footer />}
      <CartDrawer />
      <div className="ai-anchor-zone" data-testid="ai-anchor-zone" aria-hidden="true" />
    </>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ScrollManager />
            <Chrome />
            <Toaster position="bottom-left" toastOptions={{ style: { background: "#000", color: "#fff", border: "1px solid #222", borderRadius: 0 } }} />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
