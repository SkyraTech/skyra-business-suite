import { describe, it, expect } from 'vitest';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';

describe('AppController', () => {
  it('should return health status', () => {
    const service = new AppService();
    const controller = new AppController(service);

    const health = controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health.service).toBe('skyra-business-suite-api');
    expect(health.version).toBe('0.1.0');
    expect(health.modulesEnabled).toContain('core');
  });
});
