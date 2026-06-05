import React from 'react';
import { siteData } from '../constants/siteData';
import { CheckCircle2 } from 'lucide-react';

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-slate-900/50 relative border-y border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 flex flex-col justify-center animate-slide-up">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              为什么选择 <br/>
              <span className="text-gradient">奕柏科技？</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              我们用最严苛的标准和最前沿的技术，为您打造坚不可摧的数字化基建。
            </p>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {siteData.advantages.map((adv, index) => (
              <div 
                key={index}
                className="bg-slate-800/30 p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${0.2 + (0.1 * index)}s`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-emerald-500/20 p-2 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{adv.title}</h3>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {adv.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};