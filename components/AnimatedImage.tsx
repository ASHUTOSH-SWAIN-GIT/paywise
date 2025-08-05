"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AnimatedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const AnimatedImage: React.FC<AnimatedImageProps> = ({ src, alt, width, height, className }) => {
  return (
    <div className="flex justify-center items-center overflow-visible p-0 sm:p-10 w-full">
      <div className="w-full">
        <div className="relative w-full">
          <div className="absolute inset-0 bg-blue-500/30 blur-[150px] rounded-full scale-110" />
          <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full scale-95" />
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={cn("relative z-10", className)}
            style={{
              width: "100%",
              height: "auto",
            }}
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedImage;
