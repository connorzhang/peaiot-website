import React from 'react';
import { Shield, Zap, Globe, Wifi, ParkingCircle, Home, Hotel, Sparkles, Server, Terminal } from 'lucide-react';
import { siteData } from '../constants/siteData';

const iconMap: Record<string, React.ReactNode> = {
  Server: <Server className="w-8 h-8" />,
  Shield: <Shield className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Globe: <Globe className="w-8 h-8" />,
  Wifi: <Wifi className="w-8 h-8" />,
  ParkingCircle: <ParkingCircle className="w-8 h-8" />,
  Home: <Home className="w-8 h-8" />,
  Hotel: <Hotel className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  Terminal: <Terminal className="w-8 h-8" />
};

export const ServicesGrid = () => {
  return (
    <section className="py-24 relative z-10" id="services">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">核心服务领域</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-emerald-400 mx-auto rounded-full mb-6"></div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            提供从设计、施工到维护的全生命周期一站式服务
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {siteData.services.map((service, index) => (
            <div 
              key={service.id} 
              className="glass-panel p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-blue-500/30 group animate-slide-up"
              style={{ animationDelay: `${0.1 * index}s`, animationFillMode: 'both' }}
            >
              <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300">
                {iconMap[service.icon]}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};