# 色谱气路逻辑与动画演示

本章节演示了 10 通阀和 6 通阀在色谱边缘工作站中的物理气路与中心切割、反吹逻辑。

## 1. 10通阀双柱系统：轻重组分分离与反吹

**应用场景**：分析环境或工业气体中的轻组分（$H_2, O_2, N_2, CH_4, CO$），同时将重组分（如 $CO_2$ 及水分）反吹排出，防止污染分子筛分析柱。

**分离逻辑**：
1. **预柱粗分离**：混合气首先进入 JN.PN 预柱。轻组分跑得快，作为整体气团率先切入分析柱；重组分跑得慢，滞留在预柱中。
2. **中心切割**：在轻组分刚好全部进入分析柱，而重组分尚未到达时，执行切阀操作（状态 1 -> 状态 2）。
3. **原路反吹**：切阀后，反吹载气从反方向流过预柱，将滞留的重组分原路吹出至排空口。
4. **精细分离**：进入 JN.13x 分子筛的轻组分气团，在柱内经过长时间保留，按物理属性逐渐拉开距离，最终分离为 5 个独立的组分峰进入检测器。

<div style={{display: "flex", justifyContent: "center", margin: "20px 0"}} dangerouslySetInnerHTML={{ __html: `<svg style="background-color: #252526; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 12px; max-width: 100%; height: auto;" width="800" height="620" viewBox="0 0 800 620" xmlns="http://www.w3.org/2000/svg">
<style>
        
        
        @keyframes flow { to { stroke-dashoffset: -20; } }
        @keyframes st1_anim { 0%, 9.9% { opacity: 1; } 10%, 44.9% { opacity: 0; } 45%, 100% { opacity: 1; } }
        @keyframes st2_anim { 0%, 9.9% { opacity: 0; } 10%, 44.9% { opacity: 1; } 45%, 100% { opacity: 0; } }
        .gas-line { fill: none; stroke-width: 4; stroke-dasharray: 10, 10; animation: flow 1s linear infinite; }
        .bg-line { fill: none; stroke: #4d4d4d; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }
        .st1 { animation: st1_anim 20s infinite; }
        .st2 { animation: st2_anim 20s infinite; }
    </style>

    <!-- 背景管路 -->
    <g class="bg-line">
        <path d="M 400 80 L 400 200" /> <!-- Carrier 1 In -->
        <path d="M 680 269.1 L 495.1 269.1" /> <!-- Sample In -->
        <path d="M 495.1 330.9 L 680 330.9" /> <!-- Vent 2 -->
        <path d="M 304.9 540 L 304.9 330.9" /> <!-- Carrier 2 In -->
        <path d="M 100 380.9 L 341.2 380.9" /> <!-- Vent 1 -->
        
        <!-- 定量环 -->
        <path d="M 458.8 219.1 C 550 219.1, 550 380.9, 458.8 380.9" />
        
        <!-- 预柱 JN.PN (盘管) -->
        <path d="M 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1" />
        
        <!-- 分析柱 JN.13x (盘管) -->
        <path d="M 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1" />
    </g>

    <circle cx="400" cy="300" r="110" fill="#34495E" />
    <circle cx="400" cy="300" r="90" fill="#2C3E50" />
    <!-- 阀口连线 -->
    <g stroke="#ECF0F1" stroke-width="6" stroke-linecap="round" class="st1">
        <line x1="400" y1="200" x2="341.2" y2="219.1"/>
        <line x1="458.8" y1="219.1" x2="495.1" y2="269.1"/>
        <line x1="495.1" y1="330.9" x2="458.8" y2="380.9"/>
        <line x1="400" y1="400" x2="341.2" y2="380.9"/>
        <line x1="304.9" y1="330.9" x2="304.9" y2="269.1"/>
    </g>
    <g stroke="#ECF0F1" stroke-width="6" stroke-linecap="round" class="st2">
        <line x1="400" y1="200" x2="458.8" y2="219.1"/>
        <line x1="495.1" y1="269.1" x2="495.1" y2="330.9"/>
        <line x1="458.8" y1="380.9" x2="400" y2="400"/>
        <line x1="341.2" y1="380.9" x2="304.9" y2="330.9"/>
        <line x1="304.9" y1="269.1" x2="341.2" y2="219.1"/>
    </g>

    <!-- 阀口与编号 -->
    <g fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2">
        <circle cx="400" cy="200" r="8"/> <circle cx="458.8" cy="219.1" r="8"/> <circle cx="495.1" cy="269.1" r="8"/>
        <circle cx="495.1" cy="330.9" r="8"/> <circle cx="458.8" cy="380.9" r="8"/> <circle cx="400" cy="400" r="8"/>
        <circle cx="341.2" cy="380.9" r="8"/> <circle cx="304.9" cy="330.9" r="8"/> <circle cx="304.9" cy="269.1" r="8"/> <circle cx="341.2" cy="219.1" r="8"/>
    </g>
    <g fill="#FFF" font-size="12" font-weight="bold" text-anchor="middle">
        <text x="400" y="185">1</text> <text x="475" y="210">2</text> <text x="515" y="275">3</text> <text x="515" y="335">4</text>
        <text x="475" y="395">5</text> <text x="400" y="420">6</text> <text x="325" y="395">7</text> <text x="285" y="335">8</text>
        <text x="285" y="275">9</text> <text x="325" y="210">10</text>
    </g>

    <!-- 连续流气路 -->
    <g class="st1">
        <path class="gas-line" stroke="#00BFFF" d="M 400 80 L 400 200 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1" />
        <path class="gas-line" stroke="#FFA500" d="M 680 269.1 L 495.1 269.1 L 458.8 219.1 C 550 219.1, 550 380.9, 458.8 380.9 L 495.1 330.9 L 680 330.9" />
        <path class="gas-line" stroke="#00BFFF" d="M 304.9 540 L 304.9 330.9 L 304.9 269.1 L 280 269.1 L 280 460 A 20 20 0 0 0 320 460 L 320 420 A 20 20 0 0 1 360 420 L 360 460 A 20 20 0 0 0 400 460 L 400 400 L 341.2 380.9 L 100 380.9" />
    </g>
    <g class="st2">
        <path class="gas-line" stroke="#00BFFF" d="M 400 80 L 400 200 L 458.8 219.1 C 550 219.1, 550 380.9, 458.8 380.9 L 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1" />
        <path class="gas-line" stroke="#00BFFF" d="M 304.9 540 L 304.9 330.9 L 341.2 380.9 L 100 380.9" />
        <path class="gas-line" stroke="#FFA500" d="M 680 269.1 L 495.1 269.1 L 495.1 330.9 L 680 330.9" />
    </g>

    <!-- 动态分离物理逻辑：轻重组分群分离、中心切割与反吹 -->
    
    <!-- 0. 混合样气 (Orange) - 离开定量环进入预柱 -->
    <path d="M 458.8 219.1 C 550 219.1, 550 380.9, 458.8 380.9 L 400 400"
          fill="none" stroke="#FFA500" stroke-width="8" stroke-linecap="round" pathLength="400" stroke-dasharray="100 400">
        <animate attributeName="stroke-dashoffset" values="0; 0; -400; -400" keyTimes="0; 0.1; 0.2; 1" dur="20s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1; 1; 0; 0" keyTimes="0; 0.19; 0.2; 1" dur="20s" repeatCount="indefinite" />
    </path>

    <!-- 1. 轻组分带 (Light Blue: H2,O2,N2,CH4,CO 混合物) - 预柱中不分离，跑得快，整体切入分析柱 -->
    <path d="M 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1"
          fill="none" stroke="#87CEFA" stroke-width="8" stroke-linecap="round" pathLength="1000" stroke-dasharray="80 1000">
        <animate attributeName="stroke-dashoffset" values="80; 80; -500; -550; -550" keyTimes="0; 0.2; 0.45; 0.55; 1" dur="20s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0; 0; 1; 1; 0; 0" keyTimes="0; 0.19; 0.2; 0.54; 0.55; 1" dur="20s" repeatCount="indefinite" />
    </path>

    <!-- 2. 重组分杂质带 (Red) - 跑得慢，滞留预柱。切阀后折返放空 (原路反吹) -->
    <path d="M 100 380.9 L 341.2 380.9 L 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1"
          fill="none" stroke="#FF4500" stroke-width="8" stroke-linecap="round" stroke-dasharray="80 1000">
        <animate attributeName="stroke-dashoffset" values="-307; -307; -700; 80; 80" keyTimes="0; 0.2; 0.45; 0.7; 1" dur="20s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0; 0; 1; 1; 0; 0" keyTimes="0; 0.19; 0.2; 0.69; 0.7; 1" dur="20s" repeatCount="indefinite" />
    </path>

    <!-- 3. 分析柱中精分离：H2 (Green) -->
    <circle r="6" fill="#32CD32">
        <animateMotion dur="20s" repeatCount="indefinite" 
            path="M 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1"
            keyTimes="0; 0.5; 0.65; 1" 
            keyPoints="0.55; 0.55; 1; 1" 
            calcMode="linear" />
        <animate attributeName="opacity" values="0; 0; 1; 1; 0; 0" keyTimes="0; 0.49; 0.5; 0.64; 0.65; 1" dur="20s" repeatCount="indefinite" />
    </circle>

    <!-- 4. 分析柱中精分离：O2 (Cyan) -->
    <circle r="6" fill="#00FFFF">
        <animateMotion dur="20s" repeatCount="indefinite" 
            path="M 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1"
            keyTimes="0; 0.5; 0.73; 1" 
            keyPoints="0.55; 0.55; 1; 1" 
            calcMode="linear" />
        <animate attributeName="opacity" values="0; 0; 1; 1; 0; 0" keyTimes="0; 0.49; 0.5; 0.72; 0.73; 1" dur="20s" repeatCount="indefinite" />
    </circle>

    <!-- 5. 分析柱中精分离：N2 (Yellow) -->
    <circle r="6" fill="#FFFF00">
        <animateMotion dur="20s" repeatCount="indefinite" 
            path="M 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1"
            keyTimes="0; 0.5; 0.81; 1" 
            keyPoints="0.55; 0.55; 1; 1" 
            calcMode="linear" />
        <animate attributeName="opacity" values="0; 0; 1; 1; 0; 0" keyTimes="0; 0.49; 0.5; 0.80; 0.81; 1" dur="20s" repeatCount="indefinite" />
    </circle>

    <!-- 6. 分析柱中精分离：CH4 (Purple) -->
    <circle r="6" fill="#BA55D3">
        <animateMotion dur="20s" repeatCount="indefinite" 
            path="M 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1"
            keyTimes="0; 0.5; 0.89; 1" 
            keyPoints="0.55; 0.55; 1; 1" 
            calcMode="linear" />
        <animate attributeName="opacity" values="0; 0; 1; 1; 0; 0" keyTimes="0; 0.49; 0.5; 0.88; 0.89; 1" dur="20s" repeatCount="indefinite" />
    </circle>

    <!-- 7. 分析柱中精分离：CO (White) -->
    <circle r="6" fill="#FFFFFF">
        <animateMotion dur="20s" repeatCount="indefinite" 
            path="M 400 400 L 400 460 A 20 20 0 0 1 360 460 L 360 420 A 20 20 0 0 0 320 420 L 320 460 A 20 20 0 0 1 280 460 L 280 269.1 L 304.9 269.1 L 341.2 219.1 L 280 219.1 A 20 20 0 0 0 280 169.1 L 320 169.1 A 20 20 0 0 1 320 119.1 L 280 119.1 A 20 20 0 0 0 280 69.1 L 320 69.1 A 20 20 0 0 1 320 19.1 L 150 19.1"
            keyTimes="0; 0.5; 0.97; 1" 
            keyPoints="0.55; 0.55; 1; 1" 
            calcMode="linear" />
        <animate attributeName="opacity" values="0; 0; 1; 1; 0; 0" keyTimes="0; 0.49; 0.5; 0.96; 0.97; 1" dur="20s" repeatCount="indefinite" />
    </circle>

    <!-- 文本和标签 -->
    <text x="400" y="70" text-anchor="middle" fill="#00BFFF" font-weight="bold">载气 1 (主气路)</text>
    <text x="690" y="265" text-anchor="start" fill="#FFA500" font-weight="bold">样品气 IN</text>
    <text x="690" y="335" text-anchor="start" fill="#BDC3C7">放空 2</text>
    <text x="305" y="555" text-anchor="middle" fill="#00BFFF" font-weight="bold">载气 2 (反吹气路)</text>
    <text x="100" y="400" text-anchor="middle" fill="#BDC3C7">放空 1 (反吹排废口)</text>
    <text x="560" y="300" text-anchor="start" fill="#FFF">定量环</text>

    <!-- 柱子标签 -->
    <rect x="250" y="490" width="100" height="25" rx="5" fill="#34495E" />
    <text x="300" y="507" text-anchor="middle" fill="#FFF" font-size="12">预柱: JN.PN</text>
    
    <rect x="240" y="25" width="130" height="25" rx="5" fill="#34495E" />
    <text x="305" y="42" text-anchor="middle" fill="#FFF" font-size="12">分析柱: JN.13x</text>

    <!-- TCD 标签 -->
    <rect x="100" y="0" width="60" height="40" rx="5" fill="#D35400" stroke="#E67E22" stroke-width="2"/>
    <text x="130" y="25" fill="#FFF" font-size="14" text-anchor="middle" font-weight="bold">TCD</text>

    <!-- 状态面板 -->
    <rect x="560" y="20" width="220" height="90" rx="10" fill="#1A252F" stroke="#7F8C8D" stroke-width="2"/>
    <text x="575" y="45" fill="#FFF" font-size="14" font-weight="bold">10通阀气路逻辑演示</text>
    <text x="575" y="70" fill="#ECF0F1" font-size="12">轻重组分群分离与反吹</text>
    <g class="st1">
        <text x="575" y="95" fill="#F1C40F" font-size="14" font-weight="bold">阶段 1: 取样 / 杂质反吹</text>
    </g>
    <g class="st2">
        <text x="575" y="95" fill="#2ECC71" font-size="14" font-weight="bold">阶段 2: 进样 / 预柱推气</text>
    </g>

    <!-- 图例 -->
    <rect x="470" y="415" width="315" height="185" rx="10" fill="#1A252F" stroke="#7F8C8D" stroke-width="1"/>
    
    <!-- 左列 -->
    <circle cx="490" cy="445" r="6" fill="#00BFFF"/>
    <text x="505" y="450" fill="#FFF" font-size="13">载气流 (Carrier)</text>
    
    <path d="M 484 485 L 496 485" stroke="#87CEFA" stroke-width="8" stroke-linecap="round"/>
    <text x="505" y="490" fill="#FFF" font-size="13">轻组分带 (目标混合气)</text>
    
    <path d="M 484 525 L 496 525" stroke="#FF4500" stroke-width="8" stroke-linecap="round"/>
    <text x="505" y="530" fill="#FFF" font-size="13">重组分带 (CO2等杂质)</text>
    
    <!-- 右列: 五种分离组分 -->
    <circle cx="655" cy="445" r="6" fill="#32CD32"/>
    <text x="670" y="450" fill="#FFF" font-size="13">氢气 (H2)</text>
    
    <circle cx="655" cy="475" r="6" fill="#00FFFF"/>
    <text x="670" y="480" fill="#FFF" font-size="13">氧气 (O2)</text>
    
    <circle cx="655" cy="505" r="6" fill="#FFFF00"/>
    <text x="670" y="510" fill="#FFF" font-size="13">氮气 (N2)</text>
    
    <circle cx="655" cy="535" r="6" fill="#BA55D3"/>
    <text x="670" y="540" fill="#FFF" font-size="13">甲烷 (CH4)</text>
    
    <circle cx="655" cy="565" r="6" fill="#FFFFFF" />
    <text x="670" y="570" fill="#FFF" font-size="13">一氧化碳 (CO)</text>

</svg>` }} />

