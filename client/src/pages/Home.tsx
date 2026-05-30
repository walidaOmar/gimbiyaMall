/**
 * Home.tsx — Gimbiya Mall Landing Page
 *
 * Fully self-contained styling using Tailwind utility classes only.
 * No external images needed — uses inline SVG backgrounds and CSS gradients.
 * Authenticated users are silently redirected to their dashboard.
 */

import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  ShoppingBag, TrendingUp, Users, Zap, Star, ArrowRight,
  CheckCircle, Package, Truck, BarChart3, Link2, Code2,
  Shield, Sparkles, ChevronRight, Globe, Lock, Headphones,
} from "lucide-react";

const dashboardPath: Record<string, string> = {
  admin:     "/admin",
  manager:   "/manager",
  delivery:  "/delivery",
  reader:    "/affiliate",
  developer: "/developer",
  buyer:     "/buyer",
};

// ── Reusable inline button ──────────────────────────────────────────────────
function Btn({
  children, onClick, variant = "primary", size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "white";
  size?: "sm" | "md" | "lg";
}) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer border-0 outline-none";
  const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-sm", lg: "px-8 py-4 text-base" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5",
    outline: "bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50",
    ghost:   "bg-transparent text-slate-600 hover:bg-slate-100",
    white:   "bg-white text-blue-700 hover:bg-blue-50 shadow-lg",
  };
  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {children}
    </button>
  );
}

// ── Role card data ─────────────────────────────────────────────────────────
const ROLES = [
  {
    icon: ShoppingBag, label: "Buyers", color: "blue",
    bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600",
    border: "border-blue-200", badge: "bg-blue-600",
    features: ["Browse product catalog", "Smart shopping cart", "Secure Monnify checkout", "Real-time order tracking"],
  },
  {
    icon: Zap, label: "Managers", color: "amber",
    bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600",
    border: "border-amber-200", badge: "bg-amber-600",
    features: ["Add & manage products", "Live inventory tracking", "Automated commission pricing", "Category management"],
  },
  {
    icon: Shield, label: "Admins", color: "red",
    bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600",
    border: "border-red-200", badge: "bg-red-600",
    features: ["Full platform dashboard", "User role management", "Revenue analytics", "Commission configuration"],
  },
  {
    icon: Truck, label: "Delivery", color: "green",
    bg: "bg-green-50", iconBg: "bg-green-100", iconColor: "text-green-600",
    border: "border-green-200", badge: "bg-green-600",
    features: ["View assigned orders", "GPS tracking integration", "Real-time status updates", "Automatic commission tracking"],
  },
  {
    icon: Link2, label: "Affiliates", color: "purple",
    bg: "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-600",
    border: "border-purple-200", badge: "bg-purple-600",
    features: ["Generate referral links", "Track conversions", "Earnings dashboard", "Performance metrics"],
  },
  {
    icon: Code2, label: "Developers", color: "indigo",
    bg: "bg-indigo-50", iconBg: "bg-indigo-100", iconColor: "text-indigo-600",
    border: "border-indigo-200", badge: "bg-indigo-600",
    features: ["Platform-wide analytics", "Store management", "Commission distribution", "System configuration"],
  },
];

const STATS = [
  { value: "6", label: "User Roles", icon: Users },
  { value: "99.9%", label: "Uptime", icon: Globe },
  { value: "₦0", label: "Setup Cost", icon: Sparkles },
  { value: "24/7", label: "Support", icon: Headphones },
];

const BENEFITS = [
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Live dashboards with sales data, inventory tracking and performance metrics for every stakeholder.", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Lock,      title: "Role-Based Security",  desc: "Six distinct roles with granular permissions. Staff and buyers login via separate portals.", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Truck,     title: "GPS Delivery Tracking", desc: "Real-time location tracking and order status updates for seamless last-mile delivery.", color: "text-green-600", bg: "bg-green-50" },
  { icon: TrendingUp, title: "Automated Commissions", desc: "Transparent profit calculation auto-distributed to managers, delivery riders and affiliates.", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Package,   title: "Inventory Management",  desc: "Live stock tracking with low-stock alerts, adjustments and full category organisation.", color: "text-red-600", bg: "bg-red-50" },
  { icon: Star,      title: "Affiliate Programme",   desc: "Built-in referral system with tracking links, conversion analytics and automatic payouts.", color: "text-indigo-600", bg: "bg-indigo-50" },
];

const STAFF_ROLES = [
  { role: "Admin",     email: "admin@sahadstores.com",     pw: "Admin@123456",     color: "red" },
  { role: "Manager",   email: "manager@sahadstores.com",   pw: "Manager@123456",   color: "blue" },
  { role: "Delivery",  email: "delivery@sahadstores.com",  pw: "Delivery@123456",  color: "green" },
  { role: "Developer", email: "developer@sahadstores.com", pw: "Developer@123456", color: "purple" },
];

const colorMap: Record<string, string> = {
  red: "bg-red-100 text-red-700 border-red-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-green-100 text-green-700 border-green-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
};

