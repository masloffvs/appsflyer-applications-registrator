import { Router } from 'express';
import AppsflyerAppController from '@controllers/appsflyer_app.controller';
import { Routes } from '@interfaces/routes.interface';
import { threadId } from 'worker_threads';
import { request } from 'http';

class AppsflyerAppRoute implements Routes {
  public path = '/api/appsflyer/app';
  public router = Router();
  public appsflyerAppController = new AppsflyerAppController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.appsflyerAppController.index);
    this.router.get(`${this.path}/registerAppInAppsflyer`, this.appsflyerAppController.checkAndRegisterApplicationInAppsFlyer)
    this.router.get(`${this.path}/checkAppInAppsflyer`, this.appsflyerAppController.checkAvailablePackageName)
  }
}

export default AppsflyerAppRoute;
