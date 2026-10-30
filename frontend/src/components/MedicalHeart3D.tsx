import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function HeartShape() {
  const heart = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (heart.current) {
      heart.current.rotation.y += delta * 0.25;
      heart.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.7) * 0.06;
    }
  });

  const shape = new THREE.Shape();

  shape.moveTo(0, -0.35);
  shape.bezierCurveTo(-0.1, -0.15, -0.9, 0.35, -0.85, 0.85);
  shape.bezierCurveTo(-0.8, 1.45, -0.1, 1.55, 0, 1.1);
  shape.bezierCurveTo(0.1, 1.55, 0.8, 1.45, 0.85, 0.85);
  shape.bezierCurveTo(0.9, 0.35, 0.1, -0.15, 0, -0.35);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.45,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 2,
    bevelSize: 0.18,
    bevelThickness: 0.2,
    curveSegments: 32,
  });

  geometry.center();

  return (
    <group ref={heart} rotation={[0.15, 0, Math.PI]}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#e75485"
          metalness={0.15}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </mesh>
    </group>
  );
}

export default function MedicalHeart3D() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
        <ambientLight intensity={2} />
        <directionalLight
          position={[3, 5, 5]}
          intensity={3}
          color="#ffffff"
        />
        <pointLight
          position={[-3, -2, 3]}
          intensity={25}
          color="#b5a0ff"
        />

        <Float speed={2} rotationIntensity={0.15} floatIntensity={0.4}>
          <HeartShape />
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
