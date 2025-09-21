// color-thief-browser.d.ts
// Add this to your project to fix the type error
// declare module 'color-thief-browser';

import ColorThief from 'color-thief-browser';

interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

function rgbToHsl({ r, g, b }: RGB): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function adjustBrightness(color: RGB, factor: number): RGB {
  return {
    r: Math.min(255, Math.max(0, Math.round(color.r * factor))),
    g: Math.min(255, Math.max(0, Math.round(color.g * factor))),
    b: Math.min(255, Math.max(0, Math.round(color.b * factor))),
  };
}

export async function extractThemeColors(imageUrl: string): Promise<{
  main: string;
  light: string;
  dark: string;
}> {
  try {
    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const palette = colorThief.getPalette(img, 3);
    const mainColor: RGB = { r: palette[0][0], g: palette[0][1], b: palette[0][2] };
    const [h, s, l] = rgbToHsl(mainColor);

    // If the color is too dark or too light, use a fallback color
    if (l < 20 || l > 80 || s < 10) {
      return {
        main: '#2C2C54', // Primary dark blue
        light: '#F8C291', // Light peach
        dark: '#1B1B1B', // Very dark
      };
    }

    // Adjust the color based on hue to ensure it's visually appealing
    const hueAdjustment = h > 180 ? 0.9 : 1.1;
    const mainColorAdjusted = adjustBrightness(mainColor, hueAdjustment);

    return {
      main: rgbToHex(mainColorAdjusted),
      light: rgbToHex(adjustBrightness(mainColorAdjusted, 1.3)),
      dark: rgbToHex(adjustBrightness(mainColorAdjusted, 0.7)),
    };
  } catch (error) {
    console.error('Failed to extract theme colors:', error);
    // Fallback to the new theme colors
    return {
      main: '#2C2C54', // Primary dark blue
      light: '#F8C291', // Light peach
      dark: '#1B1B1B', // Very dark
    };
  }
}

export const defaultTheme = {
  primary: '#2C2C54', // Primary dark blue
  secondary: '#F8C291', // Light peach
  accent: '#F5CD79', // Light yellow
  white: '#FDFEFE', // Off-white
  dark: '#1B1B1B', // Very dark
  main: '#2C2C54', // For backward compatibility
  light: '#F8C291', // For backward compatibility
}; 