export interface HealthStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  modulesEnabled: string[];
}

export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'skyra-business-suite-api',
      version: '0.1.0',
      modulesEnabled: ['core', 'identity', 'entitlements'],
    };
  }
}
