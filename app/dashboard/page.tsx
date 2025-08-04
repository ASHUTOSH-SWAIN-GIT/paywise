"use client";

import { useState } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { Header } from "./components/Header";
import { MainContent } from "./components/MainContent";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("split-management");

  return (
    <div className="min-h-screen bg-black text-neutral-300 flex">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      
      <div className="flex-1 flex flex-col">
        <Header />
        <MainContent activeSection={activeSection} />
      </div>
    </div>
  );
}