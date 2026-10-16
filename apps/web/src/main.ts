import { AppComponent } from './app/app.component.js';
import { appConfig } from './app/app.config.js';

/**
 * Bootstrap entry point for Skyra Business Suite Web Client.
 * Demonstrates zoneless initialization contract without Zone.js.
 */
export function bootstrapApplication(): AppComponent {
  if (!appConfig.zoneless) {
    throw new Error('Skyra Business Suite must run in zoneless mode without Zone.js.');
  }

  const app = new AppComponent();
  return app;
}

// Execute bootstrap in browser context
if (typeof window !== 'undefined') {
  bootstrapApplication();
}
