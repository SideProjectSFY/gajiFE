'use client';

import { Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Color, DoubleSide, type Group, NoToneMapping, SRGBColorSpace } from 'three';

export type AuthStageVariant = 'login' | 'register';

type AuthThreeStageProps = {
  variant: AuthStageVariant;
  stageId: number;
  stageBlend?: number;
};

type CanvasBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type CanvasBoundaryState = {
  hasError: boolean;
};

class CanvasBoundary extends Component<CanvasBoundaryProps, CanvasBoundaryState> {
  state: CanvasBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Auth 3D canvas fell back to CSS rendering.', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function hasWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');

    return Boolean(window.WebGLRenderingContext && context);
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function BookLayer({
  y,
  rotationY,
  cover,
  spine,
  width,
  depth
}: {
  y: number;
  rotationY: number;
  cover: string;
  spine: string;
  width: number;
  depth: number;
}) {
  return (
    <group position={[0, y, 0]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.151, 0]}>
        <boxGeometry args={[width, 0.05, depth]} />
        <meshStandardMaterial color={cover} depthWrite />
      </mesh>
      <mesh position={[0, -0.151, 0]}>
        <boxGeometry args={[width, 0.05, depth]} />
        <meshStandardMaterial color={cover} depthWrite />
      </mesh>
      <mesh position={[-width / 2 + 0.05, 0, 0]}>
        <boxGeometry args={[0.1, 0.35, depth]} />
        <meshStandardMaterial color={spine} depthWrite />
      </mesh>
      <mesh position={[0.05, 0, 0]}>
        <boxGeometry args={[width - 0.1, 0.25, depth - 0.1]} />
        <meshStandardMaterial color='#fefce8' depthWrite />
      </mesh>
    </group>
  );
}

function BooksObject() {
  return (
    <>
      <BookLayer y={-0.4} rotationY={0.2} cover='#8b5cf6' spine='#7c3aed' width={1.6} depth={2.2} />
      <BookLayer y={0} rotationY={-0.15} cover='#22d3ee' spine='#06b6d4' width={1.4} depth={2} />
      <BookLayer y={0.4} rotationY={0.1} cover='#fbbf24' spine='#f59e0b' width={1.2} depth={1.8} />
      <mesh position={[0.2, 0.4, 0.9]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.02]} />
        <meshStandardMaterial color='#ef4444' depthWrite />
      </mesh>
    </>
  );
}

function Hand({ side }: { side: 'left' | 'right' }) {
  const sign = side === 'left' ? 1 : -1;

  return (
    <group position={[side === 'left' ? -0.55 : 0.55, -0.4, 0]} rotation={[0, 0, side === 'left' ? -0.785 : 0.785]}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
        <meshStandardMaterial color='#fbbf24' />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.15, 16]} />
        <meshStandardMaterial color='#ffffff' />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.5, 0.65, 0.25]} />
        <meshStandardMaterial color='#fda4af' />
      </mesh>
      <mesh position={[0.28 * sign, 0.65, 0.05]} rotation={[0, 0, -0.6 * sign]}>
        <capsuleGeometry args={[0.13, 0.45, 4, 8]} />
        <meshStandardMaterial color='#fda4af' />
      </mesh>
      <mesh position={[0.25 * sign, 0.9, side === 'left' ? -0.12 : 0.18]} rotation={[0, 0, -0.2 * sign]}>
        <boxGeometry args={[0.25, 0.5, 0.18]} />
        <meshStandardMaterial color='#fda4af' />
      </mesh>
    </group>
  );
}

