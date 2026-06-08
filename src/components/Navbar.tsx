import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800/80 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('top')}>
          <img src="/peaiot-logo.png" alt="奕柏科技 Logo" className="h-8 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="text-xl font-bold text-white tracking-wide">奕柏科技</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('top')} className="text-slate-300 hover:text-emerald-400 transition-colors font-medium bg-transparent border-none outline-none">首页</button>
          <button onClick={() => scrollTo('services')} className="text-slate-300 hover:text-emerald-400 transition-colors font-medium bg-transparent border-none outline-none">核心业务</button>
          <button onClick={() => scrollTo('features')} className="text-slate-300 hover:text-emerald-400 transition-colors font-medium bg-transparent border-none outline-none">解决方案</button>
          <button onClick={() => scrollTo('contact')} className="text-slate-300 hover:text-emerald-400 transition-colors font-medium bg-transparent border-none outline-none">联系我们</button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0f172a] border-b border-slate-800/80 py-4 px-6 flex flex-col gap-4 shadow-xl">
          <button onClick={() => scrollTo('top')} className="text-left text-slate-300 hover:text-emerald-400 py-2 bg-transparent border-none outline-none">首页</button>
          <button onClick={() => scrollTo('services')} className="text-left text-slate-300 hover:text-emerald-400 py-2 bg-transparent border-none outline-none">核心业务</button>
          <button onClick={() => scrollTo('features')} className="text-left text-slate-300 hover:text-emerald-400 py-2 bg-transparent border-none outline-none">解决方案</button>
          <button onClick={() => scrollTo('contact')} className="text-left text-slate-300 hover:text-emerald-400 py-2 bg-transparent border-none outline-none">联系我们</button>
        </div>
      )}
    </nav>
  );
};