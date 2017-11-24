//  Include classes
// ###################################################################
import { AppController  } from './app.controller';
import { Container      } from './../classes/container';
import { StatusCodes    } from './../classes/utilities/statusCodes';
import { ApiResponse    } from './../classes/utilities/api-reponse';

//  Include modules
// ###################################################################
import * as express from "express";

import { Config } from './../config/config';
import { DeviceInfo } from './../classes/utilities/device-info';
import { AuthService, AuthServiceErrorCodes } from './../services/auth.service';

import { Credentials } from './../models/user-credentials.model';

//  Define the controller
// ###################################################################
export class PasswordController extends AppController {

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
        app.post("/password/reset-request"      , this.issuePasswordResetToken.bind(this));  
        app.post("/password/reset-request-valid", this.isPasswordResetTokenValid.bind(this));
        app.post("/password/reset"              , this.updatePassword.bind(this));
    }

    protected async issuePasswordResetToken(req:express.Request, res:express.Response) {
        let response:ApiResponse = new ApiResponse();

        try {

            const email = req.body.email;
            let credentials:Credentials = await this.authService.createPasswordResetTicket(email);

            let resp = await this.container.emailConnector.sendPasswordResetEmail(  // Send the token to the user
                `${credentials.documentId}`, 
                credentials.user.name, 
                credentials.email, 
                credentials.securityCode.code,
                this.getDeviceInformation(req).language
            );

        } catch(err) {

            response.error = this.translateUsingRequest("Oppes someting went wrong", req);

            if(err in AuthServiceErrorCodes) {
                

                if(err == AuthServiceErrorCodes.INVALID_EMAIL) {
                    response.error = this.translateUsingRequest("Invalid email address", req);
                }

                if(err == AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST) {
                    response.error = this.translateUsingRequest("Account does not exists", req);
                } 

                if(err == AuthServiceErrorCodes.INACTIVATED_ACCOUNT) {
                    response.error = this.translateUsingRequest("account not activated", req);
                } 

                if(err == AuthServiceErrorCodes.TOKEN_LIMIT_PER_DAY_REACHED) {
                    response.error = this.translateUsingRequest("3 password resets limit", req);
                }

                if(err == AuthServiceErrorCodes.CANNOT_RESET_FACEBOOK_ACCOUNT_PASSWORD) {
                    response.error = this.translateUsingRequest("account login with Facebook", req);
                }
                
                if(err == AuthServiceErrorCodes.CANNOT_RESET_GOOGLE_ACCOUNT_PASSWORD) {
                    response.error = this.translateUsingRequest("account login with Google", req);
                }                
            }
        }

        res.json(response.json);
    }
    protected async isPasswordResetTokenValid(req:express.Request, res:express.Response) {

        const response:ApiResponse = new ApiResponse();
        
        try {

            const credentialsId:string = req.body.account;
            const securityCode :string = req.body.code;

            let isValid = await this.authService.isSecurityCodeValid(credentialsId, securityCode);
            if(!isValid) {
                throw 0;
            }
        }
        catch(err) {
            response.error = this.translateUsingRequest("submitted code expired", req);
        }

        res.json(response.json);
    }
    protected async updatePassword(req:express.Request, res:express.Response) {

        const response:ApiResponse = new ApiResponse();

        try {

            const credentialsId:string = req.body.account;
            const securityCode :string = req.body.code;
            const password     :string = req.body.password;

            let isValid = await this.authService.isSecurityCodeValid(credentialsId, securityCode);
            if(!isValid) {
                throw -1;
            }

            await this.authService.setNewPassword(credentialsId, password, true); // True -> Clear the security code after the password update!

        } catch(err) {
            response.error = this.translateUsingRequest("submitted code expired", req);
        }

        res.json(response.json);
    }









}