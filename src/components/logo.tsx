
import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <Image 
      src="/graphics/Saugus Logo.svg" 
      alt="Saugus Logo" 
      width={40} 
      height={40}
      className="object-contain"
    />
  );
}
