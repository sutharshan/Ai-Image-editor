import React, { useState, useRef, useCallback, useEffect } from 'react';
import { editImageWithGemini, regenerateImageToAspectRatio } from '../services/geminiService';
import { WatermarkSettings } from '../types';
import { useWatermark } from '../hooks/useWatermark';
import { useImageTransform } from '../hooks/useImageTransform';
import { Icon } from './Icon';
import LoadingSpinner from './LoadingSpinner';

interface ImageEditorProps {
    watermarkSettings: WatermarkSettings;
}

interface Transform {
    scale: number;
    x: number;
    y: number;
}

const aspectRatios = [
    { value: 'original', label: 'Original' },
    { value: '1:1', label: '1:1' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' },
];

const parseAspectRatio = (ratioStr: string): number | null => {
    if (ratioStr === 'original' || !ratioStr.includes(':')) return null;
    const [w, h] = ratioStr.split(':').map(Number);
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return w / h;
};

const ImageEditor: React.FC<ImageEditorProps> = ({ watermarkSettings }) => {
    const [originalImage, setOriginalImage] = useState<{ base64: string; mimeType: string; } | null>(null);
    const [displayImage, setDisplayImage] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; } | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [activeOperation, setActiveOperation] = useState<'edit' | 'remove' | 'variation' | 'regenerate' | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [aspectRatio, setAspectRatio] = useState('original');
    const [pendingAspectRatio, setPendingAspectRatio] = useState<string | null>(null);
    const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLoading = activeOperation !== null;

    useWatermark(canvasRef, displayImage, watermarkSettings, pendingAspectRatio || aspectRatio, transform, pendingAspectRatio !== null);
    useImageTransform(canvasRef, imageDimensions, transform, setTransform, pendingAspectRatio !== null);

    useEffect(() => {
        if (!displayImage) {
            setImageDimensions(null);
            return;
        }
        const img = new Image();
        img.src = displayImage;
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height });
        };
    }, [displayImage]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError(null);
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                const base64 = dataUrl.split(',')[1];
                const mimeType = file.type;
                setOriginalImage({ base64, mimeType });
                setDisplayImage(dataUrl);
                setAspectRatio('original');
                setPendingAspectRatio(null);
            };
            reader.onerror = () => setError("Failed to read the file.");
            reader.readAsDataURL(file);
        }
    };
    
    const performEdit = useCallback(async (editPrompt: string, operation: 'edit' | 'variation' | 'remove') => {
        if (!originalImage) {
            setError('Please upload an image first.');
            return;
        }
        setActiveOperation(operation);
        setError(null);
        try {
            const editedBase64 = await editImageWithGemini(originalImage.base64, originalImage.mimeType, editPrompt);
            const newDataUrl = `data:${originalImage.mimeType};base64,${editedBase64}`;
            setDisplayImage(newDataUrl);
            setOriginalImage(prev => prev ? { ...prev, base64: editedBase64 } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setActiveOperation(null);
        }
    }, [originalImage]);


    const handleEditImage = () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        performEdit(prompt, 'edit');
    };
    const handleGenerateVariation = () => performEdit("Generate a creative variation of this image. Maintain the core subject and composition, but explore different artistic styles, lighting, or details.", 'variation');
    const handleRemoveWatermark = () => performEdit("Remove any watermarks, logos, or text overlays from this image. Ensure the restoration of the area behind the watermark is seamless and matches the surrounding image.", 'remove');


    const handleSelectAspectRatio = (ratio: string) => {
        if (ratio === aspectRatio) {
             setPendingAspectRatio(null);
        } else {
            setPendingAspectRatio(ratio);
            // Calculate initial "cover" transform
            if (canvasRef.current && imageDimensions) {
                const canvas = canvasRef.current;
                const canvasRatio = canvas.width / canvas.height;
                const imageRatio = imageDimensions.width / imageDimensions.height;
                let scale = 1;
                if (canvasRatio > imageRatio) {
                    scale = canvas.width / imageDimensions.width;
                } else {
                    scale = canvas.height / imageDimensions.height;
                }
                setTransform({
                    scale,
                    x: (canvas.width - imageDimensions.width * scale) / 2,
                    y: (canvas.height - imageDimensions.height * scale) / 2,
                });
            }
        }
    };

    const handleApplyCrop = () => {
        const canvas = canvasRef.current;
        if (!displayImage || !imageDimensions || !pendingAspectRatio || !canvas) return;

        const mainImage = new Image();
        mainImage.src = displayImage;
        mainImage.onload = () => {
            // Calculations are relative to the preview canvas, then mapped to original image dimensions
            const sx = -transform.x / transform.scale;
            const sy = -transform.y / transform.scale;
            const sWidth = canvas.width / transform.scale;
            const sHeight = canvas.height / transform.scale;

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = sWidth;
            offscreenCanvas.height = sHeight;
            const offscreenCtx = offscreenCanvas.getContext('2d');
            if (!offscreenCtx) return;

            offscreenCtx.drawImage(mainImage, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

            const croppedDataUrl = offscreenCanvas.toDataURL(originalImage?.mimeType || 'image/png');
            const newBase64 = croppedDataUrl.split(',')[1];
            
            setDisplayImage(croppedDataUrl);
            setOriginalImage(prev => prev ? { ...prev, base64: newBase64 } : null);
            setAspectRatio(pendingAspectRatio);
            setPendingAspectRatio(null);
        };
    };

    const handleRegenerate = async () => {
        if (!originalImage || !pendingAspectRatio) return;
        
        setActiveOperation('regenerate');
        setError(null);
        
        try {
            // First, apply the crop to get the base image for regeneration
            const canvas = canvasRef.current;
            if (!displayImage || !imageDimensions || !pendingAspectRatio || !canvas) throw new Error("Canvas or image not ready.");

            const mainImage = new Image();
            mainImage.src = displayImage;
            await new Promise(resolve => mainImage.onload = resolve);
            
            const sx = -transform.x / transform.scale;
            const sy = -transform.y / transform.scale;
            const sWidth = canvas.width / transform.scale;
            const sHeight = canvas.height / transform.scale;

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = sWidth;
            offscreenCanvas.height = sHeight;
            const offscreenCtx = offscreenCanvas.getContext('2d');
            if (!offscreenCtx) throw new Error("Could not create offscreen context.");

            offscreenCtx.drawImage(mainImage, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            const croppedDataUrl = offscreenCanvas.toDataURL(originalImage.mimeType);
            const croppedBase64 = croppedDataUrl.split(',')[1];
            // Now, regenerate from the cropped image
            const newBase64 = await regenerateImageToAspectRatio(croppedBase64, originalImage.mimeType, pendingAspectRatio);
            const newDataUrl = `data:${originalImage.mimeType};base64,${newBase64}`;

            setDisplayImage(newDataUrl);
            setOriginalImage(prev => prev ? { ...prev, base64: newBase64 } : null);
            setAspectRatio(pendingAspectRatio);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during regeneration.');
        } finally {
            setActiveOperation(null);
            setPendingAspectRatio(null);
        }
    };


    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'edited-image.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const triggerFileSelect = () => fileInputRef.current?.click();
    
    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-8 h-full overflow-y-auto">
            {/* Controls Panel */}
            <div className="lg:w-1/3 xl:w-1/4 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col gap-6 lg:overflow-y-auto">
                <h2 className="text-2xl font-bold text-white">Image Controls</h2>
                
                <div className="space-y-4">
                    <input type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                     <button onClick={triggerFileSelect} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                        <Icon path="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3.75 18A5.25 5.25 0 009 20.25h6a5.25 5.25 0 005.25-2.25" className="w-6 h-6" stroke="currentColor" fill="none" strokeWidth={1.5} />
                        {originalImage ? 'Change Image' : 'Upload Image'}
                    </button>
                </div>

                {originalImage && (
                    <>
                        <div className="space-y-3">
                            <label className="text-lg font-semibold text-gray-200">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {aspectRatios.map(ratio => (
                                    <button
                                        key={ratio.value}
                                        onClick={() => handleSelectAspectRatio(ratio.value)}
                                        disabled={isLoading}
                                        className={`py-2 px-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${pendingAspectRatio === ratio.value ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-400' : ''} ${aspectRatio === ratio.value && !pendingAspectRatio ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {pendingAspectRatio && pendingAspectRatio !== 'original' && (
                             <div className="p-4 bg-gray-700/50 rounded-lg space-y-4 animate-fade-in">
                                <h4 className="font-semibold text-center text-gray-200">Adjust Crop for {pendingAspectRatio}</h4>
                                <div className='text-center text-xs text-gray-300 bg-gray-900/50 p-2 rounded-md'>
                                    <p>Use <span className='font-bold'>mouse wheel</span> to zoom.</p>
                                    <p>Click and <span className='font-bold'>drag</span> to pan.</p>
                                </div>
                                <div className="flex justify-center gap-2">
                                    <button onClick={handleApplyCrop} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md text-sm transition-colors disabled:bg-gray-600">Apply</button>
                                    <button onClick={handleRegenerate} disabled={isLoading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-md text-sm transition-colors disabled:bg-gray-600">
                                        {activeOperation === 'regenerate' ? <LoadingSpinner/> : 'Regenerate'}
                                    </button>
                                    <button onClick={() => setPendingAspectRatio(null)} disabled={isLoading} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-md text-sm transition-colors disabled:opacity-50">Cancel</button>
                                </div>
                            </div>
                        )}
                    </>
                )}


                <div className="flex-grow flex flex-col gap-2">
                    <label htmlFor="prompt" className="text-lg font-semibold text-gray-200">Edit Prompt</label>
                    <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'Add a retro filter'" className="w-full h-24 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 resize-none" disabled={!originalImage} />
                     <button onClick={handleEditImage} disabled={!originalImage || !prompt || isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {activeOperation === 'edit' ? <LoadingSpinner /> : <Icon path="M9.813 15.904L9 18l2.096-.813zM12.22 11.235l-3.486 3.487L12.22 18l3.487-3.486-3.487-3.487zM15.904 9.813L18 9l-.813 2.096-2.096-.813zM11.235 12.22L18 5.707l-3.486-3.486L7.75 9.006l-1.04 4.242 4.243-1.04z" className="w-6 h-6" />}
                        Generate Edit
                    </button>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-gray-700">
                    {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                    <button onClick={handleGenerateVariation} disabled={!originalImage || isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {activeOperation === 'variation' ? <LoadingSpinner /> : <Icon path="M9 14.25l6-6v3.75m-6-3.75v3.75l6-6m-3 13.5a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5z" className="w-6 h-6" />}
                        Generate Variation
                    </button>
                    <button onClick={handleRemoveWatermark} disabled={!originalImage || isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {activeOperation === 'remove' ? <LoadingSpinner /> : <Icon path="M12.923 3.323a1.5 1.5 0 00-2.121 0l-1.385 1.385a.75.75 0 01-1.061 0l-1.385-1.385a1.5 1.5 0 00-2.121 2.121l1.385 1.385a.75.75 0 010 1.061l-1.385 1.385a1.5 1.5 0 002.121 2.121l1.385-1.385a.75.75 0 011.061 0l1.385 1.385a1.5 1.5 0 002.121-2.121l-1.385-1.385a.75.75 0 010-1.061l1.385-1.385a1.5 1.5 0 000-2.121zM18.803 8.197a1.5 1.5 0 00-2.121 0l-1.385 1.385a.75.75 0 01-1.061 0l-1.385-1.385a1.5 1.5 0 00-2.121 2.121l1.385 1.385a.75.75 0 010 1.061l-1.385 1.385a1.5 1.5 0 002.121 2.121l1.385-1.385a.75.75 0 011.061 0l1.385 1.385a1.5 1.5 0 002.121-2.121l-1.385-1.385a.75.75 0 010-1.061l1.385-1.385a1.5 1.5 0 000-2.121z" className="w-6 h-6" />}
                        Remove Watermark
                    </button>
                    <button onClick={handleDownload} disabled={!displayImage || isLoading} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Icon path="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" className="w-6 h-6" stroke="currentColor" fill="none" strokeWidth={1.5} />
                        Download Image
                    </button>
                </div>
            </div>

            {/* Image Display */}
            <div className="lg:w-2/3 xl:w-3/4 bg-gray-900 flex-grow flex items-center justify-center rounded-lg p-4 border-2 border-dashed border-gray-700 overflow-hidden">
                {displayImage ? (
                    <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
                ) : (
                    <div className="text-center text-gray-500">
                        <Icon path="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" className="w-24 h-24 mx-auto" />
                        <p className="mt-4 text-xl">Your image will appear here</p>
                        <p>Upload an image to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageEditor;