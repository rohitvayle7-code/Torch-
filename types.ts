export enum LightMode {
  REAR = 'REAR',
  SCREEN = 'SCREEN',
}

export interface AmbienceConfig {
  color: string;
  brightness: number; // 0-100
  strobeInterval: number; // ms, 0 for off
  description?: string;
}

export interface Preset {
  id: string;
  name: string;
  iconPath: string; // SVG path d
  config: AmbienceConfig;
  forcedMode?: LightMode;
}

export interface TorchState {
  isOn: boolean;
  mode: LightMode;
  brightness: number; // 0-100
  strobeSpeed: number; // 0 (off) to 10 (fast)
  color: string;
  hasHardwareTorch: boolean;
  permissionDenied: boolean;
  isThinking: boolean;
}