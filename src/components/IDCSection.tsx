import React from 'react';
import { Server, Activity, ShieldCheck, Cpu } from 'lucide-react';

export const IDCSection = () => {
  return (
    <section className="py-24 bg-slate-900 relative z-10 border-y border-slate-800/50" id="idc">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
            <Server className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wide">王牌核心业务</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">企业级 IDC 机房建设与运维</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-blue-500 mx-auto rounded-full mb-6"></div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            为您打造安全、稳定、高效的数据中心。提供从前期规划设计、弱电布线、机柜上架到后期7x24小时驻场运维的全生命周期服务。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Images */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50">
              <img 
                src="/idc_hero_new.jpg" 
                alt="现代化IDC机房建设" 
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-xl font-bold text-white mb-2">高标准机房建设</h3>
                <p className="text-slate-300 text-sm">防静电地板、精密空调、UPS不间断电源、标准化走线，打造业界标杆级数据中心。</p>
              </div>
            </div>
          </div>

          {/* Right Column: Features */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">7x24小时主动式运维</h4>
                <p className="text-slate-400 leading-relaxed">
                  不再是被动等待故障，我们提供实时性能监控、温湿度监测和告警响应。专业工程师定期巡检，将隐患消灭在萌芽状态。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">安全与合规保障</h4>
                <p className="text-slate-400 leading-relaxed">
                  严格执行等级保护标准（等保2.0/3.0）。涵盖门禁控制、视频监控、动环监控及数据防灾备份机制。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">机柜上架与综合布线</h4>
                <p className="text-slate-400 leading-relaxed">
                  提供服务器、交换机、路由器的专业上架服务。强弱电分离、光纤与网线清晰标识，让机柜内部整洁如艺术品。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Second Image Row */}
        <div className="mt-16 relative group max-w-4xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50 flex flex-col md:flex-row">
             <img 
                src="/idc_maintenance_new.jpg" 
                alt="专业IT工程师机房运维" 
                className="w-full md:w-1/2 h-64 md:h-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="p-8 flex flex-col justify-center bg-slate-900 md:w-1/2">
                <h3 className="text-2xl font-bold text-white mb-4">专业工程师驻场服务</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  无论是突发硬件故障替换、网络链路割接，还是系统的平滑扩容，我们的驻场工程师都能提供最快速的现场技术支持，确保您的业务不中断。
                </p>
                <button onClick={() => {
                  const el = document.getElementById('contact');
                  if(el) el.scrollIntoView({ behavior: 'smooth' });
                }} className="self-start px-6 py-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-300 font-medium border border-emerald-500/30 hover:border-transparent">
                  获取机房建设方案
                </button>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
};