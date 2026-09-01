// src/components/GPULayerWrapper.tsx
'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { ReactNode, useEffect } from 'react';

export default function GPULayerWrapper({ children }: { children: ReactNode }) {
    const { disableGPULayer } = useSidebar();
    useEffect(() => {
        document.body.classList.toggle('gpu-layer', !disableGPULayer);
    }, [disableGPULayer]);
    return (
        <div
            className="min-h-screen bg-gray-50"
            style={
                disableGPULayer
                    ? undefined
                    : {
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }
            }
        >
            {children}
        </div>
    );
}