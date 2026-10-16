import { AppModule } from './app.module.js';

declare const process: { env: Record<string, string | undefined> };

export interface BootstrapResult {
  service: string;
  port: number;
  environment: string;
  status: string;
}

export async function bootstrap(): Promise<BootstrapResult> {
  const moduleConfig = AppModule.register();
  const port = Number(process.env['API_PORT'] ?? 4000);
  const environment = process.env['NODE_ENV'] ?? 'development';

  return {
    service: 'skyra-business-suite-api',
    port,
    environment,
    status: moduleConfig.controllers.length > 0 ? 'initialized' : 'failed',
  };
}

if (process.env['NODE_ENV'] !== 'test') {
  void bootstrap();
}
