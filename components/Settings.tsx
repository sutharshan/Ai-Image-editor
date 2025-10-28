import React, { useState } from 'react';
import { WatermarkSettings, WatermarkPosition } from '../types';
import { Icon } from './Icon';

interface SettingsProps {
  settings: WatermarkSettings;
  onSave: (newSettings: WatermarkSettings) => void;
  onClose: () => void;
}

const positionOptions = [
    { value: WatermarkPosition.TopLeft, label: 'Top Left' },
    { value: WatermarkPosition.TopRight, label: 'Top Right' },
    { value: WatermarkPosition.BottomLeft, label: 'Bottom Left' },
    { value: WatermarkPosition.BottomRight, label: 'Bottom Right' },
    { value: WatermarkPosition.Center, label: 'Center' },
];

const fontOptions = [
    { value: 'Inter', label: 'Inter (Sans-serif)' },
    { value: 'Roboto Slab', label: 'Roboto Slab (Serif)' },
    { value: 'Lobster', label: 'Lobster (Cursive)' },
    { value: 'Source Code Pro', label: 'Source Code Pro (Monospace)' },
    { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
];


const Settings: React.FC<SettingsProps> = ({ settings, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = useState<WatermarkSettings>(settings);

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setLocalSettings({ ...localSettings, logo: event.target?.result as string, type: 'logo' });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearWatermark = () => {
        setLocalSettings(prev => ({
            ...prev,
            type: 'text',
            text: '',
            logo: null,
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Watermark Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                     {/* Watermark Type */}
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setLocalSettings(s => ({...s, type: 'text'}))} 
                            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-colors ${localSettings.type === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            Text Watermark
                        </button>
                         <button 
                            onClick={() => setLocalSettings(s => ({...s, type: 'logo'}))} 
                            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-colors ${localSettings.type === 'logo' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            Logo Watermark
                        </button>
                    </div>

                    {localSettings.type === 'text' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label htmlFor="watermark-text" className="block text-sm font-medium text-gray-300 mb-1">Watermark Text</label>
                                <input
                                    id="watermark-text"
                                    type="text"
                                    value={localSettings.text}
                                    onChange={(e) => setLocalSettings({ ...localSettings, text: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter watermark text"
                                />
                            </div>
                             <div>
                                <label htmlFor="font-family" className="block text-sm font-medium text-gray-300 mb-1">Font Family</label>
                                <select
                                    id="font-family"
                                    value={localSettings.fontFamily}
                                    onChange={(e) => setLocalSettings({ ...localSettings, fontFamily: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {fontOptions.map(font => (
                                        <option key={font.value} value={font.value} style={{fontFamily: font.value}}>{font.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label htmlFor="font-size" className="block text-sm font-medium text-gray-300 mb-1">Font Size</label>
                                    <input
                                        id="font-size"
                                        type="number"
                                        value={localSettings.fontSize}
                                        onChange={(e) => setLocalSettings({ ...localSettings, fontSize: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="font-color" className="block text-sm font-medium text-gray-300 mb-1">Font Color</label>
                                    <input
                                        id="font-color"
                                        type="color"
                                        value={localSettings.color}
                                        onChange={(e) => setLocalSettings({ ...localSettings, color: e.target.value })}
                                        className="w-full h-10 bg-gray-900 border border-gray-600 rounded-md p-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {localSettings.type === 'logo' && (
                         <div className="space-y-4 animate-fade-in">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Upload Logo</label>
                            <div className="flex items-center gap-4">
                                <label htmlFor="logo-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                                    Choose File
                                </label>
                                <input id="logo-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                                {localSettings.logo && <img src={localSettings.logo} alt="Logo Preview" className="h-12 w-auto bg-white p-1 rounded" />}
                            </div>
                        </div>
                    )}
                    
                    {/* Position */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {positionOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setLocalSettings({ ...localSettings, position: option.value })}
                                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${localSettings.position === option.value ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Opacity */}
                    <div>
                        <label htmlFor="opacity" className="block text-sm font-medium text-gray-300 mb-1">Opacity ({Math.round(localSettings.opacity * 100)}%)</label>
                        <input
                            id="opacity"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={localSettings.opacity}
                            onChange={(e) => setLocalSettings({ ...localSettings, opacity: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-900/50 flex justify-end items-center gap-4">
                    <button
                        onClick={handleClearWatermark}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                    >
                        Clear Watermark
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;