function Face({ mood }: { mood: 'laugh' | 'cry' }) {
  return (
    <group position={[mood === 'laugh' ? -0.6 : 0.6, 0, 0]} rotation={[0, mood === 'laugh' ? 0.2 : -0.2, 0]}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color='#facc15' roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[-0.2, 0.15, 0.45]} rotation={[0, 0, mood === 'laugh' ? -0.785 : 1.57]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
        <meshStandardMaterial color='#374151' />
      </mesh>
      <mesh position={[0.2, 0.15, 0.45]} rotation={[0, 0, mood === 'laugh' ? 0.785 : 1.57]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
        <meshStandardMaterial color='#374151' />
      </mesh>
      {mood === 'laugh' ? (
        <>
          <mesh position={[0, -0.1, 0.4]} rotation={[0, 0, 3.14]}>
            <torusGeometry args={[0.25, 0.05, 16, 32, 3.14]} />
            <meshStandardMaterial color='#374151' />
          </mesh>
          <mesh position={[0, -0.1, 0.42]}>
            <boxGeometry args={[0.4, 0.05, 0.02]} />
            <meshStandardMaterial color='#ffffff' />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.2, -0.1, 0.5]}>
            <coneGeometry args={[0.08, 0.4, 16]} />
            <meshStandardMaterial color='#60a5fa' />
          </mesh>
          <mesh position={[0.2, -0.1, 0.5]}>
            <coneGeometry args={[0.08, 0.4, 16]} />
            <meshStandardMaterial color='#60a5fa' />
          </mesh>
          <mesh position={[0, -0.25, 0.45]} rotation={[1.57, 0, 0]}>
            <torusGeometry args={[0.1, 0.04, 16, 32]} />
            <meshStandardMaterial color='#374151' />
          </mesh>
        </>
      )}
    </group>
  );
}

function KeyObject() {
  return (
    <>
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[0.3, 0.08, 16, 32]} />
        <meshStandardMaterial color='#fde68a' metalness={1} roughness={0.08} emissive='#fbbf24' emissiveIntensity={0.45} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 1.6, 16]} />
        <meshStandardMaterial color='#fde68a' metalness={1} roughness={0.08} emissive='#fbbf24' emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0.2, -0.6, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshStandardMaterial color='#fde68a' metalness={1} roughness={0.08} emissive='#fbbf24' emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0.2, -0.3, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshStandardMaterial color='#fde68a' metalness={1} roughness={0.08} emissive='#fbbf24' emissiveIntensity={0.45} />
      </mesh>
    </>
  );
}

