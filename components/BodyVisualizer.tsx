import React, { useState, useEffect, useRef } from 'react';
import { BodyStats, Gender, VisualizerMode } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export interface MuscleData {
  id: string;
  name: string;
  function?: string;
}

interface BodyVisualizerProps {
  stats: BodyStats;
  targetStats?: BodyStats;
  gender?: Gender;
  onSelect?: (muscle: MuscleData | null) => void;
  adjustingMuscle?: string | null;
  disableAnimation?: boolean;
  mode?: VisualizerMode;
  view?: 'front' | 'back';
}

const BodyVisualizer: React.FC<BodyVisualizerProps> = ({ 
    stats, 
    targetStats,
    gender = 'male',
    onSelect,
    adjustingMuscle,
    view = 'front',
    mode = 'standard'
}) => {
  const { t } = useSettings();
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const prevStatsRef = useRef<BodyStats>(stats);
  const prevTargetRef = useRef<BodyStats | undefined>(targetStats);

  // Sync external adjustingMuscle to internal activeMuscle
  useEffect(() => {
    if (adjustingMuscle) setActiveMuscle(adjustingMuscle);
  }, [adjustingMuscle]);

  // Enhanced scaling function
  const getStyle = (displayStats: BodyStats, key: string, verticalRatio: number, origin = '50% 50%', isTarget = false) => {
    // Map internal visual keys to BodyStats keys
    let statKey = key;
    if (key === 'neck') statKey = 'traps';
    if (key === 'quads') statKey = 'legs';
    if (key === 'hamstrings') statKey = 'legs';
    if (key === 'biceps') statKey = 'arms';
    if (key === 'triceps') statKey = 'arms';
    if (key === 'rearDelts') statKey = 'shoulders';
    if (key === 'erectors') statKey = 'waist';
    
    let value = (displayStats as any)[statKey] || 1;
    let widthModifier = 0;

    // Influence chest/core width by Lats/Obliques
    if (key === 'chest' || key === 'lats') {
        const lats = displayStats.lats || 1;
        widthModifier += (lats - 1) * 0.4;
    }
    if (key === 'abs' || key === 'waist') {
        const obliques = displayStats.obliques || 1;
        widthModifier += (obliques - 1) * 0.4;
    }
    
    const isActive = activeMuscle === statKey;
    const shouldHighlight = isTarget ? (isActive && targetStats) : (isActive && !targetStats);
    
    let fill = isTarget ? "url(#targetDots)" : "url(#skinGradient)";
    if (mode === 'thermal') {
        fill = value > 1.2 ? '#ef4444' : value > 1.0 ? '#f59e0b' : '#3b82f6';
    }

    const glowColor = gender === 'female' ? '#ec4899' : '#4f46e5';

    const scaleX = 1 + (value - 1) * 0.5 + widthModifier;
    const scaleY = 1 + (value - 1) * verticalRatio;

    return {
      transform: `scale(${scaleX}, ${scaleY})`,
      transformBox: 'fill-box' as const,
      transformOrigin: origin,
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), filter 0.3s ease-out',
      filter: shouldHighlight ? `drop-shadow(0 0 12px ${glowColor}) brightness(1.2)` : undefined,
      cursor: onSelect ? 'pointer' : 'default',
      opacity: 1,
      fill: mode === 'thermal' ? fill : undefined
    };
  };

  const handleGroupClick = (e: React.MouseEvent, key: string) => {
      e.stopPropagation();
      if (!onSelect) return;

      let statKey = key;
      if (key === 'neck') statKey = 'traps';
      if (key === 'quads' || key === 'hamstrings') statKey = 'legs';
      if (key === 'biceps' || key === 'triceps') statKey = 'arms';
      if (key === 'rearDelts') statKey = 'shoulders';
      if (key === 'erectors') statKey = 'waist';

      const muscles = t('muscles') as Record<string, string>;
      const name = muscles?.[statKey] || statKey;
      
      onSelect({ id: statKey, name });
      setActiveMuscle(statKey);
  };

  const renderBackBody = (layerStats: BodyStats, isTarget: boolean) => {
      const fill = isTarget ? "url(#targetDots)" : "url(#skinGradient)";
      const stroke = isTarget ? "#0d9488" : "transparent"; 
      const strokeWidth = isTarget ? 1.5 : 0;
      const strokeDasharray = isTarget ? "4, 3" : "none";
      const filter = isTarget ? "none" : "url(#sculptedLook)";
      const opacity = isTarget ? 0.8 : 1;
      
      const commonProps = { fill, stroke, strokeWidth, strokeDasharray, filter, opacity };
      
      // Male Back Anatomy
      if (gender === 'male') {
        return (
          <g id={isTarget ? "male-back-target" : "male-back-current"} transform="translate(0, 80)">
             {/* HEAD (Back) */}
             <g transform="translate(0, -40)">
                <path d="M 175,85 C 175,50 225,50 225,85 C 225,115 215,130 200,132 C 185,130 175,115 175,85 Z" {...commonProps} />
                {/* Neck Extensors */}
                {!isTarget && <path d="M 190,115 C 195,125 205,125 210,115" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3" />}
             </g>

             {/* TRAPEZIUS - Diamond / Kite Shape (Strong & Organic) */}
             <g style={getStyle(layerStats, 'neck', 0.2, '50% 30%', isTarget)} onClick={(e) => handleGroupClick(e, 'neck')}>
                {/* Main Trap body */}
                <path d="M 200,85 C 215,88 245,95 265,110 C 260,120 250,125 240,130 C 235,160 210,200 200,240 C 190,200 165,160 160,130 C 150,125 140,120 135,110 C 155,95 185,88 200,85 Z" {...commonProps} />
                {/* Spine Definition */}
                {!isTarget && <path d="M 200,90 C 200,150 200,200 200,240" stroke="#94a3b8" strokeWidth="1" opacity="0.1" />}
             </g>

             {/* REAR DELTS - Capping the Shoulder */}
             <g>
                <g style={getStyle(layerStats, 'rearDelts', 0.2, '100% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'rearDelts')}>
                    <path d="M 135,110 C 110,110 100,125 105,160 C 115,175 140,170 155,160 C 160,145 150,125 135,110 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'rearDelts', 0.2, '0% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'rearDelts')}>
                    <path d="M 265,110 C 290,110 300,125 295,160 C 285,175 260,170 245,160 C 240,145 250,125 265,110 Z" {...commonProps} />
                </g>
             </g>

             {/* TERES MAJOR/MINOR - Tucked under delts */}
             <g style={getStyle(layerStats, 'lats', 0.1, '50% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'lats')}>
                 <path d="M 155,160 C 150,170 160,195 170,200 C 175,190 170,170 160,130 Z" {...commonProps} /> 
                 <path d="M 245,160 C 250,170 240,195 230,200 C 225,190 230,170 240,130 Z" {...commonProps} /> 
             </g>

             {/* LATISSIMUS DORSI - Wide Sweep to V-Taper */}
             <g style={getStyle(layerStats, 'lats', 0.15, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'lats')}>
                <path d="M 170,200 C 140,210 125,250 145,285 C 160,305 180,315 200,320 C 220,315 240,305 255,285 C 275,250 260,210 230,200 C 225,230 215,260 200,240 C 185,260 175,230 170,200 Z" {...commonProps} />
             </g>

             {/* ERECTOR SPINAE - The "Christmas Tree" Structure */}
             <g style={getStyle(layerStats, 'erectors', 0.05, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'erectors')}>
                {/* Two strong pillars alongside the spine */}
                <path d="M 200,240 C 190,260 185,300 190,340 C 195,345 205,345 210,340 C 215,300 210,260 200,240 Z" {...commonProps} />
                {!isTarget && <path d="M 200,240 L 200,340" stroke="#94a3b8" strokeWidth="1" opacity="0.1" />}
             </g>

             {/* TRICEPS - Horse Shoe */}
             <g>
               <g style={getStyle(layerStats, 'triceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'triceps')}>
                  <path d="M 105,160 C 95,190 100,235 115,245 C 130,250 145,230 150,220 C 155,190 155,160 155,160 C 135,165 115,160 105,160 Z" {...commonProps} />
               </g>
               <g style={getStyle(layerStats, 'triceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'triceps')}>
                  <path d="M 295,160 C 305,190 300,235 285,245 C 270,250 255,230 250,220 C 245,190 245,160 245,160 C 265,165 285,160 295,160 Z" {...commonProps} />
               </g>
             </g>

             {/* FOREARMS */}
             <g>
               <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                  <path d="M 115,245 C 105,270 115,305 125,310 C 135,310 145,290 145,270 C 145,260 140,250 135,245 Z" {...commonProps} />
               </g>
               <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                  <path d="M 285,245 C 295,270 285,305 275,310 C 265,310 255,290 255,270 C 255,260 260,250 265,245 Z" {...commonProps} />
               </g>
             </g>

             {/* GLUTES - Full & Strong */}
             <g style={getStyle(layerStats, 'glutes', 0.05, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'glutes')}>
                <path d="M 160,335 C 140,345 130,380 150,410 C 160,425 180,430 200,430 C 220,430 240,425 250,410 C 270,380 260,345 240,335 C 230,355 210,360 200,360 C 190,360 170,355 160,335 Z" {...commonProps} />
                {!isTarget && (
                    <path d="M 200,360 L 200,430" stroke="#94a3b8" strokeWidth="1" opacity="0.2" />
                )}
             </g>

             {/* HAMSTRINGS */}
             <g transform="translate(0, 10)">
               <g style={getStyle(layerStats, 'hamstrings', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'hamstrings')}>
                  <path d="M 150,410 C 135,420 140,480 155,500 L 175,500 C 190,480 195,440 180,420 C 175,415 160,410 150,410 Z" {...commonProps} />
               </g>
               <g style={getStyle(layerStats, 'hamstrings', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'hamstrings')}>
                  <path d="M 250,410 C 265,420 260,480 245,500 L 225,500 C 210,480 205,440 220,420 C 225,415 240,410 250,410 Z" {...commonProps} />
               </g>
             </g>

             {/* CALVES - Diamond */}
             <g transform="translate(0, 20)">
               <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                  <path d="M 155,500 C 135,510 140,560 155,580 L 165,580 C 180,560 185,510 175,500 Z" {...commonProps} />
               </g>
               <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                  <path d="M 245,500 C 265,510 260,560 245,580 L 235,580 C 220,560 215,510 225,500 Z" {...commonProps} />
               </g>
             </g>
          </g>
        );
      } else {
        // Female Back - Smooth & Defined
        return (
          <g id={isTarget ? "female-back-target" : "female-back-current"} transform="translate(0, 110)">
             {/* HEAD */}
             <g transform="translate(0, -30)">
                <path d="M 180,85 C 180,55 220,55 220,85 C 220,105 212,125 200,128 C 188,125 180,105 180,85 Z" {...commonProps} />
             </g>

             {/* TRAPS - Elegant Kite */}
             <g style={getStyle(layerStats, 'neck', 0.2, '50% 100%', isTarget)} onClick={(e) => handleGroupClick(e, 'neck')}>
                <path d="M 200,88 C 215,90 235,95 250,110 C 245,120 235,130 200,150 C 165,130 155,120 150,110 C 165,95 185,90 200,88 Z" {...commonProps} />
             </g>

             {/* REAR DELTS */}
             <g>
                <g style={getStyle(layerStats, 'rearDelts', 0.2, '100% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'rearDelts')}>
                   <path d="M 150,110 C 130,110 120,120 125,150 C 135,160 150,155 160,150 C 165,130 160,120 150,110 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'rearDelts', 0.2, '0% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'rearDelts')}>
                   <path d="M 250,110 C 270,110 280,120 275,150 C 265,160 250,155 240,150 C 235,130 240,120 250,110 Z" {...commonProps} />
                </g>
             </g>

             {/* LATS - Smooth V Taper */}
             <g style={getStyle(layerStats, 'lats', 0.1, '50% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'lats')}>
                <path d="M 160,150 C 145,170 150,220 170,250 C 180,260 220,260 230,250 C 250,220 255,170 240,150 C 230,170 215,185 200,185 C 185,185 170,170 160,150 Z" {...commonProps} />
             </g>

             {/* ARMS - Triceps */}
             <g>
                <g style={getStyle(layerStats, 'triceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'triceps')}>
                  <path d="M 125,150 C 115,170 120,210 130,235 C 140,235 145,220 150,200 C 152,180 150,160 150,160 C 140,165 130,160 125,150 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'triceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'triceps')}>
                  <path d="M 275,150 C 285,170 280,210 270,235 C 260,235 255,220 250,200 C 248,180 250,160 250,160 C 260,165 270,160 275,150 Z" {...commonProps} />
                </g>
             </g>
             
             {/* FOREARMS */}
             <g>
                <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                  <path d="M 130,235 C 125,250 125,280 130,290 L 142,290 C 148,280 148,250 142,235 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                  <path d="M 270,235 C 275,250 275,280 270,290 L 258,290 C 252,280 252,250 258,235 Z" {...commonProps} />
                </g>
             </g>

             {/* WAIST & ERECTORS */}
             <g style={getStyle(layerStats, 'waist', 0.05, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'waist')}>
                {/* Smooth curve into hips */}
                <path d="M 180,250 C 170,260 165,270 160,285 C 180,290 220,290 240,285 C 235,270 230,260 220,250 C 215,265 185,265 180,250 Z" {...commonProps} />
                {/* Erector definition */}
                {!isTarget && <path d="M 200,250 L 200,285" stroke="#94a3b8" strokeWidth="1" opacity="0.1" />}
             </g>

             {/* GLUTES */}
             <g style={getStyle(layerStats, 'glutes', 0.05, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'glutes')}>
                <path d="M 160,285 C 140,295 130,340 150,370 C 160,375 180,380 200,380 C 220,380 240,375 250,370 C 270,340 260,295 240,285 C 230,300 170,300 160,285 Z" {...commonProps} />
                {!isTarget && <path d="M 200,300 L 200,380" stroke="#94a3b8" strokeWidth="1" opacity="0.2" />}
             </g>

             {/* HAMSTRINGS */}
             <g transform="translate(0, 10)">
               <g style={getStyle(layerStats, 'hamstrings', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'hamstrings')}>
                  <path d="M 150,370 C 135,385 135,440 145,460 L 175,460 C 185,440 180,385 170,370 Z" {...commonProps} />
               </g>
               <g style={getStyle(layerStats, 'hamstrings', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'hamstrings')}>
                  <path d="M 250,370 C 265,385 265,440 255,460 L 225,460 C 215,440 220,385 230,370 Z" {...commonProps} />
               </g>
             </g>

             {/* CALVES */}
             <g transform="translate(0, 10)">
                <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                  <path d="M 145,460 C 130,470 125,510 140,540 L 150,570 L 160,540 C 170,510 165,470 150,460 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                  <path d="M 255,460 C 270,470 275,510 260,540 L 250,570 L 240,540 C 230,510 235,470 250,460 Z" {...commonProps} />
                </g>
             </g>
          </g>
        );
      }
  };

  const renderBody = (layerStats: BodyStats, isTarget: boolean) => {
      const fill = isTarget ? "url(#targetDots)" : "url(#skinGradient)";
      const stroke = isTarget ? "#0d9488" : "transparent"; // Teal for target
      const strokeWidth = isTarget ? 1.5 : 0;
      const strokeDasharray = isTarget ? "4, 3" : "none";
      const filter = isTarget ? "none" : "url(#sculptedLook)";
      const opacity = isTarget ? 0.8 : 1;
      
      const commonProps = {
          fill,
          stroke,
          strokeWidth,
          strokeDasharray,
          filter,
          opacity
      };

      if (gender === 'male') {
        return (
          <g id={isTarget ? "male-target" : "male-current"} transform="translate(0, 80)">
            {/* --- NECK --- */}
            <g style={getStyle(layerStats, 'neck', 0.1, '50% 100%', isTarget)} transform="translate(0, -10)" onClick={(e) => handleGroupClick(e, 'neck')}>
                <path d="M 182,75 L 218,75 L 218,135 Q 200,142 182,135 Z" {...commonProps} />
                {!isTarget && <path d="M 195,110 L 205,110" stroke="#cbd5e1" strokeWidth="1" opacity="0.6" strokeLinecap="round"/>}
            </g>

            {/* --- TRAPS --- */}
            <g style={getStyle(layerStats, 'neck', 0.3, '50% 100%', isTarget)} onClick={(e) => handleGroupClick(e, 'neck')}>
                <path d="M 145,125 Q 180,90 200,95 Q 220,90 255,125 L 245,140 Q 200,115 155,140 Z" {...commonProps} />
            </g>

            {/* --- LEGS (QUADS) --- */}
            <g transform="translate(0, 10)">
              <g style={getStyle(layerStats, 'quads', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'quads')}>
                <path d="M 155,330 C 115,350 110,430 135,460 C 145,472 178,470 180,450 L 185,330 Z" {...commonProps} />
                {!isTarget && <path d="M 155,360 Q 148,410 152,440" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3"/>}
              </g>
              <g style={getStyle(layerStats, 'quads', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'quads')}>
                <path d="M 245,330 C 285,350 290,430 265,460 C 255,472 222,470 220,450 L 215,330 Z" {...commonProps} />
                {!isTarget && <path d="M 245,360 Q 252,410 248,440" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3"/>}
              </g>
            </g>

            {/* --- KNEES (Male) --- */}
            {!isTarget && (
                <g transform="translate(0, 10)" opacity="0.3" stroke="#64748b" strokeWidth="1" fill="none">
                    <path d="M 160,458 Q 170,465 180,458" />
                    <path d="M 168,475 L 172,475" strokeWidth="1.5" />
                    <path d="M 220,458 Q 230,465 240,458" />
                    <path d="M 228,475 L 232,475" strokeWidth="1.5" />
                </g>
            )}

            {/* --- LEGS (CALVES) --- */}
            <g transform="translate(0, 15)">
              <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                <path d="M 146,480 Q 115,495 122,550 Q 130,590 142,605 L 148,605 Q 160,590 168,550 Q 175,495 146,480 Z" {...commonProps} />
                {!isTarget && <path d="M 146,495 Q 148,540 146,580" stroke="#94a3b8" strokeWidth="1" opacity="0.2" fill="none" />}
              </g>
              <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                <path d="M 254,480 Q 285,495 278,550 Q 270,590 258,605 L 252,605 Q 240,590 232,550 Q 225,495 254,480 Z" {...commonProps} />
                {!isTarget && <path d="M 254,495 Q 252,540 254,580" stroke="#94a3b8" strokeWidth="1" opacity="0.2" fill="none" />}
              </g>
            </g>

            {/* --- ABDOMEN (CORE) --- */}
            <g style={getStyle(layerStats, 'abs', 0.02, '50% 0%', isTarget)} transform="translate(0, 5)" onClick={(e) => handleGroupClick(e, 'abs')}>
                <path d="M 175,200 L 225,200 L 220,300 C 210,310 190,310 180,300 L 175,200 Z" 
                    fill={isTarget ? "url(#targetDots)" : "url(#muscleDeep)"} 
                    stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray}
                    opacity={opacity}
                />
                {!isTarget && (
                    <>
                        <path d="M 175,205 Q 155,220 165,280 L 180,290 Z" fill="url(#skinGradient)" />
                        <path d="M 225,205 Q 245,220 235,280 L 220,290 Z" fill="url(#skinGradient)" />
                        <g stroke="#64748b" strokeWidth="1" opacity="0.4">
                            <path d="M 180,230 L 220,230" />
                            <path d="M 182,255 L 218,255" />
                            <path d="M 185,280 L 215,280" />
                            <path d="M 200,205 L 200,290" />
                        </g>
                    </>
                )}
            </g>

            {/* --- GLUTES / HIPS --- */}
            <g style={getStyle(layerStats, 'glutes', 0.05, '50% 0%', isTarget)} transform="translate(0, 5)" onClick={(e) => handleGroupClick(e, 'glutes')}>
              <path d="M 175,305 Q 155,315 160,345 L 200,360 L 240,345 Q 245,315 225,305 L 200,310 Z" {...commonProps} />
              {!isTarget && (
                <>
                    <path d="M 160,345 Q 170,335 185,335" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3" />
                    <path d="M 240,345 Q 230,335 215,335" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3" />
                </>
              )}
            </g>

            {/* --- ARMS --- */}
            <g filter={!isTarget ? "url(#castShadow)" : ""}>
              <g style={getStyle(layerStats, 'biceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'biceps')}>
                <path d="M 112,165 C 100,185 98,215 115,245 L 138,245 C 158,215 155,185 148,165 Z" {...commonProps} />
                {!isTarget && (
                    <>
                        <path d="M 125,230 Q 130,200 135,175" stroke="#64748b" strokeWidth="1" fill="none" opacity="0.2" />
                        <path d="M 138,185 Q 142,200 135,215" stroke="white" strokeWidth="2" fill="none" opacity="0.1" />
                    </>
                )}
              </g>
              <g style={getStyle(layerStats, 'biceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'biceps')}>
                <path d="M 288,165 C 300,185 302,215 285,245 L 262,245 C 242,215 245,185 252,165 Z" {...commonProps} />
                {!isTarget && (
                    <>
                        <path d="M 275,230 Q 270,200 265,175" stroke="#64748b" strokeWidth="1" fill="none" opacity="0.2" />
                        <path d="M 262,185 Q 258,200 265,215" stroke="white" strokeWidth="2" fill="none" opacity="0.1" />
                    </>
                )}
              </g>
            </g>

            {/* --- FOREARMS --- */}
            <g filter={!isTarget ? "url(#castShadow)" : ""}>
              <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                <path d="M 115,242 C 105,260 110,295 118,305 L 132,305 C 140,295 145,260 135,242 Z" {...commonProps} />
              </g>
              <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                <path d="M 285,242 C 295,260 290,295 282,305 L 268,305 C 260,295 255,260 265,242 Z" {...commonProps} />
              </g>
            </g>

            {/* --- SHOULDERS --- */}
            <g filter={!isTarget ? "url(#castShadow)" : ""}>
              <g style={getStyle(layerStats, 'shoulders', 0.2, '100% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'shoulders')}>
                <path d="M 155,120 C 125,115 105,130 110,165 C 115,185 135,180 150,160 L 155,120 Z" {...commonProps} />
              </g>
              <g style={getStyle(layerStats, 'shoulders', 0.2, '0% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'shoulders')}>
                <path d="M 245,120 C 275,115 295,130 290,165 C 285,185 265,180 250,160 L 245,120 Z" {...commonProps} />
              </g>
            </g>

            {/* --- CHEST --- */}
            <g filter={!isTarget ? "url(#castShadow)" : ""}>
              <g style={getStyle(layerStats, 'chest', 0.1, '100% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'chest')}>
                <path d="M 200,130 L 200,200 C 160,205 130,180 135,150 C 140,125 165,120 200,130 Z" {...commonProps} />
              </g>
              <g style={getStyle(layerStats, 'chest', 0.1, '0% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'chest')}>
                <path d="M 200,130 L 200,200 C 240,205 270,180 265,150 C 260,125 235,120 200,130 Z" {...commonProps} />
              </g>
              {!isTarget && <path d="M 200,130 L 200,200" stroke="#cbd5e1" strokeWidth="1" opacity="0.6"/>}
            </g>

            {/* --- HEAD --- */}
            <g filter={!isTarget ? "url(#castShadow)" : ""} transform="translate(0, -40)">
                <path d="M 170,80 C 170,40 230,40 230,80 C 230,105 220,125 200,130 C 180,125 170,105 170,80 Z" {...commonProps} />
                {!isTarget && <path d="M 200,85 L 200,100" stroke="#cbd5e1" strokeWidth="1" opacity="0.5"/>}
            </g>
          </g>
        );
      } else {
        // FEMALE VIEW - REFINED
        return (
          <g id={isTarget ? "female-target" : "female-current"} transform="translate(0, 110)">
             {/* NECK */}
             <g style={getStyle(layerStats, 'neck', 0.1, '50% 100%', isTarget)} transform="translate(0, -5)" onClick={(e) => handleGroupClick(e, 'neck')}>
                <path d="M 192,105 L 208,105 L 210,132 Q 200,138 190,132 Z" {...commonProps} />
                {!isTarget && (
                   <>
                     {/* Refined Clavicle Lines to anchor the upper chest area */}
                     <path d="M 190,132 Q 170,138 145,134" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
                     <path d="M 210,132 Q 230,138 255,134" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
                   </>
                )}
             </g>

             {/* TRAPS */}
             <g style={getStyle(layerStats, 'neck', 0.3, '50% 100%', isTarget)} onClick={(e) => handleGroupClick(e, 'neck')}>
                <path d="M 148,135 Q 185,110 200,115 Q 215,110 252,135 L 248,145 Q 200,135 152,145 Z" {...commonProps} />
             </g>

             {/* LEGS (QUADS) - Aligned with wider hips */}
             <g transform="translate(0, 10)">
                <g style={getStyle(layerStats, 'quads', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'quads')}>
                  {/* Left Leg */}
                  <path d="M 130,360 C 105,380 110,450 138,470 C 148,480 175,480 180,460 L 185,350 Z" {...commonProps} />
                  {!isTarget && <path d="M 145,375 Q 140,410 142,440" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3"/>}
                </g>
                <g style={getStyle(layerStats, 'quads', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'quads')}>
                   {/* Right Leg */}
                  <path d="M 270,360 C 295,380 290,450 262,470 C 252,480 225,480 220,460 L 215,350 Z" {...commonProps} />
                  {!isTarget && <path d="M 255,375 Q 260,410 258,440" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3"/>}
                </g>
             </g>

             {/* CALVES */}
             <g transform="translate(0, 0)">
                <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                  <path d="M 140,480 Q 110,495 117,550 Q 125,590 137,605 L 143,605 Q 155,590 163,550 Q 170,495 140,480 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'calves', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'calves')}>
                  <path d="M 260,480 Q 290,495 283,550 Q 275,590 263,605 L 257,605 Q 245,590 237,550 Q 230,495 260,480 Z" {...commonProps} />
                </g>
             </g>
             
             {/* WAIST - Smoother, more natural curves, less pinched */}
             <g style={getStyle(layerStats, 'waist', 0.05, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'abs')}>
                 <path d="M 158,210 Q 168,250 155,295 L 245,295 Q 232,250 242,210 L 200,215 Z" 
                    fill={isTarget ? "url(#targetDots)" : "url(#skinGradient)"}
                    stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray}
                    opacity={opacity}
                 />
                 {/* Visual indication of Obliques on the sides if not targeting */}
                 {!isTarget && (
                    <>
                        <path d="M 165,230 Q 172,255 162,280" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.1" />
                        <path d="M 235,230 Q 228,255 238,280" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.1" />
                    </>
                 )}
             </g>

             {/* ABS - Realistic Anatomy (Rectus Abdominis) */}
             <g style={getStyle(layerStats, 'abs', 0.02, '50% 0%', isTarget)} transform="translate(0, 0)" onClick={(e) => handleGroupClick(e, 'abs')}>
                {/* Wider, more anatomical shape representing the abdominal wall */}
                <path d="M 185,215 Q 182,250 190,290 L 210,290 Q 218,250 215,215 Q 200,220 185,215 Z" 
                    fill={isTarget ? "url(#targetDots)" : "url(#muscleDeep)"} 
                    stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray}
                    opacity={opacity}
                />
                {!isTarget && (
                    <g stroke="#64748b" strokeWidth="0.5" opacity="0.2">
                        {/* Linea Alba hint */}
                        <path d="M 200,215 L 200,285" />
                        {/* Horizontal intersections (tendinous intersections) */}
                        <path d="M 188,235 Q 200,238 212,235" />
                        <path d="M 190,255 Q 200,258 210,255" />
                        <path d="M 192,275 Q 200,278 208,275" />
                    </g>
                )}
             </g>

             {/* GLUTES/HIPS - Wide Flare */}
             <g style={getStyle(layerStats, 'glutes', 0.05, '50% 0%', isTarget)} transform="translate(0, 0)" onClick={(e) => handleGroupClick(e, 'glutes')}>
                <path d="M 160,295 Q 130,315 130,360 L 200,380 L 270,360 Q 270,315 240,295 L 200,305 Z" {...commonProps} />
             </g>

             {/* ARMS */}
             <g filter={!isTarget ? "url(#castShadow)" : ""}>
                <g style={getStyle(layerStats, 'biceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'biceps')}>
                  <path d="M 124,160 Q 115,200 124,242 L 136,242 Q 155,200 148,160 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'biceps', 0.1, '50% 10%', isTarget)} onClick={(e) => handleGroupClick(e, 'biceps')}>
                  <path d="M 276,160 Q 285,200 276,242 L 264,242 Q 245,200 252,160 Z" {...commonProps} />
                </g>
             </g>

             {/* FOREARMS */}
             <g filter={!isTarget ? "url(#castShadow)" : ""}>
                <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                  <path d="M 120,242 C 112,260 115,295 122,305 L 134,305 C 140,295 143,260 135,242 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'forearms', 0.1, '50% 0%', isTarget)} onClick={(e) => handleGroupClick(e, 'forearms')}>
                  <path d="M 280,242 C 288,260 285,295 278,305 L 266,305 C 260,295 257,260 265,242 Z" {...commonProps} />
                </g>
             </g>

             {/* SHOULDERS */}
             <g filter={!isTarget ? "url(#castShadow)" : ""}>
                <g style={getStyle(layerStats, 'shoulders', 0.2, '100% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'shoulders')}>
                   <path d="M 155,130 C 135,128 120,135 122,160 C 125,180 140,175 150,160 L 155,130 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'shoulders', 0.2, '0% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'shoulders')}>
                   <path d="M 245,130 C 265,128 280,135 278,160 C 275,180 260,175 250,160 L 245,130 Z" {...commonProps} />
                </g>
             </g>

             {/* CHEST (BREASTS) - Rounded */}
             <g filter={!isTarget ? "url(#castShadow)" : ""}>
                <g style={getStyle(layerStats, 'chest', 0.2, '100% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'chest')}>
                  {/* Left Breast */}
                  <path d="M 200,142 C 160,140 130,165 135,198 C 140,218 170,218 200,202 Z" {...commonProps} />
                </g>
                <g style={getStyle(layerStats, 'chest', 0.2, '0% 50%', isTarget)} onClick={(e) => handleGroupClick(e, 'chest')}>
                  {/* Right Breast */}
                  <path d="M 200,142 C 240,140 270,165 265,198 C 260,218 230,218 200,202 Z" {...commonProps} />
                </g>
             </g>

             {/* HEAD */}
             <g filter={!isTarget ? "url(#castShadow)" : ""} transform="translate(0, -30)">
                <path d="M 175,85 C 175,50 225,50 225,85 C 225,105 215,125 200,130 C 185,125 175,105 175,85 Z" {...commonProps} />
             </g>
          </g>
        );
      }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative bg-transparent">
      {/* Subtle Grid Background for Medical Feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
        }} 
      />
      
      {/* Central Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.5)_60%,transparent_100%)] pointer-events-none" />

      <svg
        viewBox="0 0 400 850"
        className="h-full w-full max-h-[850px] max-w-[500px] z-10 transition-opacity duration-500 overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.1))' }}
      >
        <defs>
          <radialGradient id="skinGradient" cx="30%" cy="20%" r="90%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>

          <linearGradient id="muscleDeep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Dotted Pattern for Target Overlay */}
          <pattern id="targetDots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
             <circle cx="2" cy="2" r="1" fill="#0d9488" opacity="0.3" />
          </pattern>

          <filter id="castShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
            <feOffset in="blur" dx="0" dy="5" result="offsetBlur"/>
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.25"/>
            </feComponentTransfer>
            <feComposite in="offsetBlur" in2="SourceAlpha" operator="out" result="shadow"/>
            <feComposite in="shadow" in2="SourceGraphic" operator="over" mode="normal"/>
          </filter>
          
          <filter id="sculptedLook">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur"/>
            <feOffset in="blur" dx="1.5" dy="3" result="offsetBlur"/>
            <feComposite in="offsetBlur" in2="SourceAlpha" operator="out" result="inverse"/>
            <feFlood floodColor="black" floodOpacity="0.3" result="color"/>
            <feComposite in="color" in2="inverse" operator="in" result="shadow"/>
             <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur2"/>
             <feComposite in="blur2" in2="SourceAlpha" operator="out" result="outerGlow"/>
             <feFlood floodColor="white" floodOpacity="0.2" result="lightColor"/>
             <feComposite in="lightColor" in2="outerGlow" operator="in" result="highlight"/>
            <feMerge>
                <feMergeNode in="SourceGraphic"/>
                <feMergeNode in="shadow"/>
                <feMergeNode in="highlight"/>
            </feMerge>
          </filter>
        </defs>

        {view === 'back' ? (
             <>
                 {/* 1. CURRENT BODY (Bottom Layer) - BACK */}
                 {renderBackBody(stats, false)}
                 {/* 2. TARGET BODY (Overlay Layer) - BACK */}
                 {targetStats && renderBackBody(targetStats, true)}
             </>
        ) : (
             <>
                 {/* 1. CURRENT BODY (Bottom Layer) - FRONT */}
                 {renderBody(stats, false)}
                 {/* 2. TARGET BODY (Overlay Layer) - FRONT */}
                 {targetStats && renderBody(targetStats, true)}
             </>
        )}

      </svg>
    </div>
  );
};

export default BodyVisualizer;