// ── Main component ─────────────────────────────────────────────────────────
export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user) navigate(dashboardPath[(user as any).role] ?? "/mall");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">Gimbiya Mall</span>
                <span className="text-xl font-bold text-blue-600"> Stores</span>
              </div>
            </div>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button onClick={() => navigate("/mall")} className="hover:text-blue-600 transition-colors">Products</button>
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#roles" className="hover:text-blue-600 transition-colors">Roles</a>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/auth?mode=staff")}
                className="hidden sm:block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Staff Portal
              </button>
              <button
                onClick={() => navigate("/auth?mode=signup")}
                className="text-sm font-semibold text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Sign Up
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full opacity-5 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "linear-gradient(#4f81ff 1px, transparent 1px), linear-gradient(90deg, #4f81ff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Nigeria's Complete Multi-Role Commerce Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              One Platform,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Every Role
              </span>
              <br />in Your Business
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
              Gimbiya Mall connects buyers, managers, admins, delivery riders,
              affiliates and developers in one seamless commerce ecosystem.
              Powered by Monnify payments and real-time GPS tracking.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-xl shadow-blue-900/50 hover:-translate-y-0.5 text-base"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/mall")}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all border border-white/20 text-base"
              >
                <Package className="w-5 h-5" /> Browse Products
              </button>
            </div>

            {/* Staff shortcut */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-slate-400 text-sm">Staff access:</span>
              {STAFF_ROLES.map(({ role, color }) => (
                <button
                  key={role}
                  onClick={() => navigate("/auth?mode=staff")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:-translate-y-0.5 ${colorMap[color]}`}
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.15)" }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1200 60 900 0 720 0C540 0 240 60 0 30L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-1">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                <div className="text-sm text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE CARDS ─────────────────────────────────────────────────── */}
      <section id="roles" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <Users className="w-4 h-4" /> Built for Every Stakeholder
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Powerful Features for Every Role
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Six dedicated dashboards — each crafted for exactly what that role needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROLES.map(({ icon: Icon, label, bg, iconBg, iconColor, border, badge, features }) => (
              <div
                key={label}
                className={`${bg} border ${border} rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <span className={`${badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {label}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">For {label}</h3>
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <CheckCircle className="w-4 h-4" /> Platform Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Gimbiya Mall?
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Everything you need to run a professional Nigerian e-commerce operation, out of the box.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="group">
                <div className="flex items-start gap-4">
                  <div className={`${bg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STAFF LOGIN SHOWCASE ────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                <Shield className="w-4 h-4" /> Secure Multi-Portal Login
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Separate Portals for <br />
                <span className="text-blue-600">Staff & Customers</span>
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Staff (Admin, Manager, Delivery, Developer) log in through the
                dedicated Staff Portal. Buyers and Affiliates access the Shop Account portal.
                Role-based JWT sessions keep everything secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/auth?mode=staff")}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
                >
                  <Shield className="w-4 h-4" /> Staff Portal Login
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-200"
                >
                  <ShoppingBag className="w-4 h-4" /> Shop Account Login
                </button>
              </div>
            </div>

            {/* Right — credential cards */}
            <div className="grid grid-cols-2 gap-4">
              {STAFF_ROLES.map(({ role, email, pw, color }) => {
                const cls = {
                  red:    { card: "border-red-200 bg-red-50",    badge: "bg-red-600",    icon: "text-red-600" },
                  blue:   { card: "border-blue-200 bg-blue-50",  badge: "bg-blue-600",   icon: "text-blue-600" },
                  green:  { card: "border-green-200 bg-green-50",badge: "bg-green-600",  icon: "text-green-600" },
                  purple: { card: "border-purple-200 bg-purple-50",badge:"bg-purple-600",icon: "text-purple-600" },
                }[color]!;
                return (
                  <div key={role} className={`border ${cls.card} rounded-2xl p-4 hover:shadow-md transition-all`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`${cls.badge} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                        {role}
                      </span>
                      <Shield className={`w-4 h-4 ${cls.icon}`} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Email</p>
                      <p className="text-xs font-semibold text-slate-800 break-all">{email}</p>
                      <p className="text-xs text-slate-500 font-medium mt-2">Password</p>
                      <p className="text-xs font-mono font-bold text-slate-800">{pw}</p>
                    </div>
                    <button
                      onClick={() => navigate("/auth?mode=staff")}
                      className={`mt-3 w-full text-xs font-semibold py-1.5 rounded-lg border ${cls.card} ${cls.icon} hover:opacity-80 transition-all flex items-center justify-center gap-1`}
                    >
                      Login as {role} <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Buyer card */}
              <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 col-span-2 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">Buyer / Affiliate</span>
                  <ShoppingBag className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Buyers register themselves via the Shop Account signup. Admin can
                  promote a buyer to Affiliate status from User Management.
                </p>
                <button
                  onClick={() => navigate("/auth?mode=signup")}
                  className="w-full text-xs font-semibold py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-1"
                >
                  Create Buyer Account <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Up and running in minutes</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-blue-100" />
            {[
              { step: "1", icon: ShoppingBag, title: "Sign Up / Log In", desc: "Create a buyer account or use your staff credentials to access your role dashboard." },
              { step: "2", icon: Package, title: "Start Managing",   desc: "Managers add products, admins configure roles, delivery riders pick up orders." },
              { step: "3", icon: TrendingUp, title: "Track & Grow",  desc: "Monitor sales, commissions, inventory and referrals in real time across all dashboards." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-5 relative z-10">
                  <Icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    {step}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full opacity-5" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full opacity-5" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-1.5 text-white/90 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" /> Ready to get started?
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
            Transform Your E-Commerce Business Today
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Join Gimbiya Mall and give every person in your business the exact
            tools they need — buyers, staff, delivery and affiliates, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-xl text-base"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/auth?mode=staff")}
              className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/25 transition-all text-base"
            >
              <Shield className="w-5 h-5" /> Staff Login
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Gimbiya Mall</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <button onClick={() => navigate("/mall")} className="hover:text-white transition-colors">Products</button>
              <button onClick={() => navigate("/auth")}     className="hover:text-white transition-colors">Sign In</button>
              <button onClick={() => navigate("/auth?mode=signup")} className="hover:text-white transition-colors">Sign Up</button>
              <button onClick={() => navigate("/auth?mode=staff")} className="hover:text-white transition-colors">Staff Portal</button>
            </div>

            {/* Copyright */}
            <p className="text-sm">&copy; 2026 Gimbiya Mall. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}