//  Include classes
// ###################################################################
import { AppController  } from './app.controller';
import { Container      } from './../classes/container';
import { StatusCodes    } from './../classes/utilities/statusCodes';
import { ApiResponse    } from './../classes/utilities/api-reponse';

import { SecurityToken } from './../classes/security/security-token';

import { Config } from './../config/config';
import { JSONWebTokenService, JWTErrorCodes } from './../services/jsonWebToken.service';

//  Include modules
// ###################################################################
import * as express from "express";

//  Define the controller
// ###################################################################
export class TokenController extends AppController {

    protected jwtService:JSONWebTokenService;

    constructor(container:Container) {
        super(container);
        this.jwtService = new JSONWebTokenService();
    }

    /**
     * Configure routes
     * #############################################################
     */
    configureRoutes(app:express.Application) {
        
        // Check the token
        app.get ("/token/check", this.checkAccess.bind(this));           
    }

    /**
     * Route functions
     * #############################################################
     */  
    protected async checkAccess(req:express.Request, res:express.Response) {

        let response = new ApiResponse();

        try {

            console.log("verifying access");
            
            // Check the access rights
            let result:any = this.jwtService.verifyUserAccess(req);

            let refreshToken:SecurityToken = new SecurityToken(result.accessToken);
            await refreshToken.decode();
            console.log(refreshToken);

            // Pass the access and refresh tokens to the back end API.
            this.setAccessHeaders(res, result.accessToken, result.refreshToken);
            console.log("Access granted");            

        } catch(err) {

            console.log("Error: ", err);            

            response.error = this.translateUsingRequest("Your session has expired. Please login again!", req);

            if(err == JWTErrorCodes.NO_DEVICE_REGISTERED_WITH_TOKEN || err == JWTErrorCodes.REFRESH_TOKEN_EXPIRED) {
                res.setHeader(Config.tokenConfig.refreshTokenExpired, "true");
            }

            res.json(response.json);
        }

    }

}