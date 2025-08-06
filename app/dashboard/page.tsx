"use client";

import { Suspense } from "react";
import { DashboardContent } from "./components/DashboardContent";

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}