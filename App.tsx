
import React, { useState } from 'react';
import ImageEditor from './components/ImageEditor';
import Settings from './components/Settings';
import { WatermarkSettings, WatermarkPosition } from './types';
import { Icon } from './components/Icon';

const App: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
        type: 'text',
        text: 'My Watermark',
        logo: null,
        position: WatermarkPosition.BottomRight,
        opacity: 0.5,
        fontSize: 48,
        color: '#ffffff',
        fontFamily: 'Inter',
    });

    const handleSaveSettings = (newSettings: WatermarkSettings) => {
        setWatermarkSettings(newSettings);
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900">
            <header className="bg-gray-800/50 backdrop-blur-sm shadow-md p-4 flex justify-between items-center border-b border-gray-700 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Icon path="M9.813 15.904L9 18l2.096-.813zM12.22 11.235l-3.486 3.487L12.22 18l3.487-3.486-3.487-3.487zM15.904 9.813L18 9l-.813 2.096-2.096-.813zM11.235 12.22L18 5.707l-3.486-3.486L7.75 9.006l-1.04 4.242 4.243-1.04z" className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Gemini Image Editor</h1>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                    <Icon path="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.28-.1c.386-.14.716.023.962.387.247.364.072.766-.239 1.05l-.28.316c-.247.279-.31.65-.164.98l.21.49a25.8 25.8 0 013.986 3.986l.49.21c.33.146.702.083.982-.164l.316-.28c.283-.25.686-.415 1.05-.239.364.247.527.576.387.962l-.1.28c-.22.55-.684 1.02-1.226 1.11a48.042 48.042 0 01-3.478.397c-1.41.16-2.82.318-4.22.475a48.042 48.042 0 01-3.478-.397c-.542-.09-1.007-.56-1.226-1.11l-.1-.28c-.14-.386.023-.716.387-.962.364-.247.766-.072 1.05.239l.316.28c.279.247.65.31.98.164l.49-.21a25.8 25.8 0 013.986-3.986l-.21-.49c-.146-.33-.083-.702.164-.982l.28-.316c.25-.283.415-.686.239-1.05-.247-.364-.576-.527-.962-.387l-.28.1c-.55.22-1.02.684-1.11 1.226a48.042 48.042 0 01-.397 3.478c-.16 1.41-.318 2.82-.475 4.22a48.042 48.042 0 01.397-3.478zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" className="w-5 h-5" />
                    Watermark Settings
                </button>
            </header>

            <main className="flex-grow overflow-hidden">
                <ImageEditor watermarkSettings={watermarkSettings} />
            </main>

            {isSettingsOpen && (
                <Settings
                    settings={watermarkSettings}
                    onSave={handleSaveSettings}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
};

export default App;