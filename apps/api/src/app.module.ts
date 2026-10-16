import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

export interface AppModuleDefinition {
  controllers: unknown[];
  providers: unknown[];
}

export class AppModule {
  static register(): AppModuleDefinition {
    const appService = new AppService();
    const appController = new AppController(appService);

    return {
      controllers: [appController],
      providers: [appService],
    };
  }
}
