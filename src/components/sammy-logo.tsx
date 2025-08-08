
'use client';

import { cn } from '@/lib/utils';
import React from 'react';

export function SammyLogo({ className }: { className?: string }) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full", className)}
    >
      <g stroke="hsl(var(--foreground))" strokeWidth="10">
        {/* Helmet Main Shape (Dark Navy) */}
        <path 
          d="M625,850 C525,850 500,750 500,700 L500,600 C500,550 525,500 575,500 C625,500 650,550 650,600 L650,700 C650,750 675,850 725,850 L625,850 Z M585,600 L625,600 L625,680 L585,680 Z" 
          fill="hsl(var(--foreground))"
        />
        <path 
          d="M575,500 C525,500 500,550 500,600 L510,600 C510,555 530,510 575,510 Z"
          fill="hsl(var(--muted-foreground))"
        />
        {/* Face Guard */}
        <path 
          d="M580,680 C550,720 540,780 550,820 L580,810 C570,780 575,730 600,700 L580,680 Z"
          fill="hsl(var(--foreground))"
        />
        <path 
          d="M600,700 C575,730 570,780 580,810 L590,800 C585,780 585,740 610,715 L600,700 Z"
          fill="hsl(var(--muted-foreground))"
        />

        {/* Plume (Top Feathers) */}
        <path 
          d="M350,200 C400,150 550,150 650,200 L800,500 L700,500 L650,400 L600,500 L550,400 L500,500 L450,400 L400,500 L300,500 Z"
          fill="hsl(var(--accent))"
        />
        <path 
          d="M360,210 C410,160 550,160 640,210 L790,490 L700,490 L650,390 L600,490 L550,390 L500,490 L450,390 L410,490 L310,490 Z"
          fill="hsl(var(--background))"
          stroke="hsl(var(--accent))"
          strokeWidth="5"
        />
         <path 
          d="M370,220 C420,170 550,170 630,220 L780,480 L700,480 L650,380 L600,480 L550,380 L500,480 L450,380 L420,480 L320,480 Z"
          fill="hsl(var(--accent))"
          stroke="hsl(var(--accent))"
          strokeWidth="5"
        />
        
        {/* Helmet Details */}
        <path 
          d="M500,600 L650,600 L650,550 C650,500 600,450 575,450 C550,450 500,500 500,550 Z"
          fill="hsl(var(--foreground))"
        />
        <path 
          d="M510,590 L640,590 L640,550 C640,510 600,460 575,460 C550,460 510,510 510,550 Z"
          fill="hsl(var(--muted-foreground))"
        />
      </g>
    </svg>
  );
}