---

## 2. 6通阀单柱系统：四氢噻吩 (THT) 进样与分离

**应用场景**：天然气中四氢噻吩 (THT) 臭味剂的单组分定量分析。

**分离逻辑**：
1. **取样阶段**：样品气流经定量环，多余气体排空，此时定量环内充满纯样气。
2. **进样阶段**：切阀后，载气将定量环中的整段样气推入特氟龙分析柱（JN.THT）。
3. **柱内分离**：目标物四氢噻吩与天然气基质（如甲烷等背景气体）在柱内按保留时间差异分离，先后进入检测器出峰。

<div style={{display: "flex", justifyContent: "center", margin: "20px 0"}} dangerouslySetInnerHTML={{ __html: `<svg style="background-color: #252526; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 12px; max-width: 100%; height: auto;" width="800" height="620" viewBox="0 0 800 620" xmlns="http://www.w3.org/2000/svg">
<style>
        
        
        @keyframes flow { to { stroke-dashoffset: -20; } }
        @keyframes state1 { 0%, 33.2% { opacity: 1; } 33.3%, 100% { opacity: 0; } }
        @keyframes state2 { 0%, 33.2% { opacity: 0; } 33.3%, 100% { opacity: 1; } }
        .gas-line { fill: none; stroke-width: 4; stroke-dasharray: 10, 10; animation: flow 1s linear infinite; }
        .bg-line { fill: none; stroke: #4d4d4d; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }
        .st1 { animation: state1 15s infinite; }
        .st2 { animation: state2 15s infinite; }
    </style>

    <!-- 背景管路 -->
    <g class="bg-line">
        <path d="M 400 80 L 400 200" /> <!-- Carrier In -->
        <path d="M 680 340 L 469.3 340" /> <!-- Sample In -->
        <path d="M 400 380 L 400 500" /> <!-- Vent -->
        <!-- 盘管分析柱 -->
        <path d="M 330.7 260 L 250 260 A 20 20 0 0 0 250 200 L 290 200 A 20 20 0 0 1 290 140 L 250 140 A 20 20 0 0 0 250 80 L 150 80" />
        <!-- 定量环 -->
        <path d="M 469.3 260 L 330.7 340" />
    </g>

    <circle cx="400" cy="300" r="110" fill="#34495E" />
    <circle cx="400" cy="300" r="90" fill="#2C3E50" />

    <!-- 阀口连线 -->
    <g stroke="#ECF0F1" stroke-width="6" stroke-linecap="round" class="st1">
        <line x1="400" y1="200" x2="330.7" y2="260"/>
        <line x1="469.3" y1="260" x2="469.3" y2="340"/>
        <line x1="400" y1="380" x2="330.7" y2="340"/>
    </g>
    <g stroke="#ECF0F1" stroke-width="6" stroke-linecap="round" class="st2">
        <line x1="400" y1="200" x2="469.3" y2="260"/>
        <line x1="469.3" y1="340" x2="400" y2="380"/>
        <line x1="330.7" y1="340" x2="330.7" y2="260"/>
    </g>

    <!-- 阀口 -->
    <g fill="#ECF0F1" stroke="#BDC3C7" stroke-width="2">
        <circle cx="400" cy="200" r="8"/> <circle cx="469.3" cy="260" r="8"/> <circle cx="469.3" cy="340" r="8"/>
        <circle cx="400" cy="380" r="8"/> <circle cx="330.7" cy="340" r="8"/> <circle cx="330.7" cy="260" r="8"/>
    </g>
    <g fill="#FFF" font-size="12" font-weight="bold" text-anchor="middle">
        <text x="400" y="185">1</text> <text x="485" y="255">2</text> <text x="485" y="355">3</text>
        <text x="400" y="405">4</text> <text x="315" y="355">5</text> <text x="315" y="255">6</text>
    </g>

    <!-- 连续流气路 -->
    <g class="st1">
        <path class="gas-line" stroke="#00BFFF" d="M 400 80 L 400 200 L 330.7 260 L 250 260 A 20 20 0 0 0 250 200 L 290 200 A 20 20 0 0 1 290 140 L 250 140 A 20 20 0 0 0 250 80 L 150 80" />
        <path class="gas-line" stroke="#FFA500" d="M 680 340 L 469.3 340 L 469.3 260 L 330.7 340 L 400 380 L 400 500" />
    </g>
    <g class="st2">
        <path class="gas-line" stroke="#00BFFF" d="M 400 80 L 400 200 L 469.3 260 L 330.7 340 L 330.7 260 L 250 260 A 20 20 0 0 0 250 200 L 290 200 A 20 20 0 0 1 290 140 L 250 140 A 20 20 0 0 0 250 80 L 150 80" />
        <path class="gas-line" stroke="#FFA500" d="M 680 340 L 469.3 340 L 400 380 L 400 500" />
    </g>

    <!-- 动态分离物理逻辑 -->
    <!-- Orange Sample Plug -->
    <path d="M 469.3 260 L 330.7 340 L 330.7 260 L 250 260 A 20 20 0 0 0 250 200 L 290 200 A 20 20 0 0 1 290 140 L 250 140 A 20 20 0 0 0 250 80 L 150 80" 
          fill="none" stroke="#FFA500" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="15 100">
        <animate attributeName="stroke-dashoffset" values="0;0;-30;-30" keyTimes="0;0.333;0.533;1" dur="15s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.332;0.333;0.466;0.533;1" dur="15s" repeatCount="indefinite" />
    </path>

    <!-- Green THT Plug -->
    <path d="M 469.3 260 L 330.7 340 L 330.7 260 L 250 260 A 20 20 0 0 0 250 200 L 290 200 A 20 20 0 0 1 290 140 L 250 140 A 20 20 0 0 0 250 80 L 150 80" 
          fill="none" stroke="#32CD32" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="10 100">
        <animate attributeName="stroke-dashoffset" values="-20;-20;-40;-100;-100" keyTimes="0;0.466;0.533;0.866;1" dur="15s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.466;0.533;0.866;0.88;1" dur="15s" repeatCount="indefinite" />
    </path>

    <!-- Red Impurities Plug -->
    <path d="M 469.3 260 L 330.7 340 L 330.7 260 L 250 260 A 20 20 0 0 0 250 200 L 290 200 A 20 20 0 0 1 290 140 L 250 140 A 20 20 0 0 0 250 80 L 150 80" 
          fill="none" stroke="#FF4500" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="10 100">
        <animate attributeName="stroke-dashoffset" values="-15;-15;-30;-100" keyTimes="0;0.466;0.533;1" dur="15s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.466;0.533;0.98;1" dur="15s" repeatCount="indefinite" />
    </path>

    <!-- 文本和标签 (布局优化，不遮挡柱子) -->
    <text x="400" y="70" text-anchor="middle" fill="#00BFFF" font-weight="bold">载气 (Carrier)</text>
    <text x="690" y="345" text-anchor="start" fill="#FFA500" font-weight="bold">样品气 IN</text>
    <text x="400" y="520" text-anchor="middle" fill="#BDC3C7">放空 (Vent)</text>
    <text x="415" y="315" text-anchor="start" fill="#FFF" font-size="12">定量环</text>

    <!-- 分析柱标签 -->
    <rect x="230" y="25" width="150" height="25" rx="5" fill="#34495E" />
    <text x="305" y="42" text-anchor="middle" fill="#FFF" font-size="12">分析柱: JN.四氢噻吩柱</text>
    
    <!-- FID 标签 -->
    <rect x="100" y="60" width="60" height="40" rx="5" fill="#D35400" stroke="#E67E22" stroke-width="2"/>
    <text x="130" y="85" fill="#FFF" font-size="14" text-anchor="middle" font-weight="bold">FID</text>

    <!-- 状态面板 -->
    <rect x="560" y="20" width="220" height="90" rx="10" fill="#1A252F" stroke="#7F8C8D" stroke-width="2"/>
    <text x="575" y="45" fill="#FFF" font-size="14" font-weight="bold">6通阀气路逻辑演示</text>
    <text x="575" y="70" fill="#ECF0F1" font-size="12">四氢噻吩(THT)进样分离</text>
    <g class="st1">
        <text x="575" y="95" fill="#F1C40F" font-size="14" font-weight="bold">阶段 1: 取样 (Load)</text>
    </g>
    <g class="st2">
        <text x="575" y="95" fill="#2ECC71" font-size="14" font-weight="bold">阶段 2: 进样与分离</text>
    </g>

    <!-- 图例 -->
    <rect x="480" y="520" width="300" height="80" rx="10" fill="#1A252F" stroke="#7F8C8D" stroke-width="1"/>
    <circle cx="500" cy="545" r="6" fill="#00BFFF"/>
    <text x="515" y="550" fill="#FFF" font-size="13">载气流 (Carrier Gas)</text>
    <circle cx="500" cy="575" r="6" fill="#FFA500"/>
    <text x="515" y="580" fill="#FFF" font-size="13">混合样品 (Sample Plug)</text>
    
    <circle cx="630" cy="545" r="6" fill="#32CD32"/>
    <text x="645" y="550" fill="#FFF" font-size="13">目标物: THT</text>
    <circle cx="630" cy="575" r="6" fill="#FF4500"/>
    <text x="645" y="580" fill="#FFF" font-size="13">杂质 (Impurities)</text>

</svg>` }} />

