/**
 * Application configuration contract for Angular Standalone (Zoneless).
 * In Phase 1 bootstrap, provideExperimentalZonelessChangeDetection() will be registered here.
 */
export interface ApplicationConfig {
  zoneless: boolean;
  appName: string;
  version: string;
}

export const appConfig: ApplicationConfig = {
  zoneless: true,
  appName: 'Skyra Business Suite',
  version: '0.1.0',
};
