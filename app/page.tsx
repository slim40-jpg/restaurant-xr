"use client";

import dynamic from "next/dynamic";
import RestaurantToolbar from "@/components/restaurant/ui/RestaurantToolbar";
import TableLegend from "@/components/restaurant/ui/TableLegend";

// Import dynamique pour éviter le SSR (Three.js ne fonctionne qu'en client)
const RestaurantScene = dynamic(
  () => import("@/components/restaurant/RestaurantScene"),
  { ssr: false }
);

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <RestaurantScene />
      <RestaurantToolbar />
      <TableLegend />
    </main>
  );
}