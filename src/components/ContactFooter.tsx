import React from 'react';
import { siteData } from '../constants/siteData';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

export const ContactFooter = () => {
  return (
    <footer id="contact" className="relative bg-slate-950 border-t border-slate-800/50 pt-24 pb-12 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-1/2 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="glass-panel rounded-3xl p-8 md:p-12 mb-20 text-center animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">准备好升级您的智能化基础设施了吗？</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            联系我们的专业顾问，为您量身定制专属的智能工程与信息化解决方案。
          </p>
          <a 
            href={`tel:${siteData.contact.phone}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-8 py-4 rounded-full font-medium hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            立即拨打电话咨询
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 border-b border-slate-800/50 pb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-2">
                <img src="/logo.png" alt="PEAIOT Logo" className="h-8 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <h3 className="text-xl font-bold text-white">上海奕柏科技有限公司</h3>
              </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              {siteData.description}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">联系我们</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-400 hover:text-white transition-colors">
                <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>{siteData.contact.address}</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Phone className="w-5 h-5 text-blue-400 shrink-0" />
                <span>{siteData.contact.phone}</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5 text-blue-400 shrink-0" />
                <a href={`mailto:${siteData.contact.email}`}>{siteData.contact.email}</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">快速链接</h4>
            <ul className="space-y-3">
              <li><a href="#services" className="text-slate-400 hover:text-emerald-400 transition-colors">核心业务</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">关于我们</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">解决方案</a></li>
            </ul>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
        <p>© 2026 上海奕柏科技有限公司. 保留所有权利.</p>
        <p>Designed with <span className="text-emerald-500">♥</span> by PEAIOT</p>
      </div>
      </div>
    </footer>
  );
};