function SeedObject() {
  return (
    <>
      <mesh position={[0, -0.25, 0]} scale={[1.5, 0.5, 1.5]}>
        <sphereGeometry args={[0.2, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color='#5d4037' roughness={1} />
      </mesh>
      <group position={[0.15, -0.22, 0.1]} rotation={[0, 0.5, 0.2]}>
        <mesh rotation={[0, 0, -0.5]}>
          <sphereGeometry args={[0.05, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color='#8d6e63' roughness={0.8} side={DoubleSide} />
        </mesh>
      </group>
      <mesh rotation={[0.05, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.035, 0.5, 16]} />
        <meshPhysicalMaterial color='#aed581' roughness={0.5} metalness={0.1} />
      </mesh>
      {[1, -1].map((sign) => (
        <group key={sign} position={[0, 0.22, 0]} rotation={[0, 0, sign * 0.6]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.008, 0.015, 0.1, 8]} />
            <meshPhysicalMaterial color='#aed581' roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.18, 0]} scale={[1, 1.4, 0.1]}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshPhysicalMaterial color='#7cb342' roughness={0.3} clearcoat={0.2} emissive='#8bc34a' emissiveIntensity={0.1} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function BranchObject({ growth }: { growth: number }) {
  const branchSpecs = [
    { position: [0.02, 0.1, 0] as const, rotation: [0, 0, -0.8] as const, length: 0.5, leaf: 0.12, scale: growth },
    { position: [-0.02, 0.2, 0] as const, rotation: [0, 0, 0.9] as const, length: 0.4, leaf: 0.1, scale: growth * 0.9 },
    { position: [0, 0.3, 0.02] as const, rotation: [0.7, 0.5, -0.3] as const, length: 0.3, leaf: 0.08, scale: growth * 0.8 },
    { position: [0, 0.4, -0.02] as const, rotation: [-0.6, 0, 0.4] as const, length: 0.35, leaf: 0.09, scale: growth * 0.85 }
  ];

  return (
    <>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.8, 16]} />
        <meshPhysicalMaterial color='#8d6e63' roughness={0.6} metalness={0.1} />
      </mesh>
      <group position={[0, 0.1, 0]}>
        {branchSpecs.map((spec, index) => (
          <group key={index} position={spec.position} rotation={spec.rotation} scale={[spec.scale, spec.scale, spec.scale]}>
            <mesh position={[0, spec.length / 2, 0]}>
              <cylinderGeometry args={[index < 2 ? 0.015 : 0.012, index < 2 ? 0.025 : 0.02, spec.length, 8]} />
              <meshPhysicalMaterial color='#8d6e63' roughness={0.6} />
            </mesh>
            <mesh position={[0, spec.length, 0]} scale={[1, 0.3, 1]}>
              <sphereGeometry args={[spec.leaf, 16, 16]} />
              <meshPhysicalMaterial color='#66bb6a' roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

function BulbObject({ color, intensity }: { color: Color; intensity: number }) {
  return (
    <>
      <group position={[0, -0.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.15, 0.35, 32]} />
          <meshStandardMaterial color='#78909c' metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.02, 16, 32]} />
          <meshStandardMaterial color='#90a4ae' metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.17, 0.02, 16, 32]} />
          <meshStandardMaterial color='#90a4ae' metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color='#37474f' />
        </mesh>
      </group>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          roughness={0.2}
          metalness={0.1}
          transmission={0.1}
          thickness={0.1}
          clearcoat={0.5}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.15, 0.03, 16, 32, Math.PI]} />
        <meshBasicMaterial color='#fff59d' />
      </mesh>
      <pointLight intensity={intensity * 3} distance={8} color='#ffd54f' position={[0, 0.1, 0]} />
    </>
  );
}

function LeafObject() {
  const veinSpecs = [
    [0.25, 0.2, -0.9, 0.5],
    [-0.25, 0.1, 0.9, 0.5],
    [0.22, -0.3, -0.8, 0.45],
    [-0.22, -0.4, 0.8, 0.45]
  ];

  return (
    <group rotation={[0.4, 0.2, 0]}>
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.4, 16]} />
        <meshPhysicalMaterial color='#66bb6a' roughness={0.6} />
      </mesh>
      <mesh scale={[1, 1.4, 0.15]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshPhysicalMaterial color='#4caf50' roughness={0.3} metalness={0.1} clearcoat={0.3} emissive='#81c784' emissiveIntensity={0.1} />
      </mesh>
      {[0.08, -0.08].map((z) => (
        <mesh key={`midrib-${z}`} position={[0, 0, z]} scale={[0.05, 1.3, 0.05]}>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color='#a5d6a7' roughness={0.5} />
        </mesh>
      ))}
      {[0.07, -0.07].map((z) => (
        <group key={`veins-${z}`} position={[0, 0, z]}>
          {veinSpecs.map(([x, y, rz, scaleY], index) => (
            <mesh key={index} position={[x, y, 0]} rotation={[0, 0, rz]} scale={[0.03, scaleY, 0.03]}>
              <cylinderGeometry args={[1, 1, 1, 8]} />
              <meshStandardMaterial color='#a5d6a7' />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function SingleLoginStage({ stageId, stageBlend = 0 }: { stageId: number; stageBlend?: number }) {
  const groupRef = useRef<Group>(null);
  const keyRef = useRef<Group>(null);
  const scaleMultiplier = (0.8 + 0.2 * stageBlend) * 1.5;

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.2;
      groupRef.current.position.y = Math.sin(elapsed) * 0.1;
    }
    if (keyRef.current) {
      keyRef.current.rotation.z = elapsed * 0.5;
    }
  });

  if (stageId === 1) {
    return (
      <group ref={groupRef} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
        <Hand side='left' />
        <Hand side='right' />
      </group>
    );
  }

  if (stageId === 2) {
    return (
      <group ref={groupRef} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
        <Face mood='laugh' />
        <Face mood='cry' />
      </group>
    );
  }

  if (stageId === 3) {
    return (
      <group ref={groupRef} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
        <group ref={keyRef}>
          <KeyObject />
        </group>
      </group>
    );
  }

  return (
    <group ref={groupRef} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]} rotation={[0.2, -0.5, 0]}>
      <BooksObject />
    </group>
  );
}

function SingleRegisterStage({ stageId }: { stageId: number }) {
  const groupRef = useRef<Group>(null);
  const bulbRef = useRef<Group>(null);
  const bulbColor = useMemo(() => new Color('#fbbf24'), []);
  const scaleMultiplier = 2;

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.3;
      groupRef.current.position.y = Math.sin(elapsed) * 0.1;
    }
    if (bulbRef.current) {
      bulbRef.current.rotation.z = Math.sin(elapsed * 2) * 0.1;
    }
  });

  if (stageId === 1) {
    return (
      <group ref={groupRef} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
        <BranchObject growth={1} />
      </group>
    );
  }

  if (stageId === 2) {
    return (
      <group ref={groupRef} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
        <group ref={bulbRef}>
          <BulbObject color={bulbColor} intensity={2} />
        </group>
      </group>
    );
  }

  if (stageId === 3) {
    return (
      <group ref={groupRef} scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
        <LeafObject />
      </group>
    );
  }

  return (
    <group ref={groupRef} scale={[2.4, 2.4, 2.4]}>
      <SeedObject />
    </group>
  );
}

function LoginFallbackModel({ stageId }: { stageId: number }) {
  if (stageId === 1) {
    return (
      <>
        <span className='auth-css-part auth-css-arm auth-css-arm--left' />
        <span className='auth-css-part auth-css-arm auth-css-arm--right' />
        <span className='auth-css-part auth-css-hand auth-css-hand--left' />
        <span className='auth-css-part auth-css-hand auth-css-hand--right' />
        <span className='auth-css-part auth-css-spark auth-css-spark--one' />
        <span className='auth-css-part auth-css-spark auth-css-spark--two' />
      </>
    );
  }

  if (stageId === 2) {
    return (
      <>
        <span className='auth-css-part auth-css-face auth-css-face--laugh'>
          <span />
        </span>
        <span className='auth-css-part auth-css-face auth-css-face--tear'>
          <span />
        </span>
      </>
    );
  }

  if (stageId === 3) {
    return (
      <>
        <span className='auth-css-part auth-css-key-ring' />
        <span className='auth-css-part auth-css-key-shaft' />
        <span className='auth-css-part auth-css-key-tooth auth-css-key-tooth--one' />
        <span className='auth-css-part auth-css-key-tooth auth-css-key-tooth--two' />
        <span className='auth-css-part auth-css-glow auth-css-glow--gold' />
      </>
    );
  }

  return (
    <>
      <span className='auth-css-part auth-css-book auth-css-book--one' />
      <span className='auth-css-part auth-css-book auth-css-book--two' />
      <span className='auth-css-part auth-css-book auth-css-book--three' />
      <span className='auth-css-part auth-css-ribbon' />
    </>
  );
}

function RegisterFallbackModel({ stageId }: { stageId: number }) {
  if (stageId === 1) {
    return (
      <>
        <span className='auth-css-part auth-css-branch auth-css-branch--trunk' />
        <span className='auth-css-part auth-css-branch auth-css-branch--left' />
        <span className='auth-css-part auth-css-branch auth-css-branch--right' />
        <span className='auth-css-part auth-css-leaf auth-css-leaf--one' />
        <span className='auth-css-part auth-css-leaf auth-css-leaf--two' />
        <span className='auth-css-part auth-css-leaf auth-css-leaf--three' />
      </>
    );
  }

  if (stageId === 2) {
    return (
      <>
        <span className='auth-css-part auth-css-bulb' />
        <span className='auth-css-part auth-css-bulb-base' />
        <span className='auth-css-part auth-css-glow auth-css-glow--bulb' />
      </>
    );
  }

  if (stageId === 3) {
    return (
      <>
        <span className='auth-css-part auth-css-final-leaf' />
        <span className='auth-css-part auth-css-final-stem' />
        <span className='auth-css-part auth-css-dew auth-css-dew--one' />
        <span className='auth-css-part auth-css-dew auth-css-dew--two' />
      </>
    );
  }

  return (
    <>
      <span className='auth-css-part auth-css-seed' />
      <span className='auth-css-part auth-css-sprout auth-css-sprout--stem' />
      <span className='auth-css-part auth-css-sprout auth-css-sprout--left' />
      <span className='auth-css-part auth-css-sprout auth-css-sprout--right' />
    </>
  );
}

function AuthCssThreeStage({ variant, stageId }: AuthThreeStageProps) {
  return (
    <div className='auth-css-stage' data-variant={variant} data-stage={stageId}>
      <div className={`auth-css-model auth-css-model--${variant}-${stageId}`}>
        <span className='auth-css-shadow' />
        {variant === 'register' ? <RegisterFallbackModel stageId={stageId} /> : <LoginFallbackModel stageId={stageId} />}
      </div>
    </div>
  );
}

function AuthCanvasStage({ variant, stageId, stageBlend }: AuthThreeStageProps) {
  const isLogin = variant === 'login';

  return (
    <Canvas
      className='auth-live-canvas'
      style={{ width: '100%', height: '100%' }}
      camera={{ position: isLogin ? [0, 2, 6] : [0, 0, 6], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{
        outputColorSpace: SRGBColorSpace,
        preserveDrawingBuffer: true,
        toneMapping: NoToneMapping
      }}
      shadows
    >
      <color attach='background' args={['#052e16']} />
      <Stars radius={100} depth={50} count={5000} factor={0.35} saturation={0} fade />
      {isLogin ? (
        <>
          <ambientLight intensity={0.5} color='#ffffff' />
          <directionalLight position={[5, 5, 5]} intensity={1} color='#fff7ed' castShadow />
          <spotLight position={[-5, 5, -5]} intensity={2} color='#dbeafe' angle={0.5} penumbra={1} castShadow />
          <SingleLoginStage stageId={stageId} stageBlend={stageBlend} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.7} color='#ffffff' />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color='#fff7ed' castShadow />
          <spotLight position={[-5, 5, -5]} intensity={2} color='#dbeafe' angle={0.5} penumbra={1} />
          <SingleRegisterStage stageId={stageId} />
        </>
      )}
    </Canvas>
  );
}

function AuthWebGLStage(props: AuthThreeStageProps) {
  const [webGLStatus, setWebGLStatus] = useState<'checking' | 'supported' | 'unsupported'>('checking');
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setWebGLStatus(hasWebGLSupport() ? 'supported' : 'unsupported');
  }, []);

  const fallback = <AuthCssThreeStage {...props} />;

  if (webGLStatus === 'checking') {
    return (
      <div
        className='auth-live-canvas-placeholder auth-live-canvas-loading'
        data-stage={props.stageId}
        data-variant={props.variant}
      />
    );
  }

  if (prefersReducedMotion || webGLStatus === 'unsupported') return fallback;

  return (
    <CanvasBoundary fallback={fallback}>
      <AuthCanvasStage {...props} />
    </CanvasBoundary>
  );
}

export function AuthThreeStage(props: AuthThreeStageProps) {
  return <AuthWebGLStage {...props} />;
}
