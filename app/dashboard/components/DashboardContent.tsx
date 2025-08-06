"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sidebar } from "./sidebar/Sidebar";
import { Header } from "./Header";
import { MainContent } from "./MainContent";

export function DashboardContent() {
  const [activeSection, setActiveSection] = useState("split-management");
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error parameter and show appropriate message
    const error = searchParams.get('error');
    if (error === 'access_denied') {
      toast.error('Access denied: You do not have permission to access the admin panel.');
    }
  }, [searchParams]);

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
