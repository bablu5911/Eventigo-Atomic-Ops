import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles, ShieldCheck, QrCode } from 'lucide-react';

/**
 * 3D Holographic Pass Mesh rendered inside WebGL Canvas
 */
function HolographicCardMesh({ bookingCode, eventTitle, tierName, attendeeName, isAdmitted }) {
  const meshRef = useRef();
  const lightRef = useRef();

  // Create high-res canvas texture for ticket details on front of 3D card
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    // Background Gradient: Deep Obsidian & Cyber Emerald
    const grad = ctx.createLinearGradient(0, 0, 1024, 640);
    grad.addColorStop(0, '#0a1610');
    grad.addColorStop(0.5, '#12251b');
    grad.addColorStop(1, '#070f0b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 640);

    // Subtle Hex / Tech Mesh Pattern
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 20; x < 1024; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 640);
      ctx.stroke();
    }
    for (let y = 20; y < 640; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Outer Neon Glow Border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, 992, 608);

    // Inner Corner Accent Tabs
    ctx.fillStyle = '#34d399';
    ctx.fillRect(16, 16, 40, 10);
    ctx.fillRect(16, 16, 10, 40);
    ctx.fillRect(968, 16, 40, 10);
    ctx.fillRect(998, 16, 10, 40);
    ctx.fillRect(16, 614, 40, 10);
    ctx.fillRect(16, 584, 10, 40);
    ctx.fillRect(968, 614, 40, 10);
    ctx.fillRect(998, 584, 10, 40);

    // Top Header: Brand & Security Seal
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('✦ EVENTIGO VIP PASS ✦', 60, 90);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('AUTHENTICATED DIGITAL PASS', 60, 130);

    // Status Pill on top right
    ctx.fillStyle = isAdmitted ? '#059669' : '#10b981';
    ctx.fillRect(720, 60, 240, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isAdmitted ? 'ADMITTED' : 'VERIFIED PASS', 840, 95);
    ctx.textAlign = 'left';

    // Event Title
    ctx.fillStyle = '#f9fafb';
    ctx.font = 'bold 44px sans-serif';
    const displayTitle = eventTitle || 'Global Live Summit 2026';
    const truncatedTitle = displayTitle.length > 28 ? displayTitle.slice(0, 26) + '...' : displayTitle;
    ctx.fillText(truncatedTitle, 60, 240);

    // Tier Name & Attendee
    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText((tierName || 'VIP Access Pass').toUpperCase(), 60, 290);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '22px sans-serif';
    ctx.fillText('Attendee: ' + (attendeeName || 'Event Guest'), 60, 340);

    // Metallic Security Microchip Graphics
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(60, 400, 110, 85);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 400, 110, 85);
    ctx.beginPath();
    ctx.moveTo(95, 400);
    ctx.lineTo(95, 485);
    ctx.moveTo(135, 400);
    ctx.lineTo(135, 485);
    ctx.moveTo(60, 442);
    ctx.lineTo(170, 442);
    ctx.stroke();

    // Booking Code / Pass ID Barcode
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(bookingCode || 'ATOM-2026-VIP-9999', 210, 450);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = '20px monospace';
    ctx.fillText('Turnstile Gate NFC & Optical Synced', 210, 485);

    // Decorative Barcode Lines at Bottom
    ctx.fillStyle = '#e5e7eb';
    let bx = 60;
    const barWidths = [4, 8, 3, 12, 5, 2, 9, 4, 14, 6, 3, 10, 5, 7, 12, 4, 8, 3, 10, 6, 14, 5, 2, 8, 4, 12];
    for (let i = 0; i < 40; i++) {
      const w = barWidths[i % barWidths.length];
      ctx.fillRect(bx, 540, w, 45);
      bx += w + 6;
      if (bx > 950) break;
    }

    const t = new THREE.CanvasTexture(canvas);
    t.needsUpdate = true;
    return t;
  }, [bookingCode, eventTitle, tierName, attendeeName, isAdmitted]);

  // Smooth Cursor Tilt via useFrame
  useFrame((state) => {
    if (!meshRef.current) return;
    // Map pointer (-1 to +1) to smooth rotations
    const targetX = (-state.pointer.y * Math.PI) / 6.5;
    const targetY = (state.pointer.x * Math.PI) / 5.5;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.08);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.08);

    // Subtle floating breathing wave
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;

    // Specular light follows pointer
    if (lightRef.current) {
      lightRef.current.position.x = state.pointer.x * 4;
      lightRef.current.position.y = state.pointer.y * 3;
    }
  });

  return (
    <group>
      {/* Dynamic Specular Point Light tracking mouse cursor */}
      <pointLight ref={lightRef} position={[0, 0, 3.5]} intensity={2.2} color="#34d399" distance={10} />
      <pointLight position={[3, -2, 2]} intensity={1.2} color="#60a5fa" distance={8} />

      {/* Main 3D Hologram Card */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[3.4, 2.12, 0.08]} />
        <meshStandardMaterial
          map={texture}
          metalness={0.75}
          roughness={0.22}
          envMapIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

/**
 * Interactive 3D Pass Container
 */
export default function ThreeDPass({
  bookingCode = 'ATOM-2026-VIP-8899',
  eventTitle = 'Global AI Summit 2026',
  tierName = 'VIP Holographic Pass',
  attendeeName = 'Verified Guest',
  isAdmitted = false
}) {
  const [hasWebGL] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  });

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[1.58/1] rounded-3xl overflow-hidden bg-gradient-to-b from-neutral-900/90 via-neutral-950/95 to-black p-1 border border-emerald-500/30 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] group">
      {hasWebGL ? (
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[0, 5, 5]} intensity={1.2} />
          <HolographicCardMesh
            bookingCode={bookingCode}
            eventTitle={eventTitle}
            tierName={tierName}
            attendeeName={attendeeName}
            isAdmitted={isAdmitted}
          />
        </Canvas>
      ) : (
        /* CSS 3D Tilt Fallback if WebGL unavailable */
        <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-[#0a1610] via-[#12251b] to-[#070f0b] text-white rounded-2xl border-2 border-emerald-500 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold block">✦ EVENTIGO VIP PASS ✦</span>
              <span className="text-[10px] text-emerald-200/70 font-mono">DIGITAL HOLOGRAM PASS</span>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold font-mono">
              VERIFIED
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white truncate">{eventTitle}</h3>
            <p className="text-xs text-emerald-300 font-semibold">{tierName}</p>
            <p className="text-[11px] text-gray-400 mt-1">{attendeeName}</p>
          </div>

          <div className="flex justify-between items-center border-t border-emerald-500/30 pt-3">
            <span className="font-mono text-sm font-bold text-white">{bookingCode}</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Turnstile Synced
            </span>
          </div>
        </div>
      )}

      {/* Hologram Shimmer Accent Ribbon */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-hologram-shine -skew-x-12" />
      </div>

      {/* Interactive Helper Badge */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center space-x-1.5 shadow-lg">
        <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        <span>3D Hologram • Move mouse or drag to tilt</span>
      </div>
    </div>
  );
}
