import React, { useEffect, useRef } from 'react';

interface Transform {
    scale: number;
    x: number;
    y: number;
}

interface Dimensions {
    width: number;
    height: number;
}

export const useImageTransform = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    imageDimensions: Dimensions | null,
    transform: Transform,
    setTransform: React.Dispatch<React.SetStateAction<Transform>>,
    isTransformEnabled: boolean
) => {
    const isDraggingRef = useRef(false);
    const lastMousePositionRef = useRef({ x: 0, y: 0 });

    const clampPosition = (newTransform: Transform, canvas: HTMLCanvasElement, imgDim: Dimensions): Transform => {
        const { scale, x, y } = newTransform;
        const scaledWidth = imgDim.width * scale;
        const scaledHeight = imgDim.height * scale;

        // Ensure the image edges don't come inside the canvas frame
        const clampedX = Math.min(0, Math.max(x, canvas.width - scaledWidth));
        const clampedY = Math.min(0, Math.max(y, canvas.height - scaledHeight));
        
        return { ...newTransform, x: clampedX, y: clampedY };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isTransformEnabled || !imageDimensions) return;

        const handleMouseDown = (e: MouseEvent) => {
            isDraggingRef.current = true;
            lastMousePositionRef.current = { x: e.offsetX, y: e.offsetY };
            canvas.style.cursor = 'grabbing';
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            canvas.style.cursor = 'grab';
        };

        const handleMouseLeave = () => {
            isDraggingRef.current = false;
            canvas.style.cursor = 'grab';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const dx = e.offsetX - lastMousePositionRef.current.x;
            const dy = e.offsetY - lastMousePositionRef.current.y;
            lastMousePositionRef.current = { x: e.offsetX, y: e.offsetY };

            setTransform(prevTransform => {
                const newTransform = {
                    ...prevTransform,
                    x: prevTransform.x + dx,
                    y: prevTransform.y + dy,
                };
                return clampPosition(newTransform, canvas, imageDimensions);
            });
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const scaleAmount = e.deltaY * -0.001;
            
            setTransform(prevTransform => {
                const newScale = Math.max(0.1, prevTransform.scale + scaleAmount);
                const mouseX = e.offsetX;
                const mouseY = e.offsetY;

                // The point on the image under the mouse
                const imagePointX = (mouseX - prevTransform.x) / prevTransform.scale;
                const imagePointY = (mouseY - prevTransform.y) / prevTransform.scale;

                const newX = mouseX - imagePointX * newScale;
                const newY = mouseY - imagePointY * newScale;
                
                const newTransform = { scale: newScale, x: newX, y: newY };

                const clamped = clampPosition(newTransform, canvas, imageDimensions);
                
                // Ensure zooming out doesn't reveal empty space
                if (clamped.scale * imageDimensions.width < canvas.width || clamped.scale * imageDimensions.height < canvas.height) {
                   return prevTransform; // or reset to cover
                }
                
                return clamped;
            });
        };
        
        canvas.style.cursor = 'grab';
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('wheel', handleWheel);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('wheel', handleWheel);
            canvas.style.cursor = 'default';
        };
    }, [canvasRef, imageDimensions, isTransformEnabled, setTransform]);
};
