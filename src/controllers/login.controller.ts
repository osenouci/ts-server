//  Include classes
// ###################################################################
import { AppController  } from './app.controller';
import { Container      } from './../classes/container';
import { StatusCodes    } from './../classes/utilities/statusCodes';
import { ApiResponse    } from './../classes/utilities/api-reponse';

import { Config } from './../config/config';
import { DeviceInfo } from './../classes/utilities/device-info';
import { AuthService, AuthServiceErrorCodes, AuthenticationData } from './../services/auth.service';

//  Include modules
// ###################################################################
import * as express from "express";

//  Define the controller
// ###################################################################
export class LoginController extends AppController {

    protected authService:AuthService;

    constructor(container:Container) {
        super(container);
        this.authService = new AuthService();
    }
    /**
     * Configure routes
     * #############################################################
     */
    configureRoutes(app:express.Application) {

        // Login routes
        app.post("/login", this.login.bind(this));
        app.post("/login/facebook", this.facebookLogin.bind(this));    
        app.post("/login/google"  , this.googleLogin.bind(this));        
    }
    /**
     * Logs in user using his Google account account.
     * @param {express.Request } req 
     * @param {express.Response} res 
     */    
    protected async googleLogin(req:express.Request, res:express.Response) {
        
        const response:ApiResponse = new ApiResponse();
        try {
            const deviceInfo:DeviceInfo   = this.getDeviceInformation(req);   // Get the device name and signature
            const googleIdToken:string    = req.body.idToken;                 // Get the facebook access token
            const data:AuthenticationData = await this.authService.loginUsingGoogle(googleIdToken, deviceInfo);

            if(data.error != null) {
                response.data = 404;
                throw this.translateUsingRequest("account does not exist", req);
            }

            this.setTokenHeaders(res, data);

        } catch(err) {
            response.error = err;
        }

        res.json(response.json);
    }    
    /**
     * Logs in user using his facebook account.
     * @param {express.Request } req 
     * @param {express.Response} res 
     */
    protected async facebookLogin(req:express.Request, res:express.Response) {

        const response:ApiResponse = new ApiResponse();
        try {

            const deviceInfo:DeviceInfo   = this.getDeviceInformation(req);   // Get the device name and signature
            const facebookAccessToken     = req.body.accessToken;             // Get the facebook access token
            const data:AuthenticationData = await this.authService.loginUsingFacebook(facebookAccessToken, deviceInfo);
            
            if(data.error != null) {
                response.data = 404;
                throw this.translateUsingRequest("account does not exist", req);
            }

            this.setTokenHeaders(res, data);

        } catch(err) {
            response.error = err;
        }
        res.json(response.json);
    }
    /**
     * Logs in a given user by generating an access and refresh tokens.
     * @param { express.Request } req 
     * @param { express.Response } res 
     * @param { express.NextFunction } next 
     */
    //@ProtectedAccess
    protected async login(req:express.Request, res:express.Response, next:express.NextFunction) {

        let response:ApiResponse = new ApiResponse();

        try {

            const email    = req.body.email;
            const password = req.body.password;
            
            let result = await this.authService.login(email, password, this.getDeviceInformation(req));

            res.setHeader(Config.tokenConfig.accessTokenName , result.accessToken);
            res.setHeader(Config.tokenConfig.refreshTokenName, result.refreshToken);

        } catch(err) {

            response.error = this.translateUsingRequest("Invalid account credentials", req);

            if(err in AuthServiceErrorCodes) {                
            
                if(err == AuthServiceErrorCodes.INACTIVATED_ACCOUNT) {
                    response.error = this.translateUsingRequest("account not activated", req);
                }
                
                if(err == AuthServiceErrorCodes.CANNOT_RESET_FACEBOOK_ACCOUNT_PASSWORD) {
                    response.error = this.translateUsingRequest("account created with Facebook", req);
                }

                if(err == AuthServiceErrorCodes.CANNOT_RESET_GOOGLE_ACCOUNT_PASSWORD) {
                    response.error = this.translateUsingRequest("account created with Google", req);
                }
            }
        }

        res.json(response.json);

    } // end method - login        
        
}