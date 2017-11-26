import * as express from "express";
import { Config } from './../config/config';

// Load classes
import { StatusCodes   } from './../classes/utilities/statusCodes';
import { ApiResponse   } from './../classes/utilities/api-reponse';

import { SecurityToken } from './../classes/security/security-token';
import { TokenManager  } from './../classes/security/token-manager';
import { DeviceInfo    } from './../classes/utilities/device-info';

// Load the models
import { UserModel, User               } from './../models/user-model';
import { Credentials, CredentialsModel } from './../models/user-credentials.model';
import { Device, DeviceModel           } from './../models/device-model';
import { DeviceManager                 } from './device-manager';
import { CredentialsManager            } from './user-manager.credentials';
import { UserProfileManager            } from './user-manager.profile';


// Define constants
const REFRESH_TOKEN_KEY = Config.tokenConfig.refreshTokenName;
const ACCESS_TOKEN_KEY  = Config.tokenConfig.accessTokenName ;

export enum JWTErrorCodes {
    NO_TOKEN_PROVIDED,
    GENERAL_ERROR,
    INVALID_TOKEN,
    REFRESH_TOKEN_EXPIRED,
    NO_DEVICE_REGISTERED_WITH_TOKEN
}

export class JSONWebTokenService {

    protected deviceManager     :DeviceManager      = new DeviceManager();
    protected tokenManager      :TokenManager       = new TokenManager ();
    protected credentialsManager:CredentialsManager = new CredentialsManager();
    protected userProfileManager:UserProfileManager = new UserProfileManager();
    constructor() {

    }

    /**
     * Verifies the access and refresh tokens and if of them needs renewal then it will renew them.
     * It always returns the two tokens, If no refresh token has been passed then it will return null as
     * it is returned value.
     * @param req 
     * @return {Promise<{refreshToken:string, accessToken:string}>}
     */
    public verifyUserAccess(req:express.Request):Promise<{refreshToken:string, accessToken:string}> {

        console.log("Inside JWTManager::verifyUserAccess()");

        let deviceInfo:DeviceInfo = new DeviceInfo(req);

        let accessToken :string = deviceInfo.accessToken;
        let refreshToken:string = deviceInfo.refreshToken;
        console.log(`accessToken: ${accessToken}`);
        console.log(`refreshToken: ${refreshToken}`);
        return new Promise(async(resolve:Function, reject:Function) => {

            try {
                console.log(`performing basic check: ${refreshToken}`);                             
                this.basicTokenCheck(accessToken, refreshToken);                                    // Performs a basic token verification. 
                
                console.log("trying to renew the refresh token");
                refreshToken = await this.renewRefreshToken(refreshToken, deviceInfo);              // Try to renew the refresh token
                accessToken  = await this.renewAccessToken(accessToken, refreshToken, deviceInfo);  // Try to renew the access token
            
                let decodedAccessToken:SecurityToken = await this.checkAccessToken(accessToken);    // Is the access token still valid?

                req["accessToken"] = decodedAccessToken;
                console.log("=====================================================");
                resolve({refreshToken, accessToken});

            } catch(err) {    

                console.log("Error:", err);
                err = err in JWTErrorCodes ? err : JWTErrorCodes.GENERAL_ERROR;
                reject(err);
                console.log("=====================================================");
            }

        });
    }

