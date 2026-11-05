"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Lighting from "./environment/Lighting";
import Floor from "./environment/Floor";
import Walls from "./environment/Walls";
import Ceiling from "./environment/Ceiling";
import RestaurantDecor from "./environment/RestaurantDecor";
import CameraControls from "./interaction/CameraControls";
import TableModel from "./furniture/TableModel";
import { restaurantData } from "@/lib/restaurant-data";

export default function RestaurantScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 8, 8], fov: 50 }}
      style={{ background: "#1a1a1a" }}
    >
      <Suspense fallback={null}>
        <Lighting />

        <Floor />
        <Walls />
        <Ceiling />
        <RestaurantDecor />

        {restaurantData.tables.map((table) => (
          <TableModel key={table.id} table={table} />
        ))}

        <CameraControls />
      </Suspense>
    </Canvas>
  );
}