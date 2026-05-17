import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";

// Page imports
import Index from "@/pages/Index";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Brands from "@/pages/Brands";
import Offers from "@/pages/Offers";
import OfferListingDetail from "@/pages/OfferListingDetail";
import OfferDetail from "@/pages/OfferDetail";
import CampaignDetail from "@/pages/CampaignDetail";
import Wallet from "@/pages/Wallet";
import Subscription from "@/pages/Subscription";
import BrandDashboard from "@/pages/brand/BrandDashboard";
import CampaignPerformance from "@/pages/brand/CampaignPerformance";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import CompanyHub from "@/pages/CompanyHub";
import UserDashboard from "@/pages/user/UserDashboard";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();

  // Scroll to top on every page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Home - fade for clean entry */}
        <Route path="/" element={
          <PageTransition variant="fade">
            <Index />
          </PageTransition>
        } />

        {/* List/Content pages - slideUp for content reveal */}
        <Route path="/faq" element={
          <PageTransition variant="slideUp">
            <FAQ />
          </PageTransition>
        } />
        <Route path="/terms" element={
          <PageTransition variant="slideUp">
            <Terms />
          </PageTransition>
        } />
        <Route path="/privacy" element={
          <PageTransition variant="slideUp">
            <PrivacyPolicy />
          </PageTransition>
        } />
        <Route path="/contact" element={
          <PageTransition variant="slideUp">
            <Contact />
          </PageTransition>
        } />
        <Route path="/brands" element={
          <PageTransition variant="slideUp">
            <Brands />
          </PageTransition>
        } />
        <Route path="/offers" element={
          <PageTransition variant="slideUp">
            <Offers />
          </PageTransition>
        } />

        {/* Auth pages - fade for minimal distraction */}
        <Route path="/login" element={
          <PageTransition variant="fade">
            <Login />
          </PageTransition>
        } />
        <Route path="/admin/login" element={
          <PageTransition variant="fade">
            <AdminLogin />
          </PageTransition>
        } />

        {/* Detail pages - slideRight for forward navigation */}
        <Route path="/brand/:id" element={
          <PageTransition variant="slideRight">
            <OfferListingDetail />
          </PageTransition>
        } />
        <Route path="/offers/:id" element={
          <PageTransition variant="slideRight">
            <OfferDetail />
          </PageTransition>
        } />
        <Route path="/campaign/:id" element={
          <PageTransition variant="slideRight">
            <CampaignDetail />
          </PageTransition>
        } />
        <Route path="/company/:id" element={
          <PageTransition variant="slideRight">
            <CompanyHub />
          </PageTransition>
        } />

        {/* Dashboards - scale for focus */}
        <Route path="/wallet" element={
          <PageTransition variant="scale">
            <Wallet />
          </PageTransition>
        } />
        <Route path="/subscription" element={
          <PageTransition variant="scale">
            <Subscription />
          </PageTransition>
        } />
        <Route path="/brand/dashboard" element={
          <PageTransition variant="scale">
            <BrandDashboard />
          </PageTransition>
        } />
        <Route path="/brand/campaign/:id/performance" element={
          <PageTransition variant="slideRight">
            <CampaignPerformance />
          </PageTransition>
        } />
        <Route path="/admin/dashboard" element={
          <PageTransition variant="scale">
            <AdminDashboard />
          </PageTransition>
        } />
        <Route path="/user/dashboard" element={
          <PageTransition variant="scale">
            <UserDashboard />
          </PageTransition>
        } />

        {/* 404 - fade */}
        <Route path="*" element={
          <PageTransition variant="fade">
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}
