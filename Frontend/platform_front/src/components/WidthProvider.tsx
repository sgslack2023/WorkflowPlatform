import React, { useEffect, useRef, useState } from "react";

export const WidthProvider = (ComposedComponent: React.ComponentType<any>) => {
    return (props: any) => {
        const [width, setWidth] = useState(1200);
        const elementRef = useRef<HTMLDivElement>(null);
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    // Use contentRect.width or offsetWidth
                    setWidth(entry.contentRect.width);
                }
            });

            if (elementRef.current) {
                resizeObserver.observe(elementRef.current);
                // Set initial width
                setWidth(elementRef.current.offsetWidth);
            }

            return () => {
                resizeObserver.disconnect();
            };
        }, []);

        return (
            <div
                className={props.className}
                style={{ ...props.style, width: '100%' }}
                ref={elementRef}
            >
                {mounted && width > 0 && ComposedComponent && (
                    <ComposedComponent
                        {...props}
                        width={width}
                    // Pass width directly. RGL needs it.
                    />
                )}
                {mounted && !ComposedComponent && (
                    <div style={{ padding: 20, color: 'red' }}>
                        Error: Grid component failed to load. Please check console.
                    </div>
                )}
            </div>
        );
    };
};

export default WidthProvider;
