import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { siteData } from '../constants/siteData';

export const HeroSection = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0f172a]">
      {/* 渐变发光球体 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-emerald-600/20 rounded-full blur-[150px] mix-blend-screen animate-float" style={{ animationDelay: '-3s' }}></div>

      {/* 居中内容 */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
        <div 
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm font-medium text-slate-300">领先的智能化基建服务商</span>
            </div>

        <h1 
          className={`text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight transition-all duration-1000 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          驱动未来空间的 <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-300">
            数字引擎
          </span>
        </h1>

        <p 
          className={`text-lg md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {siteData.slogan}。<br className="hidden md:block"/> {siteData.description}
        </p>

        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-6 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <a 
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative px-8 py-4 bg-white text-slate-900 font-bold rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 w-full sm:w-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
              探索核心业务
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>

          <a 
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 bg-transparent border border-slate-700 text-white font-bold rounded-full hover:bg-slate-800 transition-colors duration-300 w-full sm:w-auto flex items-center justify-center"
          >
            免费获取方案
          </a>
        </div>
      </div>

      {/* 向下滚动提示 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <a 
          href="#services" 
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <ChevronDown className="w-8 h-8" />
        </a>
      </div>
    </div>
  );
};