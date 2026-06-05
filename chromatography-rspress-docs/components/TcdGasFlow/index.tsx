import React, { useState } from 'react';
import { ArrowRightCircle, Info } from 'lucide-react';

const COLOR_H2 = "#3b82f6"; // 纯氢气 (蓝色)
const COLOR_SAMPLE = "#f59e0b"; // 纯样气 (橙色)
const COLOR_OFF = "#27272a"; // 灰色底线

// --- 基础外部管线定义 (完全按照真实气流方向绘制，确保动画顺畅) ---
const path_CH1_Ref = "M 140 180 L 250 180 L 250 100 L 740 100";
const path_Ref_Cell = "M 740 100 L 755 90 L 775 110 L 795 90 L 815 110 L 835 90 L 850 100";
const path_Ref_P2 = "M 850 100 L 880 100 L 880 250 L 552 250";

const path_CH2_P5 = "M 140 380 L 448 380 L 448 310";
const path_P6_Vent = "M 448 250 L 380 250";

const path_P3_Col = "M 552 310 L 552 510 L 560 510";
const path_Col = "M 560 510 Q 580 480 600 510 T 640 510 T 680 510";
const path_Col_TCD = "M 680 510 L 740 510";
const path_Meas_Cell = "M 740 510 L 755 500 L 775 520 L 795 500 L 815 520 L 835 500 L 850 510";
const path_TCD_Vent = "M 850 510 L 890 510";

// --- 六通阀内部管线定义 (局部坐标, 相对于 500, 280) ---
const path_Loop_Local_4to1 = "M 0 60 C -60 20, 60 -20, 0 -60";
const path_Loop_Local_1to4 = "M 0 -60 C 60 -20, -60 20, 0 60";

const arc_1_6 = "M 0 -60 A 60 60 0 0 0 -52 -30";
const arc_2_3 = "M 52 -30 A 60 60 0 0 1 52 30";
const arc_5_4 = "M -52 30 A 60 60 0 0 0 0 60";

const arc_2_1 = "M 52 -30 A 60 60 0 0 0 0 -60";
const arc_4_3 = "M 0 60 A 60 60 0 0 0 52 30";
const arc_5_6 = "M -52 30 A 60 60 0 0 1 -52 -30";

// --- 进样状态：样气柱塞 (Slug) 的全局完整路径 ---
const path_Slug = "M 500 220 C 560 260, 440 300, 500 340 A 60 60 0 0 0 552 310 L 552 510 L 560 510 Q 580 480 600 510 T 640 510 T 680 510 L 740 510 L 755 500 L 775 520 L 795 500 L 815 520 L 835 500 L 850 510 L 890 510";

const renderPipe = (d: string, color: string, flowClass: string = "flow-fwd") => (
  <g>
    <path d={d} stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d={d} stroke="#fff" strokeWidth="2" strokeDasharray="4 12" opacity={0.6} className={flowClass} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </g>
);

