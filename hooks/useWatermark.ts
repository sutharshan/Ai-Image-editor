import React, { useEffect, useRef } from 'react';
import { WatermarkSettings, WatermarkPosition } from '../types';

interface Transform {
    scale: number;
    x: number;
    y: number;
}

const parseAspectRatio = (ratioStr: string): number | null => {
    if (!ratioStr.includes(':')) return null;
    const [w, h] = ratioStr.split(':').map(Number);
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return w / h;
};

export const useWatermark = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    imageSrc: string | null,
    settings: WatermarkSettings,
    aspectRatio: string,
    transform: Transform,
    isPending: boolean,
) => {
    const watermarkLogoRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (settings.type === 'logo' && settings.logo) {
            const img = new Image();
            img.src = settings.logo;
            img.onload = () => {
                watermarkLogoRef.current = img;
                drawImageWithWatermark();
            };
        } else {
            watermarkLogoRef.current = null;
            drawImageWithWatermark();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.logo, settings.type]);

    useEffect(() => {
        drawImageWithWatermark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSrc, settings, canvasRef, aspectRatio, transform, isPending]);

    const drawImageWithWatermark = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas || !imageSrc) return;

        const mainImage = new Image();
        mainImage.src = imageSrc;
        mainImage.onload = () => {
            const imageWidth = mainImage.width;
            const imageHeight = mainImage.height;

            const container = canvas.parentElement;
            if (!container) return;

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            const targetRatio = parseAspectRatio(aspectRatio);

            let canvasWidth = imageWidth;
            let canvasHeight = imageHeight;

            if (targetRatio) {
                const containerRatio = containerWidth / containerHeight;
                if (containerRatio > targetRatio) {
                    canvasHeight = containerHeight;
                    canvasWidth = canvasHeight * targetRatio;
                } else {
                    canvasWidth = containerWidth;
                    canvasHeight = canvasWidth / targetRatio;
                }
            } else { // 'original' aspect ratio
                const imageRatio = imageWidth / imageHeight;
                const containerRatio = containerWidth / containerHeight;
                 if (containerRatio > imageRatio) {
                    canvasHeight = containerHeight;
                    canvasWidth = canvasHeight * imageRatio;
                } else {
                    canvasWidth = containerWidth;
                    canvasHeight = canvasWidth / imageRatio;
                }
            }
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (isPending) {
                 ctx.drawImage(
                    mainImage,
                    transform.x,
                    transform.y,
                    imageWidth * transform.scale,
                    imageHeight * transform.scale
                );
            } else {
                 ctx.drawImage(mainImage, 0, 0, canvas.width, canvas.height);
            }

            applyWatermark(ctx, canvas.width, canvas.height);
        };
    };

    const applyWatermark = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
        ctx.globalAlpha = settings.opacity;

        if (settings.type === 'logo' && watermarkLogoRef.current) {
            drawWatermarkLogo(ctx, canvasWidth, canvasHeight);
        } else if (settings.type === 'text' && settings.text) {
            drawWatermarkText(ctx, canvasWidth, canvasHeight);
        }

        ctx.globalAlpha = 1.0;
    };

    const getPosition = (
        canvasSize: number,
        contentSize: number,
        position: WatermarkPosition,
        isVertical: boolean = false,
    ) => {
        const margin = 20;
         if (position.includes('left')) return margin;
        if (position.includes('right')) return canvasSize - contentSize - margin;
        if (position.includes('top')) return margin;
        if (position.includes('bottom')) return canvasSize - contentSize - margin;
        return (canvasSize - contentSize) / 2; // center
    };

    const drawWatermarkLogo = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
        const logo = watermarkLogoRef.current;
        if (!logo) return;
        
        const logoAspectRatio = logo.width / logo.height;
        let logoWidth = canvasWidth * 0.15; // 15% of canvas width
        let logoHeight = logoWidth / logoAspectRatio;

        if (logoHeight > canvasHeight * 0.15) {
            logoHeight = canvasHeight * 0.15;
            logoWidth = logoHeight * logoAspectRatio;
        }

        const x = getPosition(canvasWidth, logoWidth, settings.position);
        const y = getPosition(canvasHeight, logoHeight, settings.position, true);
        
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
    };

    const drawWatermarkText = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
        ctx.fillStyle = settings.color;
        ctx.font = `${settings.fontSize}px '${settings.fontFamily}', sans-serif`;
        
        const metrics = ctx.measureText(settings.text);
        const textWidth = metrics.width;
        const textHeight = settings.fontSize;
        
        const x = getPosition(canvasWidth, textWidth, settings.position);
        const y = getPosition(canvasHeight, textHeight, settings.position, true);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(settings.text, x, y);
    };
};