    /**
     * Renews the access token if it has expired. It requires the client to pass the access and refresh token for it to work.
     * @throws {JWTErrorCodes.NO_DEVICE_REGISTERED_WITH_TOKEN | JWTErrorCodes.REFRESH_TOKEN_EXPIRED}
     * 
     * @param {string} strAccessToken 
     * @param {string} strRefreshToken 
     * @param {DeviceInfo} deviceInfo 
     * 
     * @return {Promise<string>}
     */
    protected renewAccessToken(strAccessToken:string, strRefreshToken:string, deviceInfo:DeviceInfo):Promise<string> {
        console.log('--------------------- renewAccessToken ---------------------');
        return new Promise(async(resolve:Function, reject:Function) => {

            try {

                if(!strAccessToken || !strRefreshToken) {   // Only try to renew if the tokens were passed.
                    console.log("Refresh and access tokens are required. Skipping renewal");
                    resolve(strAccessToken);
                    return;
                }

                // Performs a basic token verification.
                 this.basicTokenCheck(strAccessToken, strRefreshToken);                          
                 let accessToken:SecurityToken = new SecurityToken(strAccessToken);
                 await accessToken.decode();

                 // If the access token has not expired yet then do nothing
                 /*
                 if(!accessToken.hasExpired()) {      
                    console.log("Access token has NOT expired. skipping renewal");      
                    resolve(strAccessToken);
                    return;
                 }*/

                 let refreshToken:SecurityToken = new SecurityToken(strRefreshToken);
                 await refreshToken.decode();

                 if(refreshToken.hasExpired()) { 
                    console.log("Refresh token expired. Throwing an error");   
                     throw JWTErrorCodes.REFRESH_TOKEN_EXPIRED; 
                 }

                 // Check the user's deviced is registered!
                 console.log("Checking if the device exists in the database");
                let device:Device = new Device(await this.deviceManager.findDeviceById(refreshToken.data.deviceId));
                if(!device) {  
                    console.log("Device not found"); 
                    throw JWTErrorCodes.NO_DEVICE_REGISTERED_WITH_TOKEN; 
                }

                console.log("Device found");
                console.log("Renewing access token");
                
                 // Renew the access token
                 let credentials:Credentials = await this.credentialsManager.findById(device.credentialsId);                    // find the credentials document
                 let user:User               = new User(await this.userProfileManager.findById(device.instanceDocument.user));  // find the user document
                 let newToken:string         = await this.tokenManager.renewAccessToken(refreshToken, user, credentials);       // Generate the new token.                 
                 await this.deviceManager.updateDeviceTokens(device, null, newToken);
                 resolve(newToken);

            } catch(err) {
                console.log("An error took place while trying to renew the access token: ", err);
                reject(err);
            }

        });
    }    
    /**
     * Renews the refresh token that the client has passed to the server before it expires.
     * @throws {JWTErrorCodes.NO_DEVICE_REGISTERED_WITH_TOKEN || JWTErrorCodes.REFRESH_TOKEN_EXPIRED}
     * 
     * @param {string} token 
     * @param {DeviceInfo} deviceInfo 
     */
    protected renewRefreshToken(token:string, deviceInfo:DeviceInfo):Promise<string> {
        console.log('--------------------- renewRefreshToken ---------------------');
        return new Promise(async(resolve:Function, reject:Function) => {

            try {

                if(!token) {        // Only try to renew the token if the user has passed it.
                    resolve(null);
                    console.log("Refresh token not defined. Skipping renewal");
                    return;
                }

                // Make sure that the user's token has not expired yet.
                let refreshToken:SecurityToken = new SecurityToken(token);
                await refreshToken.decode();

                if(refreshToken.hasExpired()) { 
                    console.log("Refresh token has expired. Throwing an error");
                    throw JWTErrorCodes.REFRESH_TOKEN_EXPIRED; 
                }

                // Check the user's deviced is registered!
                let device = await this.deviceManager.findDeviceById(refreshToken.data.deviceId);
                console.log("Checking if the device exists in the database");
                if(!device) { console.log("Device not found"); throw JWTErrorCodes.NO_DEVICE_REGISTERED_WITH_TOKEN; }
                console.log("Device found");
                // If the expiration date is not near then do nothing
                if(!refreshToken.shouldRenew()) {                               
                    console.log("Refrsh token is still valid. Skipping renewal");
                    resolve(token);
                    return;
                }            
                console.log("Renewing refrsh token");
                // Renew the refresh token
                let newToken:string = await this.tokenManager.renewRefreshToken(refreshToken, deviceInfo);  // Generate the new token.
                await this.deviceManager.updateDeviceTokens(new Device(device), null, newToken);
                resolve(newToken);

            } catch(err) {

                console.log("An error took place while trying to renew the refresh token: ", err);
                reject(err);
            }

        });
    }

    /**
     * If the client did not pass any tokens to the server then throw an error
     * @param {string} accessToken 
     * @param {string} refreshToken 
     * @throws {JWTErrorCodes.INVALID_TOKEN}
     */
    protected basicTokenCheck(accessToken:string, refreshToken:string) {

        if(!accessToken && !refreshToken) {                                     // Checks if the two tokens are defined
            console.log(`No token has been provided. Throwing Invalid token error`);
            throw JWTErrorCodes.INVALID_TOKEN;
        }
    }    

    /**
     * Checks if the access token is valid or not. If the token is not valid then it throw an error.
     * @param {string} accessToken 
     * @throws {JWTErrorCodes.NO_TOKEN_PROVIDED}
     */
    protected  checkAccessToken(accessToken:string):Promise<SecurityToken> {

        return new Promise(async(resolve, reject) => {

            try {

                console.log('--------------------- checkAccessToken ---------------------');
                console.log('Checking if the access token has expired', accessToken);
                
                let securityToken:SecurityToken = new SecurityToken(accessToken);
                console.log("Decoding token", securityToken);
                await securityToken.decode();
                console.log("Access token decoding done");
                 console.log(" >> userId:", securityToken.data);
                if(securityToken.hasExpired()) {                                        // Make sure that the refresh token has not expired yet.
                    console.log("Token has expired. Request rejected");
                    throw JWTErrorCodes.NO_TOKEN_PROVIDED;
                }
        
                console.log("Access token is valid. Request accepted!");   
                resolve(securityToken);      
                
            } catch(err) {
                reject(err);
            }

        });

    }

}