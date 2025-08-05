
"use client";

import { useRouter } from "next/navigation";
import UserAuthDisplay from "@/app/components/UserAuthDisplay";
import AnimatedImage from "@/components/AnimatedImage";

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Background Gradient */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 100%, #000000 40%, #010133 100%)",
        }}
      />

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-6">
        <h1 className="text-xl md:text-3xl font-semibold text-white">
          Paywise
        </h1>
        <UserAuthDisplay />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center px-4 text-center pt-32 pb-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto">
        

          {/* Main Tagline */}
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-gray-50 to-gray-400 mb-12 mt-24">
            Smart tools to manage<br />
            your expenses and bills
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-white mb-8 max-w-3xl mx-auto leading-relaxed">
            Track shared expenses, manage bills,and send reminders — all in one place
          </p>
          <button 
            onClick={handleGetStarted}
            className="bg-white text-black px-5 py-2 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors cursor-pointer mb-6"
          >
            Get Started
          </button>

          {/* Animated Image */}
          <div className="mt-4 max-w-6xl mx-auto">
            <AnimatedImage 
              src="/image.png"
              alt="Paywise Dashboard Preview"
              width={3000}
              height={2000}
              className="rounded-xl shadow-2xl"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
