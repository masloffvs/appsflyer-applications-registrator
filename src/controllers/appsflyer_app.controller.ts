import { NextFunction, Request, Response } from 'express';
import axios, {AxiosRequestConfig} from "axios";
import _ from "lodash";
import { AnyArray } from 'mongoose';
import { HttpException } from '@/exceptions/HttpException';
var cookie = require('cookie');

class AppsflyerAppController {
  public index = (req: Request, res: Response, next: NextFunction) => {
    try {
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  };

  private validatePackageName(packageName: String | null | string) {
    return true
  }

  /**
   * Get application JSON by package name 
   * @param packageName 
   * @returns 
   */
  private getApplicationJson(packageName: string) {
    return {
      "appStatus": "pending",
      "appKind": "android",
      "appType": "mobile",
      "appId": packageName,
      "appName": "",
      "appStoreCountry": "US",
      "currency": null,
      "timezone": "UTC",
      "timezoneLabel": "UTC",
      "statusId": "Pending",
      "appIdDB": `app|${packageName}`,
      "canUpdateCurrency": true,
      "canUpdateTimezone": true
    }
  }

  /**
   * 
   * @returns 
   */
  private loginToAppsflyerAccount(): Promise<Map<String, String>> {
    return new Promise((resolve, reject) => {
      this.loginInAccount(
        "masloff@zoho.com",
        "bonMasloff16*"
      )
      .then(response => {      
        const cookieHeaders = response.headers['set-cookie'];
        const cookieMap = _.map(cookieHeaders, i => cookie.parse(i))
        
        const af_jwt = _.find(cookieMap, "af_jwt").af_jwt
        const auth_tkt = _.find(cookieMap, "auth_tkt").auth_tkt

        let mapResponse = new Map<string, String>();

        mapResponse.set("auth_tkt", auth_tkt);
        mapResponse.set("af_jwt", af_jwt);
        
        resolve(mapResponse)
      })
      .catch(reject)
    })
  }

  /**
   * Register application in appsflyer 
   * @param af_jwt 
   * @param auth_tkt 
   * @param packageName 
   */
  private registerApplicationInAppsFlyer(af_jwt: String, auth_tkt: String, packageName: string) {
    var data = JSON.stringify(this.getApplicationJson(packageName));

    var config: AxiosRequestConfig = {
      method: 'post',
      url: 'https://hq1.appsflyer.com/app/registration/save',
      headers: { 
        'authority': 'hq1.appsflyer.com', 
        'accept': 'application/json', 
        'Cookie': `auth_tkt="${auth_tkt}"; af_jwt=${af_jwt}`,
        'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 
        'content-type': 'application/json', 
      },
      data : data
    };

    return axios(config)
  }

  /**
   * Chack applicattion for can registration in appsflyer
   * @param af_jwt 
   * @param auth_tkt 
   * @param packageName 
   * @returns 
   */
  private checkApplication(af_jwt: String, auth_tkt: String, packageName: string) {
    var data = JSON.stringify(this.getApplicationJson(packageName));

    var config: AxiosRequestConfig = {
      method: 'post',
      url: 'https://hq1.appsflyer.com/app/registration/appdata',
      headers: { 
        'authority': 'hq1.appsflyer.com', 
        'accept': 'application/json', 
        'Cookie': `auth_tkt="${auth_tkt}"; af_jwt=${af_jwt}`,
        'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 
        'content-type': 'application/json', 
      },
      data : data
    };

    return axios(config)
  }

  /**
   * Login into account
   * @param login 
   * @param password 
   * @returns 
   */
  private loginInAccount(login: String, password: String) {
    const data = JSON.stringify(
      {
        "username": login,
        "password":  password, 
        "googletoken": "",
        "googleaccesstoken": "",
        "keep-user-logged-in": false,
        "2fa": ""
      }
    )
 
    var config: AxiosRequestConfig = {
      method: 'post',
      url: 'https://hq1.appsflyer.com/auth/login?next=L2F1dGgvbG9nb3V0JmVuY29kZWQ9MQ==',
      headers: { 
        'authority': 'hq1.appsflyer.com', 
        'accept': '*/*', 
        'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 
        'content-type': 'text/plain;charset=UTF-8', 
        'origin': 'https://hq1.appsflyer.com', 
        'referer': 'https://hq1.appsflyer.com/auth/login', 
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="102", "Google Chrome";v="102"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"', 
        'sec-fetch-dest': 'empty', 
        'sec-fetch-mode': 'cors', 
        'sec-fetch-site': 'same-origin', 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36'
      },
      data : data
    };

    return axios(config)
  }

  /**
   * 
   * @param req 
   * @param res 
   * @param next 
   */
  public checkAvailablePackageName = async (req: Request, res: Response, next: NextFunction) => {
    if (this.validatePackageName(req.query["packageName"].toString())) {
      const packageName = req.query["packageName"].toString()
      
      try {
        const credentials = await this.loginToAppsflyerAccount()
        const appInfo = await this.checkApplication(credentials.get("af_jwt"), credentials.get("auth_tkt"), packageName)

        if (appInfo.data.ok) {
          res.send({
            success: true,
            packageName,
            appInfo: appInfo.data
          })
        
        } else {
          res.send({
            success: false,
            packageName,
            appInfo: appInfo.data
          })
        
        }

      } catch (error) {

        res.send({
          success: false,
          packageName
        })
      }
    }
  }
  
  /**
   * Register app in appsflyer
   * @param req 
   * @param res 
   * @param next 
   */
  public checkAndRegisterApplicationInAppsFlyer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (this.validatePackageName(req.query["packageName"].toString())) {
        const packageName = req.query["packageName"].toString()

        try {
          const credentials = await this.loginToAppsflyerAccount()
          const appInfo = await this.checkApplication(credentials.get("af_jwt"), credentials.get("auth_tkt"), packageName)
       
          if (appInfo.data.ok) {
            const appRegistredInfo = await this.registerApplicationInAppsFlyer(credentials.get("af_jwt"), credentials.get("auth_tkt"), packageName)

            if (appRegistredInfo.data.ok) {
              res.send({ succeess: true })
            } else {
              res.send({ succeess: false, errorType: "appExists" })
            }

          } else {
            res.send({ succeess: false, errorType: "appExists" })
          
          }
        } catch (e) {
          res.send({ succeess: false, errorType: "serverError" })
          next(e);
        }

      }

    } catch (error) {
      next(error);
    }
  };

}

export default AppsflyerAppController;
