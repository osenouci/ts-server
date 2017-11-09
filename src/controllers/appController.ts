import * as i18n from 'i18n';
import * as express from "express";

import { ApiResponse} from './../classes/utilities/api-reponse';
import { DeviceInfo } from './../classes/utilities/device-info';
import { Container  } from './../config/container';


export class AppController {

    protected container:Container;

    constructor(container:Container) {
        this.container = container;
    }
    configureRoutes(app) {}

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