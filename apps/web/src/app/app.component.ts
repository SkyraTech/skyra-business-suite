import { appConfig } from './app.config.js';

/**
 * Root Application Component shell.
 * Formatted as a TypeScript class conforming to Angular Standalone Component baseline.
 */
export class AppComponent {
  readonly title = appConfig.appName;
  readonly version = appConfig.version;
  readonly isZoneless = appConfig.zoneless;

  getAppInfo(): string {
    return `${this.title} v${this.version} (Zoneless: ${this.isZoneless})`;
  }
}
