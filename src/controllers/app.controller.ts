import * as i18n from 'i18n';
import * as express from "express";

import { ApiResponse} from './../classes/utilities/api-reponse';
import { DeviceInfo } from './../classes/utilities/device-info';
import { Container  } from './../classes/container';
import { Config     } from './../config/config';
import {AuthenticationData } from './../services/auth.service';

export class AppController {

    protected container:Container;

    constructor(container:Container) {
        this.container = container;
    }
    public configureRoutes(app) {}

    protected setAccessHeaders(res:express.Response, accessToken:string, refreshToken:string) {
        res.setHeader(Config.tokenConfig.accessTokenName , accessToken  || "");
        res.setHeader(Config.tokenConfig.refreshTokenName, refreshToken || "");   
    }
    /**
     * Sets the access and refresh tokens in headers.
     * @param {express.Response} res 
     * @param {AuthenticationData} data 
     */
    protected setTokenHeaders(res:express.Response, data:AuthenticationData){     
        this.setAccessHeaders(res, data.accessToken, data.refreshToken);
    }    
    protected getDeviceInformation(req:express.Request):DeviceInfo {
        return new DeviceInfo(req);
    }    

    /**
     * Translates a given string into a defined language.
     * @param {string} phrase 
     * @param {string} locale 
     * @return {string}
     */
    protected translate(phrase:string, locale:string):string {
        return i18n.__({phrase, locale});
    }
     /**
     * Given a request, that contains information about the user's device like the user's language, and a string we 
     * translate the string into the user's language.
     * @param {string} phrase 
     * @param {express.Request} req 
     * @return {string}
     */
    public translateUsingRequest(phrase:string, req:express.Request):string {
        let deviceInfo = this.getDeviceInformation(req);
        return this.translate(phrase, deviceInfo.language);
    }


}