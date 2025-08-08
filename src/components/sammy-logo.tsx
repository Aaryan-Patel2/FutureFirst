
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
        <g id="Complete">
            <g id="user-tie">
                <g>
                    <path 
                        d="M669.2,577.9c-3.1-2.3-6.4-4.5-10-6.6c-27.1-15.9-57.2-26-90-30c-25-3-48,1.4-71.1,5.6c-27.4,5-54.2,12.5-79.6,22.4c-22.3,8.7-44,18.9-63.1,32.6c-18.7,13.4-34,30-47.5,48.2c-12.2,16.5-22.1,35-29.6,54.7c-9,23.5-14.7,48.2-17.1,73.6c-2,21.5-1,42.5,3.3,63.1c1.8,8.6,9.8,14.6,18.5,14.6h478.3c8.7,0,16.7-6,18.5-14.6c4.3-20.6,5.3-41.6,3.3-63.1c-2.4-25.3-8-50.1-17.1-73.6c-7.5-19.7-17.4-38.2-29.6-54.7c-13.5-18.2-28.9-34.8-47.5-48.2C713.2,596.8,691.5,586.6,669.2,577.9z" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="50"
                    />
                    <path 
                        d="M512,504.1c68.4,0,123.8-55.4,123.8-123.8V359c0-68.4-55.4-123.8-123.8-123.8s-123.8,55.4-123.8,123.8v21.3C388.2,448.7,443.6,504.1,512,504.1z" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="50"
                    />
                </g>
            </g>
        </g>
    </svg>
  );
}