export default function TcdGasFlow() {
  const [valveState, setValveState] = useState<'baseline' | 'injection'>('baseline');

  return (
    <div className="py-4">
      {/* Controls */}
      <div className="mb-6 flex justify-end">
        <button 
          onClick={() => setValveState(prev => prev === 'baseline' ? 'injection' : 'baseline')}
          className={`px-6 py-3 font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shrink-0 ${
            valveState === 'baseline' 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' 
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20'
          }`}
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <ArrowRightCircle size={20} />
          {valveState === 'baseline' ? '切换至: 进样分析状态' : '切换至: 取样基线状态'}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="flex flex-wrap gap-6 mb-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-zinc-300">
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg width="32" height="4" className="rounded-full"><line x1="0" y1="2" x2="32" y2="2" stroke={COLOR_H2} strokeWidth="4" /></svg> 纯氢气 (载气)
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg width="32" height="4" className="rounded-full"><line x1="0" y1="2" x2="32" y2="2" stroke={COLOR_SAMPLE} strokeWidth="4" /></svg> 纯样气 (待测)
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <svg width="40" height="10" className="rounded-full">
            <line x1="0" y1="5" x2="40" y2="5" stroke={COLOR_H2} strokeWidth="4" />
            <line x1="12" y1="5" x2="28" y2="5" stroke={COLOR_SAMPLE} strokeWidth="6" strokeLinecap="round" />
          </svg> 
          载气推着独立样气段 (Slug Flow)
        </div>
      </div>

      {/* SVG Diagram Area */}
      <div className="w-full bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative mb-8">
        <svg viewBox="0 0 1000 600" className="w-full h-auto">
          <style>
            {`
              @keyframes flowForward {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: -16; }
              }
              @keyframes slugFlow {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -1200; }
              }
              .flow-fwd {
                animation: flowForward 0.8s linear infinite;
              }
              .flow-slug {
                animation: slugFlow 30s linear forwards;
              }
            `}
          </style>

          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#27272a" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <rect x="720" y="40" width="180" height="520" rx="8" fill="#1f1f22" stroke="#52525b" strokeWidth="2" strokeDasharray="6 4" />
          <text x="810" y="30" fill="#a1a1aa" fontSize="14" fontWeight="bold" textAnchor="middle">TCD 传感器物理总成</text>

          <rect x="735" y="60" width="150" height="80" rx="4" fill="#27272a" stroke="#3f3f46" strokeWidth="2" />
          <text x="810" y="155" fill="#10b981" fontSize="12" textAnchor="middle">参比池</text>

          <rect x="735" y="470" width="150" height="80" rx="4" fill="#27272a" stroke={valveState === 'baseline' ? '#3f3f46' : '#be185d'} strokeWidth="2" className="transition-colors duration-500" />
          <text x="810" y="565" fill={valveState === 'baseline' ? '#3b82f6' : '#ec4899'} fontSize="12" textAnchor="middle">测量池</text>

          <circle cx="500" cy="280" r="100" fill="#1f1f22" stroke="#52525b" strokeWidth="2" strokeDasharray="4 4" />
          <text x="500" y="160" fill="#a1a1aa" fontSize="12" textAnchor="middle">六通切换阀 (内置定量环)</text>

          <rect x="520" y="450" width="180" height="120" rx="4" fill="#1f1f22" stroke="#52525b" strokeWidth="1" />
          <text x="610" y="470" fill="#a1a1aa" fontSize="12" textAnchor="middle">色谱柱恒温箱</text>

          <rect x="20" y="120" width="120" height="300" rx="8" fill="#1f1f22" stroke="#52525b" strokeWidth="2" strokeDasharray="6 4" />
          <text x="80" y="150" fill="#a1a1aa" fontSize="12" fontWeight="bold" textAnchor="middle">双路 EPC 总成</text>

          <g stroke={COLOR_OFF} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={path_CH1_Ref} />
            <path d={path_Ref_Cell} />
            <path d={path_Ref_P2} />
            <path d={path_CH2_P5} />
            <path d={path_P6_Vent} />
            <path d={path_P3_Col} />
            <path d={path_Col} />
            <path d={path_Col_TCD} />
            <path d={path_Meas_Cell} />
            <path d={path_TCD_Vent} />
          </g>

          <g transform="translate(500, 280)">
            <circle cx="0" cy="0" r="60" fill="#27272a" stroke="#71717a" strokeWidth="3" />
            <path d={path_Loop_Local_4to1} stroke={COLOR_OFF} strokeWidth="8" fill="none" strokeLinecap="round" />
            <g stroke={COLOR_OFF} strokeWidth="8" fill="none" strokeLinecap="round">
              {valveState === 'baseline' ? (
                <>
                  <path d={arc_1_6} />
                  <path d={arc_2_3} />
                  <path d={arc_5_4} />
                </>
              ) : (
                <>
                  <path d={arc_2_1} />
                  <path d={arc_4_3} />
                  <path d={arc_5_6} />
                </>
              )}
            </g>
          </g>

          {valveState === 'baseline' ? (
            <g>
              {renderPipe(path_CH1_Ref, COLOR_H2)}
              {renderPipe(path_Ref_Cell, COLOR_H2)}
              {renderPipe(path_Ref_P2, COLOR_H2)}
              <g transform="translate(500,280)">
                {renderPipe(arc_2_3, COLOR_H2)}
                <path d="M 52 -15 L 45 -5 L 60 5 L 52 15" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" fill="none" />
              </g>
              {renderPipe(path_P3_Col, COLOR_H2)}
              {renderPipe(path_Col, COLOR_H2)}
              {renderPipe(path_Col_TCD, COLOR_H2)}
              {renderPipe(path_Meas_Cell, COLOR_H2)}
              {renderPipe(path_TCD_Vent, COLOR_H2)}

              {renderPipe(path_CH2_P5, COLOR_SAMPLE)}
              <g transform="translate(500,280)">
                {renderPipe(arc_5_4, COLOR_SAMPLE)}
                {renderPipe(path_Loop_Local_4to1, COLOR_SAMPLE)}
                {renderPipe(arc_1_6, COLOR_SAMPLE)}
              </g>
              {renderPipe(path_P6_Vent, COLOR_SAMPLE)}
            </g>
          ) : (
            <g>
              {renderPipe(path_CH1_Ref, COLOR_H2)}
              {renderPipe(path_Ref_Cell, COLOR_H2)}
              {renderPipe(path_Ref_P2, COLOR_H2)}
              <g transform="translate(500,280)">
                {renderPipe(arc_2_1, COLOR_H2)}
                {renderPipe(path_Loop_Local_1to4, COLOR_H2)}
                {renderPipe(arc_4_3, COLOR_H2)}
              </g>
              {renderPipe(path_P3_Col, COLOR_H2)}
              {renderPipe(path_Col, COLOR_H2)}
              {renderPipe(path_Col_TCD, COLOR_H2)}
              {renderPipe(path_Meas_Cell, COLOR_H2)}
              {renderPipe(path_TCD_Vent, COLOR_H2)}

              {renderPipe(path_CH2_P5, COLOR_SAMPLE)}
              <g transform="translate(500,280)">
                {renderPipe(arc_5_6, COLOR_SAMPLE)}
              </g>
              {renderPipe(path_P6_Vent, COLOR_SAMPLE)}

              <path 
                key="slug-animation"
                d={path_Slug} 
                stroke={COLOR_SAMPLE} 
                strokeWidth="7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeDasharray="180 3000" 
                fill="none"
                className="flow-slug" 
                style={{ filter: 'drop-shadow(0 0 4px #f59e0b)' }}
              />
            </g>
          )}

          <g transform="translate(500, 280)">
            <circle cx="0" cy="-60" r="6" fill="#e4e4e7" /> <text x="0" y="-72" fill="#18181b" fontSize="14" fontWeight="bold" textAnchor="middle">1</text>
            <circle cx="52" cy="-30" r="6" fill="#e4e4e7" /> <text x="65" y="-35" fill="#e4e4e7" fontSize="14" fontWeight="bold" textAnchor="start">2</text>
            <circle cx="52" cy="30" r="6" fill="#e4e4e7" /> <text x="65" y="35" fill="#e4e4e7" fontSize="14" fontWeight="bold" textAnchor="start">3</text>
            <circle cx="0" cy="60" r="6" fill="#e4e4e7" /> <text x="0" y="80" fill="#e4e4e7" fontSize="14" fontWeight="bold" textAnchor="middle">4</text>
            <circle cx="-52" cy="30" r="6" fill="#e4e4e7" /> <text x="-65" y="35" fill="#e4e4e7" fontSize="14" fontWeight="bold" textAnchor="end">5</text>
            <circle cx="-52" cy="-30" r="6" fill="#e4e4e7" /> <text x="-65" y="-35" fill="#e4e4e7" fontSize="14" fontWeight="bold" textAnchor="end">6</text>
          </g>

          <g transform="translate(650, 200)">
            <path d="M 0 10 L -150 80" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="2 2" fill="none" />
            <text x="5" y="14" fill="#f59e0b" fontSize="12" fontWeight="bold">1mL 内置定量环 (Loop)</text>
          </g>
          
          {valveState === 'baseline' && (
            <g transform="translate(600, 290)">
              <path d="M 0 0 L -45 -10" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="2 2" fill="none" />
              <rect x="0" y="-12" width="100" height="24" rx="4" fill="#27272a" stroke="#52525b" />
              <text x="50" y="4" fill="#3b82f6" fontSize="11" textAnchor="middle" fontWeight="bold">内部等效阻尼槽</text>
            </g>
          )}

          <rect x="30" y="170" width="100" height="40" rx="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
          <text x="80" y="195" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">CH1 载气 (H2)</text>
          
          <rect x="30" y="360" width="100" height="40" rx="4" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
          <text x="80" y="385" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">CH2 样气</text>

          <text x="370" y="254" fill="#71717a" fontSize="12" textAnchor="end">样气排空 (Vent)</text>
          <text x="900" y="514" fill="#71717a" fontSize="12" textAnchor="start">系统总排空 (Vent)</text>
        </svg>
      </div>

      {/* 状态说明面板 */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 mb-8 text-zinc-300">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Info size={18} className="text-blue-500" /> 内置定量环反吹流动原理解析 (Slug Flow)
        </h3>
        {valveState === 'baseline' ? (
          <ul className="space-y-3 text-sm leading-relaxed">
            <li><strong className="text-emerald-400">1. 载气旁路直通：</strong>蓝色的载气经过参比池后，进入 <strong>2 号口</strong>，通过内部阻尼槽直达 <strong>3 号口</strong>，进入色谱柱。</li>
            <li><strong className="text-amber-400">2. 样气充满定量环：</strong>橙色的样气从 <strong>5 号口</strong> 进入，连通 <strong>4 号口</strong> 注入内置的 S 型定量环，再从 <strong>1 号口</strong> 出来，通过 <strong>6 号口</strong> 排空。</li>
          </ul>
        ) : (
          <ul className="space-y-3 text-sm leading-relaxed">
            <li><strong className="text-rose-400">1. 柱塞流反吹进样 (30秒单次推送)：</strong>阀门转动 60°。载气进 <strong>2 号口</strong>，连通 <strong>1 号口</strong>。强大的载气将内置定量环内的有限样气<strong>作为独立柱塞（Slug）逆向推出</strong>，随后经 <strong>3 号口</strong> 注入色谱柱进行分离。动画会缓慢执行 30 秒，模拟单次进样过程，完成后不再重复。</li>
            <li><strong className="text-amber-400">2. 样气旁路排空：</strong>多余的源头样气从 <strong>5 号口</strong> 进，直接从 <strong>6 号口</strong> 无阻力排空。</li>
          </ul>
        )}
      </div>
    </div>
  );
}
