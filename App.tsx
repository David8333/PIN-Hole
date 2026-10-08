
import React, { useState, useMemo } from 'react';

type Dimension = number | '';
type ShapeType = 'rectangle' | 'circle' | 'slot';

interface ShapeState {
  type: ShapeType;
  length: Dimension;
  width: Dimension;
  diameter: Dimension;
  color: string;
}

// 精選設計感配色
const SHAPE_A_PRESETS = ['#1a1c1e', '#1e3a8a', '#064e3b']; // 深邃黑, 寶石藍, 森林綠
const SHAPE_B_PRESETS = ['#b45309', '#be123c', '#4338ca']; // 琥珀橘, 寶石紅, 靛青藍

const App: React.FC = () => {
  const [shapeA, setShapeA] = useState<ShapeState>({
    type: 'rectangle',
    length: '',
    width: '',
    diameter: '',
    color: SHAPE_A_PRESETS[0]
  });

  const [shapeB, setShapeB] = useState<ShapeState>({
    type: 'rectangle',
    length: '',
    width: '',
    diameter: '',
    color: SHAPE_B_PRESETS[0]
  });

  // 計算圖形邊界與預覽數據
  const previewData = useMemo(() => {
    const getEffectiveDims = (s: ShapeState) => {
      if (s.type === 'circle') {
        const d = Number(s.diameter) || 0;
        return { l: d, w: d };
      }
      return { l: Number(s.length) || 0, w: Number(s.width) || 0 };
    };

    const d1 = getEffectiveDims(shapeA);
    const d2 = getEffectiveDims(shapeB);

    const maxL = Math.max(d1.l, d2.l, 10);
    const maxW = Math.max(d1.w, d2.w, 10);
    
    const viewBoxWidth = maxL * 1.3;
    const viewBoxHeight = maxW * 1.3;

    // 計算單邊差異 (中心對齊時，單邊差值 = 總長度差 / 2)
    const rawDiffL = Math.abs(d1.l - d2.l) / 2;
    const rawDiffW = Math.abs(d1.w - d2.w) / 2;

    // 狀態偵測
    const hasInterference = d1.l > 0 && d1.w > 0 && d2.l > 0 && d2.w > 0 && (d2.l > d1.l || d2.w > d1.w);
    // 更新緊配範圍至 0.03mm
    const isTightFitL = rawDiffL >= 0 && rawDiffL <= 0.03 && (d1.l > 0 && d2.l > 0);
    const isTightFitW = rawDiffW >= 0 && rawDiffW <= 0.03 && (d1.w > 0 && d2.w > 0);

    return {
      d1, d2,
      viewBoxWidth,
      viewBoxHeight,
      centerX: viewBoxWidth / 2,
      centerY: viewBoxHeight / 2,
      diffL: (d1.l && d2.l) ? rawDiffL.toFixed(3) : '0.000',
      diffW: (d1.w && d2.w) ? rawDiffW.toFixed(3) : '0.000',
      hasInterference,
      isTightFitL,
      isTightFitW
    };
  }, [shapeA, shapeB]);

  const handleReset = (setter: React.Dispatch<React.SetStateAction<ShapeState>>) => {
    setter(prev => ({
      ...prev,
      length: '',
      width: '',
      diameter: ''
    }));
  };

  const renderShape = (shape: ShapeState, dims: { l: number, w: number }, center: { x: number, y: number }) => {
    if (dims.l <= 0 || dims.w <= 0) return null;

    const commonProps = {
      fill: 'none',
      stroke: shape.color,
      strokeWidth: 1, // 更改為 1mm 粗細
      className: "transition-all duration-300 ease-in-out",
      vectorEffect: "non-scaling-stroke" as const
    };

    switch (shape.type) {
      case 'rectangle':
        return (
          <rect
            x={center.x - dims.l / 2}
            y={center.y - dims.w / 2}
            width={dims.l}
            height={dims.w}
            {...commonProps}
          />
        );
      case 'circle':
        return (
          <circle
            cx={center.x}
            cy={center.y}
            r={dims.l / 2}
            {...commonProps}
          />
        );
      case 'slot':
        const r = dims.w / 2;
        const straightL = Math.max(0, dims.l - dims.w);
        const xStart = center.x - straightL / 2;
        
        const pathData = `
          M ${xStart} ${center.y - r}
          h ${straightL}
          a ${r} ${r} 0 1 1 0 ${dims.w}
          h ${-straightL}
          a ${r} ${r} 0 1 1 0 ${-dims.w}
          z
        `;
        return <path d={pathData} {...commonProps} />;
    }
  };

  const renderInputs = (shape: ShapeState, setter: React.Dispatch<React.SetStateAction<ShapeState>>, label: string, presets: string[]) => (
    <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleReset(setter)}
            className="text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-500 border border-slate-200 px-2 py-1 rounded transition-colors flex items-center gap-1 shadow-sm"
            title="清空數值"
          >
            <i className="fas fa-rotate-left"></i> 重置
          </button>
          <select 
            value={shape.type}
            onChange={(e) => setter({...shape, type: e.target.value as ShapeType})}
            className="text-[11px] font-medium bg-white border border-slate-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          >
            <option value="rectangle">矩形 (Rectangle)</option>
            <option value="circle">圓形 (Circle)</option>
            <option value="slot">橢圓形 (Slot/Milled)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shape.type === 'circle' ? (
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">直徑 (Diameter) mm</label>
            <input
              type="number"
              placeholder=" "
              value={shape.diameter}
              onChange={(e) => setter({ ...shape, diameter: e.target.value === '' ? '' : Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-900 outline-none text-sm transition-all shadow-sm"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">長度 (Length) mm</label>
              <input
                type="number"
                placeholder=" "
                value={shape.length}
                onChange={(e) => setter({ ...shape, length: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-900 outline-none text-sm transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">寬度 (Width) mm</label>
              <input
                type="number"
                placeholder=" "
                value={shape.width}
                onChange={(e) => setter({ ...shape, width: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-slate-900 outline-none text-sm transition-all shadow-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => setter({ ...shape, color: c })}
            className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 shadow-md ${shape.color === c ? 'border-slate-900 ring-4 ring-slate-100' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      <aside className="w-full md:w-85 bg-white border-r border-slate-200 p-6 shadow-xl flex flex-col gap-6 overflow-y-auto z-20">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg">
            <i className="fas fa-microchip text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">PRECISION</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mechanical Overlay</p>
          </div>
        </div>

        {renderInputs(shapeA, setShapeA, "孔尺寸 A", SHAPE_A_PRESETS)}
        {renderInputs(shapeB, setShapeB, "軸尺寸 B", SHAPE_B_PRESETS)}

        {/* 數值差異顯示面板 */}
        <div className="p-5 bg-indigo-950 text-white rounded-2xl shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-calculator"></i> 單邊數值差異 (Offset)
            </h3>
            {previewData.hasInterference && (
              <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse">
                干涉警示
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-xl border transition-colors ${previewData.isTightFitL ? 'bg-cyan-900/40 border-cyan-500/50' : 'bg-white/10 border-white/10'}`}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] text-indigo-200">Δ 長度 (Side)</p>
                {previewData.isTightFitL && <span className="text-[8px] bg-cyan-400 text-cyan-950 px-1 rounded font-bold">緊配</span>}
              </div>
              <p className={`text-xl font-mono font-bold ${previewData.isTightFitL ? 'text-cyan-300' : 'text-white'}`}>{previewData.diffL} <span className="text-[10px]">mm</span></p>
            </div>
            <div className={`p-3 rounded-xl border transition-colors ${previewData.isTightFitW ? 'bg-cyan-900/40 border-cyan-500/50' : 'bg-white/10 border-white/10'}`}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] text-indigo-200">Δ 寬度 (Side)</p>
                {previewData.isTightFitW && <span className="text-[8px] bg-cyan-400 text-cyan-950 px-1 rounded font-bold">緊配</span>}
              </div>
              <p className={`text-xl font-mono font-bold ${previewData.isTightFitW ? 'text-cyan-300' : 'text-white'}`}>{previewData.diffW} <span className="text-[10px]">mm</span></p>
            </div>
          </div>

          {previewData.hasInterference && (
            <div className="bg-red-500/20 border border-red-500/30 p-2 rounded-lg flex items-start gap-2">
              <i className="fas fa-exclamation-triangle text-red-400 text-[10px] mt-0.5"></i>
              <p className="text-[9px] text-red-200 leading-tight">軸尺寸 B 已超出孔尺寸 A 範圍，請檢查尺寸設定。</p>
            </div>
          )}

          <p className="text-[9px] text-indigo-400 italic">
            * 緊配範圍：0mm ~ 0.03mm
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          線條定義：1.0 mm | 單位：毫米
        </div>
      </aside>

      {/* 主預覽區域 */}
      <main className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4 md:p-10">
          <div className="w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl border border-slate-200 flex items-center justify-center overflow-hidden relative group">
            
            {/* 工業級格線背景 */}
            <div className="absolute inset-0 opacity-[0.06]" style={{ 
              backgroundImage: 'linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', 
              backgroundSize: '100px 100px' 
            }}></div>
            <div className="absolute inset-0 opacity-[0.03]" style={{ 
              backgroundImage: 'linear-gradient(#000 0.2px, transparent 0.2px), linear-gradient(90deg, #000 0.2px, transparent 0.2px)', 
              backgroundSize: '10px 10px' 
            }}></div>

            {/* SVG 繪圖區 */}
            <svg
              viewBox={`0 0 ${previewData.viewBoxWidth} ${previewData.viewBoxHeight}`}
              className="w-[90%] h-[90%] transition-transform duration-700 hover:scale-[1.02]"
              preserveAspectRatio="xMidYMid meet"
            >
              {renderShape(shapeA, previewData.d1, { x: previewData.centerX, y: previewData.centerY })}
              {renderShape(shapeB, previewData.d2, { x: previewData.centerX, y: previewData.centerY })}

              {/* 精密中心十字標記 */}
              <g opacity="0.3">
                <line 
                  x1={previewData.centerX - previewData.viewBoxWidth/100} y1={previewData.centerY} 
                  x2={previewData.centerX + previewData.viewBoxWidth/100} y2={previewData.centerY} 
                  stroke="#94a3b8" strokeWidth="0.1" 
                />
                <line 
                  x1={previewData.centerX} y1={previewData.centerY - previewData.viewBoxWidth/100} 
                  x2={previewData.centerX} y2={previewData.centerY + previewData.viewBoxWidth/100} 
                  stroke="#94a3b8" strokeWidth="0.1" 
                />
              </g>
            </svg>

            {/* 未輸入數據時的提示 */}
            {!previewData.d1.l && !previewData.d2.l && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none transition-opacity duration-500">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                  <i className="fas fa-layer-group text-4xl text-slate-200"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-400">等待輸入幾何參數</h3>
                <p className="text-sm mt-2">請設定長、寬或直徑以查看精密預覽</p>
              </div>
            )}
            
            {/* 標籤懸浮提示 */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/5 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-900/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:block">
              Scale to Fit Viewport | Center Aligned Mode
            </div>
          </div>
        </div>

        {/* 底部狀態列 */}
        <div className="px-10 py-4 bg-white/70 backdrop-blur-md border-t border-slate-200 flex justify-between items-center text-[10px] font-mono text-slate-500">
          <div className="flex gap-8">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{backgroundColor: shapeA.color}}></span>
              孔: {shapeA.type.toUpperCase()} [{previewData.d1.l}x{previewData.d1.w}]
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{backgroundColor: shapeB.color}}></span>
              軸: {shapeB.type.toUpperCase()} [{previewData.d2.l}x{previewData.d2.w}]
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <span className={`px-2 py-0.5 rounded font-bold transition-colors ${previewData.hasInterference ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
              {previewData.hasInterference ? 'INTERFERENCE DETECTED' : 'STROKE: 1.0MM'}
            </span>
            <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-bold">UNITS: MM</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
