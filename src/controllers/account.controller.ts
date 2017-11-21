//  Include classes
// ###################################################################
import { AppController  } from './app.controller';
import { Container      } from './../config/container';
import { StatusCodes    } from './../classes/utilities/statusCodes';
import { ApiResponse    } from './../classes/utilities/api-reponse';

import { Credentials } from './../models/user-credentials.model';
import { DeviceInfo } from './../classes/utilities/device-info';
import { Config } from './../config/config';
import { AuthService, AuthServiceErrorCodes, AuthenticationData } from './../services/auth.service';

//  Include modules
// ###################################################################
import * as express from "express";

//  Define the controller
// ###################################################################
export class AccountController extends AppController {

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

        // Account creation routes
        app.post("/user"          , this.createLocalAccount.bind(this));
        app.post("/user/facebook" , this.createAccountUsingFacebook.bind(this));
        app.post("/user/google"   , this.createAccountUsingGoogle.bind  (this));

       // Local account management
       app.post("/activate", this.activate.bind(this));         

    }

    /**
     * ###############################################################################################################
     * Section: Activation and password reset
     * ###############################################################################################################
     */
    /**
     * Activates the user's account given the userId and the activation token.
     * @param { express.Request } req 
     * @param { express.Response } res 
     * @param { express.NextFunction } next 
     */
    protected async activate(req:express.Request, res:express.Response, next:express.NextFunction) {
        
        let response:ApiResponse = new ApiResponse();

        try{

            const accountData :string = req.body.accountData;
            const securityCode:string = req.body.securityCode;
            await this.authService.activateAccount(accountData, securityCode);

        }catch(err){

            response.error = this.translateUsingRequest("activation code not valid", req);
            if(err in AuthServiceErrorCodes) {

                if(err == AuthServiceErrorCodes.ACCOUNT_ALREADY_ACTIVATED) {
                    response.error = this.translateUsingRequest("account already activated", req);
                }

                if(err == AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST) {
                    response.error = this.translateUsingRequest("account does not exist for activate", req);
                }                
            }
        }
        
        res.json(response.json);
    }
    /**
     * ###############################################################################################################
     * Section: registration
     * ###############################################################################################################
     */
    /**
     * Used to parse errors returned by the create account methods and returns a user friendly phrase that we pass to the users.
     * @param {AuthServiceErrorCodes|any} err
     * @returns {string}
     */    
    protected getAccountCreationErrorMessage(err) {
        
        let errorMessage:string = "error while creating account";

        let isValidErrorCode = err in AuthServiceErrorCodes;
        if(!isValidErrorCode) { return errorMessage; }

        if(err == AuthServiceErrorCodes.LOCAL_ACCOUNT_INVALID_PARAMS) {
            return "fill in your details";
        }

        if(err == AuthServiceErrorCodes.INVALID_EMAIL) {
            return "Invalid email address";
        }
        
        if(err == AuthServiceErrorCodes.INVALID_PASSWORD) {
            return "respect min password";
        }

        if(err == AuthServiceErrorCodes.ACCOUNT_ALREADY_EXISTS) {
            return "email address registered";
        }

        return errorMessage;
    }

    sendTokens(res:express.Response, data:AuthenticationData){
        res.setHeader(Config.tokenConfig.accessTokenName , data.accessToken);
        res.setHeader(Config.tokenConfig.refreshTokenName, data.refreshToken);        
    }
    /**
     * Create an account using facebook social media login.
     * @param {express.Request } req
     * @param {express.Response} res
     */      
    protected async createAccountUsingFacebook(req:express.Request, res:express.Response) {

        const response:ApiResponse = new ApiResponse();
        
        try {
            const deviceInfo:DeviceInfo = this.getDeviceInformation(req);   // Get the device name and signature
            const facebookAccessToken   = req.body.accessToken;             // Get the facebook access token
            const result:AuthenticationData = await this.authService.CreateAccountUsingFacebook(facebookAccessToken, deviceInfo);

            this.sendTokens(res, result);

        } catch(err) {
            let errorMessage = this.getAccountCreationErrorMessage(err);
            response.error   = this.translateUsingRequest(errorMessage, req);
        }

        res.json(response.json);
    }
    /**
     * Create an account using google social media login.
     * @param {express.Request } req
     * @param {express.Response} res
     */
    protected async createAccountUsingGoogle(req:express.Request, res:express.Response) {
     
        const response:ApiResponse = new ApiResponse();  

        try {
            const googleIdToken:string  = req.body.idToken;                 // Get the facebook access token
            const deviceInfo:DeviceInfo = this.getDeviceInformation(req);   // Get the device name and signature      
            const result:AuthenticationData = await this.authService.CreateAccountUsingGoogle(googleIdToken, deviceInfo);

            this.sendTokens(res, result);

        } catch(err) {
            let errorMessage = this.getAccountCreationErrorMessage(err);
            response.error   = this.translateUsingRequest(errorMessage, req);
        } 

        res.json(response.json);
    }
    /**
     * Creates a local account that email address and password to login the user.
     * @param {express.Request } req
     * @param {express.Response} res
     */
    protected async createLocalAccount(req:express.Request, res:express.Response) {
    
        const response:ApiResponse = new ApiResponse();
        
        try {

            const credentials:Credentials = await this.authService.createLocalAccount(req.body);  // Try to create the account      
          
            let resp = await this.container.emailConnector.sendActivationEmail(                 // Send the activation email
                `${credentials.user.documentId}.${credentials.id}`, 
                credentials.user.name, 
                credentials.email, 
                credentials.securityCode.code,
                this.getDeviceInformation(req).language
            );

        } catch(err) {
            let errorMessage = this.getAccountCreationErrorMessage(err);
            response.error   = this.translateUsingRequest(errorMessage, req);
        }

        res.json(response.json);        
    }




}