import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { IDCSection } from './IDCSection';
import { ServicesGrid } from './ServicesGrid';
import { Features } from './Features';
import { ContactFooter } from './ContactFooter';

export const Home = () => {
  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-50 selection:bg-emerald-500/30 font-sans">
      <Navbar />
      <main>
        <HeroSection />
        <IDCSection />
        <ServicesGrid />
        <Features />
      </main>
      <ContactFooter />
    </div>
  );
};