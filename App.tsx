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

// 精選高對比設計感配色
const SHAPE_A_PRESETS = ['#1a1c1e', '#1e3a8a', '#064e3b', '#0f766e']; // 深邃黑, 寶石藍, 森林綠, 深青綠
const SHAPE_B_PRESETS = ['#d97706', '#e11d48', '#4f46e5', '#9333ea']; // 琥珀橘, 寶石紅, 靛青藍, 皇家紫

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

  const [zoom, setZoom] = useState<number>(1);
  const [mobileCompactGrid, setMobileCompactGrid] = useState<boolean>(true);

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

    const paddingFactor = 1.35 / zoom;
    const viewBoxWidth = Math.max(maxL * paddingFactor, 1);
    const viewBoxHeight = Math.max(maxW * paddingFactor, 1);

    // 計算單邊差異 (中心對齊時，單邊差值 = 總長度差 / 2)
    const rawDiffL = Math.abs(d1.l - d2.l) / 2;
    const rawDiffW = Math.abs(d1.w - d2.w) / 2;

    // 狀態偵測
    const hasInterference =
      d1.l > 0 && d1.w > 0 && d2.l > 0 && d2.w > 0 && (d2.l > d1.l || d2.w > d1.w);
    // 緊配範圍 0 ~ 0.03mm
    const isTightFitL = rawDiffL >= 0 && rawDiffL <= 0.03 && d1.l > 0 && d2.l > 0;
    const isTightFitW = rawDiffW >= 0 && rawDiffW <= 0.03 && d1.w > 0 && d2.w > 0;

    return {
      d1,
      d2,
      viewBoxWidth,
      viewBoxHeight,
      centerX: viewBoxWidth / 2,
      centerY: viewBoxHeight / 2,
      diffL: d1.l && d2.l ? rawDiffL.toFixed(3) : '0.000',
      diffW: d1.w && d2.w ? rawDiffW.toFixed(3) : '0.000',
      hasInterference,
      isTightFitL,
      isTightFitW
    };
  }, [shapeA, shapeB, zoom]);

  const handleReset = (setter: React.Dispatch<React.SetStateAction<ShapeState>>) => {
    setter((prev) => ({
      ...prev,
      length: '',
      width: '',
      diameter: ''
    }));
  };

  const handleLoadDemo = () => {
    setShapeA((prev) => ({
      ...prev,
      type: 'rectangle',
      length: 50,
      width: 30,
      diameter: 50
    }));
    setShapeB((prev) => ({
      ...prev,
      type: 'rectangle',
      length: 49.96,
      width: 29.96,
      diameter: 49.96
    }));
    setZoom(1);
  };

  const handleResetAll = () => {
    handleReset(setShapeA);
    handleReset(setShapeB);
    setZoom(1);
  };

  const renderShape = (
    shape: ShapeState,
    dims: { l: number; w: number },
    center: { x: number; y: number }
  ) => {
    if (dims.l <= 0 || dims.w <= 0) return null;

    const commonProps = {
      fill: 'none',
      stroke: shape.color,
      strokeWidth: 1.5,
      className: 'transition-all duration-200 ease-out',
      vectorEffect: 'non-scaling-stroke' as const
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
        return <circle cx={center.x} cy={center.y} r={dims.l / 2} {...commonProps} />;
      case 'slot': {
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
    }
  };

  const renderInputs = (
    shape: ShapeState,
    setter: React.Dispatch<React.SetStateAction<ShapeState>>,
    label: string,
    presets: string[]
  ) => (
    <div className="space-y-2.5 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex flex-wrap justify-between items-center gap-1.5 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: shape.color }}
          />
          <h2 className="text-xs font-bold text-slate-700 tracking-wide whitespace-nowrap">
            {label}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleReset(setter)}
            className="text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
            title="清空數值"
          >
            <i className="fas fa-rotate-left text-[10px]"></i> 重置
          </button>
          <select
            value={shape.type}
            onChange={(e) => setter({ ...shape, type: e.target.value as ShapeType })}
            aria-label={`${label} 形狀選擇`}
            className="text-[11px] font-semibold bg-white border border-slate-300 text-slate-800 rounded-md px-1.5 py-1 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          >
            <option value="rectangle">矩形</option>
            <option value="circle">圓形</option>
            <option value="slot">橢圓孔(Slot)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {shape.type === 'circle' ? (
          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              直徑 (Diameter) mm
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="輸入直徑 (mm)"
              value={shape.diameter}
              onChange={(e) =>
                setter({
                  ...shape,
                  diameter: e.target.value === '' ? '' : Number(e.target.value)
                })
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-slate-900 outline-none text-sm font-mono transition-all shadow-sm"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 truncate">
                長度 (L) mm
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="長度"
                value={shape.length}
                onChange={(e) =>
                  setter({
                    ...shape,
                    length: e.target.value === '' ? '' : Number(e.target.value)
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-slate-900 outline-none text-sm font-mono transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 truncate">
                寬度 (W) mm
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="寬度"
                value={shape.width}
                onChange={(e) =>
                  setter({
                    ...shape,
                    width: e.target.value === '' ? '' : Number(e.target.value)
                  })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-slate-900 outline-none text-sm font-mono transition-all shadow-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setter({ ...shape, color: c })}
              aria-label={`選擇預設顏色 ${c}`}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 transition-transform hover:scale-105 active:scale-95 shadow-sm ${
                shape.color.toLowerCase() === c.toLowerCase()
                  ? 'border-slate-900 ring-2 ring-slate-300 scale-105'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <label
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
          title="自選圖形顏色"
        >
          <input
            type="color"
            value={shape.color}
            onChange={(e) => setter({ ...shape, color: e.target.value })}
            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
          />
          <span>自選色</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] md:h-screen w-full flex flex-col md:flex-row bg-slate-100 text-slate-900 overflow-x-hidden md:overflow-hidden">
      {/* 頂部導覽列 (手機版顯示，確保所有畫面與操作一目了然) */}
      <header className="flex md:hidden items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-200 shrink-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-sm">
            <i className="fas fa-microchip text-xs"></i>
          </div>
          <span className="text-sm font-extrabold tracking-tight text-slate-900">
            孔軸快速配
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          >
            範例尺寸
          </button>
          <button
            type="button"
            onClick={() => setMobileCompactGrid((prev) => !prev)}
            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap"
          >
            {mobileCompactGrid ? '單欄展開' : '並排全覽'}
          </button>
        </div>
      </header>

      {/*
        主預覽區域：
        - 手機版排在上方 (order-1)，固定適當高度讓圖形、差值與下方輸入框在同一畫面完整呈現
        - 電腦版排在右側 (md:order-2)，佔滿剩餘寬度與高度 (flex-1)
      */}
      <main className="order-1 md:order-2 flex-1 flex flex-col bg-slate-100 relative min-w-0 md:h-full overflow-hidden">
        <div className="w-full h-[32dvh] min-h-[200px] max-h-[320px] md:max-h-none md:h-full flex-1 flex items-center justify-center p-2.5 sm:p-4 md:p-8">
          <div className="w-full h-full bg-white rounded-2xl md:rounded-[2rem] shadow-lg border border-slate-200/90 flex items-center justify-center overflow-hidden relative">
            {/* 工業級格線背景 */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)',
                backgroundSize: '80px 80px'
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(#000 0.2px, transparent 0.2px), linear-gradient(90deg, #000 0.2px, transparent 0.2px)',
                backgroundSize: '16px 16px'
              }}
            />

            {/* 左上角圖例標籤 */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px] font-mono text-slate-700 shadow-sm">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: shapeA.color }}
                />
                孔A: {previewData.d1.l || 0}×{previewData.d1.w || 0}
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: shapeB.color }}
                />
                軸B: {previewData.d2.l || 0}×{previewData.d2.w || 0}
              </span>
            </div>

            {/* 右上角縮放控制 */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200/80 shadow-sm">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors"
                title="縮小檢視"
              >
                <i className="fas fa-minus"></i>
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="px-1.5 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold transition-colors"
                title="重置縮放"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors"
                title="放大檢視"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>

            {/* SVG 繪圖區 */}
            <svg
              viewBox={`0 0 ${previewData.viewBoxWidth} ${previewData.viewBoxHeight}`}
              className="w-[88%] h-[88%] max-w-full max-h-full transition-transform duration-300"
              preserveAspectRatio="xMidYMid meet"
            >
              {renderShape(shapeA, previewData.d1, {
                x: previewData.centerX,
                y: previewData.centerY
              })}
              {renderShape(shapeB, previewData.d2, {
                x: previewData.centerX,
                y: previewData.centerY
              })}

              {/* 精密中心十字標記 */}
              <g opacity="0.45">
                <line
                  x1={previewData.centerX - previewData.viewBoxWidth / 40}
                  y1={previewData.centerY}
                  x2={previewData.centerX + previewData.viewBoxWidth / 40}
                  y2={previewData.centerY}
                  stroke="#64748b"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={previewData.centerX}
                  y1={previewData.centerY - previewData.viewBoxWidth / 40}
                  x2={previewData.centerX}
                  y2={previewData.centerY + previewData.viewBoxWidth / 40}
                  stroke="#64748b"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </svg>

            {/* 未輸入數據時的提示 */}
            {!previewData.d1.l && !previewData.d2.l && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-slate-50 flex items-center justify-center mb-2 md:mb-4 border border-slate-200/80 shadow-inner">
                  <i className="fas fa-layer-group text-xl md:text-3xl text-slate-300"></i>
                </div>
                <h3 className="text-sm md:text-lg font-bold text-slate-500">
                  等待輸入孔軸幾何參數
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">
                  輸入長、寬或直徑即可即時對齊中心點並計算單邊間隙
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors pointer-events-auto"
                >
                  載入範例尺寸 (50×30 vs 49.96×29.96)
                </button>
              </div>
            )}

            {/* 底部置中對齊說明 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/5 backdrop-blur-sm px-3.5 py-1 rounded-full border border-slate-900/10 text-[10px] font-semibold text-slate-500 tracking-wider whitespace-nowrap hidden sm:block">
              中心點自動重疊對齊 · 比例自適應縮放
            </div>
          </div>
        </div>

        {/* 底部狀態列 (手機與電腦皆自適應不破版) */}
        <div className="px-3 sm:px-6 md:px-8 py-2.5 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 text-[11px] font-mono text-slate-600 shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: shapeA.color }}
              />
              孔A: {shapeA.type.toUpperCase()} [{previewData.d1.l}×{previewData.d1.w}]
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: shapeB.color }}
              />
              軸B: {shapeB.type.toUpperCase()} [{previewData.d2.l}×{previewData.d2.w}]
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span
              className={`px-2 py-0.5 rounded font-bold transition-colors whitespace-nowrap ${
                previewData.hasInterference
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {previewData.hasInterference ? '干涉警示 (INTERFERENCE)' : '中心重疊對齊'}
            </span>
            <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-bold whitespace-nowrap">
              單位: mm
            </span>
          </div>
        </div>
      </main>

      {/*
        控制與數值分析面板：
        - 修正原本無效的 md:w-85 為標準響應式寬度 md:w-[360px] lg:w-[400px] shrink-0
        - 手機版排在下方 (order-2)，並支援雙欄並排模式讓孔A、軸B與差值同時顯示在單一畫面內
      */}
      <aside className="order-2 md:order-1 w-full md:w-[360px] lg:w-[400px] shrink-0 bg-white border-t md:border-t-0 md:border-r border-slate-200 p-3 sm:p-4 md:p-5 shadow-lg flex flex-col gap-3 md:gap-4 md:h-full md:overflow-y-auto z-20">
        {/* 電腦版標題列 */}
        <div className="hidden md:flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 text-white w-9 h-9 flex items-center justify-center rounded-xl shadow-sm">
              <i className="fas fa-microchip text-base"></i>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                孔軸快速配
              </h1>
              <p className="text-[11px] text-slate-400 font-semibold">
                Precision Center Overlay
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              範例
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            >
              全清空
            </button>
          </div>
        </div>

        {/* 單邊數值差異顯示面板 (在手機上置於輸入框上方，方便邊輸入邊看結果) */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white rounded-2xl shadow-md space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <i className="fas fa-ruler-combined text-indigo-400"></i>
              <span>單邊數值差異 (Offset)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              緊配: 0~0.03mm
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                previewData.isTightFitL
                  ? 'bg-cyan-950/80 border-cyan-400/60'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-[11px] text-slate-300">Δ 長度 (單邊)</p>
                {previewData.isTightFitL && (
                  <span className="text-[10px] bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                    緊配
                  </span>
                )}
              </div>
              <p
                className={`text-lg sm:text-xl font-mono font-bold ${
                  previewData.isTightFitL ? 'text-cyan-300' : 'text-white'
                }`}
              >
                {previewData.diffL} <span className="text-xs font-normal">mm</span>
              </p>
            </div>

            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                previewData.isTightFitW
                  ? 'bg-cyan-950/80 border-cyan-400/60'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-[11px] text-slate-300">Δ 寬度 (單邊)</p>
                {previewData.isTightFitW && (
                  <span className="text-[10px] bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                    緊配
                  </span>
                )}
              </div>
              <p
                className={`text-lg sm:text-xl font-mono font-bold ${
                  previewData.isTightFitW ? 'text-cyan-300' : 'text-white'
                }`}
              >
                {previewData.diffW} <span className="text-xs font-normal">mm</span>
              </p>
            </div>
          </div>

          {previewData.hasInterference && (
            <div className="bg-red-500/20 border border-red-400/40 px-2.5 py-2 rounded-lg flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-red-400 text-xs shrink-0"></i>
              <p className="text-[11px] text-red-100 leading-snug">
                干涉警示：軸尺寸 B 已大於孔尺寸 A，請檢查配合公差。
              </p>
            </div>
          )}
        </div>

        {/* 孔尺寸 A 與 軸尺寸 B 輸入區 (手機版支援雙欄並排或單欄切換，電腦版垂直排列) */}
        <div
          className={`grid gap-3 ${
            mobileCompactGrid ? 'grid-cols-2 md:grid-cols-1' : 'grid-cols-1'
          }`}
        >
          {renderInputs(shapeA, setShapeA, '孔尺寸 A (外框)', SHAPE_A_PRESETS)}
          {renderInputs(shapeB, setShapeB, '軸尺寸 B (內軸)', SHAPE_B_PRESETS)}
        </div>

        <div className="mt-auto pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
          <span>中心點自動重疊</span>
          <span>支援手機 / 電腦全畫面檢視</span>
        </div>
      </aside>
    </div>
  );
};

export default App;

