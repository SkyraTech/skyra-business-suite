import { AppService, type HealthStatus } from './app.service.js';

export class AppController {
  constructor(private readonly appService: AppService) {}

  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
