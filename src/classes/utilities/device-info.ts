import * as express from "express";

export const CLIENT_DEVICE_KEY           = "clientDevice";
export const DEVICE_NAME_HEADER_KEY      = "device-name";
export const DEVICE_SIGNATURE_HEADER_KEY = "device-signature";
export const DEVICE_LANGUAGE_HEADER_KEY  = "accept-language";

import { Config } from './../../config/config';


export class DeviceInfo {

    public request:express.Request;

    constructor(req:express.Request) {
        this.request = req; 
    }

    public get name():string {
        return this.request.header(DEVICE_NAME_HEADER_KEY) || "";
    } 
    public get signature():string {
        return this.request.header(DEVICE_SIGNATURE_HEADER_KEY) || "";
    }     
    public get language():string {
        return this.request.header(DEVICE_LANGUAGE_HEADER_KEY ) || "";
    }
    public get refreshToken():string {
        return this.request.header(Config.tokenConfig.refreshTokenName) || "";
    }
    public get accessToken():string {
        return this.request.header(Config.tokenConfig.accessTokenName) || "";
    }    

}