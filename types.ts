
export enum WatermarkPosition {
    TopLeft = 'top-left',
    TopRight = 'top-right',
    BottomLeft = 'bottom-left',
    BottomRight = 'bottom-right',
    Center = 'center',
}

export interface WatermarkSettings {
    type: 'text' | 'logo';
    text: string;
    logo: string | null; // base64 string
    position: WatermarkPosition;
    opacity: number; // 0 to 1
    fontSize: number;
    color: string;
    fontFamily: string;
}