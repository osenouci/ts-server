import * as moment from 'moment';
import * as jwt    from 'jsonwebtoken';

import { Config } from './../../config/config';

export class SecurityToken {

    protected token     :string;
    protected tokenData :any;
    protected expiryDate:Date;

    protected _hasExpired:Boolean = false;

    constructor(token:string = "") {

        this.expiryDate = null;
        this.tokenData  = null;        

        if(token) {
            this.token = token;
        }
    }
    load(token:string = ""):Promise<any> {

        if(token) {
            throw "Invalid token";
        }

        this.token = token;
        return this.decode();
    }
    decode():Promise<any> {

        return new Promise((resolve, reject) => {

            if(!this.token) {
                reject("Invalid token");
                return;
            }

            jwt.verify(this.token, Config.tokenConfig.signSecret, (err, decoded) => {

                if(err) {
                    this._hasExpired = true;
                    this.expiryDate  = new Date();
                    this.tokenData   = {};
                }else{
                    this._hasExpired = false;                    
                    this.expiryDate  = new Date(decoded.exp * 1000);
                    this.tokenData   = decoded.data;
                }
                resolve();
            });
        });        
    }
    /**
     * 
     * @param {object} data 
     * @param {string} ttl 
     * 
     * @return {string}
     */
    create(data: any, ttl:string):string {
        return jwt.sign({data: data}, Config.tokenConfig.signSecret, { expiresIn: ttl });
    }
    /**
     * Checks if the expiry date has been by passed or not yet.
     * @return {Boolean}
     */
    hasExpired():Boolean {

        if(this._hasExpired) {
            return true;
        }

        let now = new Date();
        return  now > this.expiryDate;
    }
    /**
     * Checks if we should renew the token or not. This is done by calculating if the expiry date
     * is near.
     * @note: If the token has already expired then this funciton will always return false for that token.
     * 
     * @return Boolean
     */
    shouldRenew():Boolean {

        if(this.hasExpired()) { // Don't renew an expired token.
            return false;
        }

        let today:any = moment(new Date());
        today = today.add(Config.tokenConfig.renewalPeriodDays, 'days');
        today = today.toDate();

        return today > this.expiryDate;
    }    
    get data() {
        return this.tokenData;
    }
    setResponsTokenHeaders(res, accessToken = "", refreshToken = "") {

        if(accessToken) {
            res.setHeader(Config.tokenConfig.accessTokenName , accessToken );
        }

        if(refreshToken) {
            res.setHeader(Config.tokenConfig.refreshTokenName, refreshToken);
        }
    }
    getTokenDataFromHeaders(req): { accessToken: string, refreshToken:string } {

        return {
            accessToken : req.header(Config.tokenConfig.accessTokenName ) || null,
            refreshToken: req.header(Config.tokenConfig.refreshTokenName) || null    
        };
    }
}