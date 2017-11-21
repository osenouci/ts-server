export const SIGNING_SECRET   :string = '2532DF5725C36F09A8A5DE92AFA1B9F4B3BD34407E310134B07B9CB6E0';
export const ACCESS_TOKEN_TTL :string = '1d' ; // 16m
export const REFRESH_TOKEN_TTL:string = '30d'; // 60m

export const REFRESH_TOKEN_LENGTH:number = 64;
export const RENEWAL_PERIOD_DAYS :number = 5;  // Renew the access token X days in advance   

const DEFAULT_PORT = 80;

export const DEFAULT_LANGUAGE:string = "en";
export const DEFAULT_MONGO_CONNECTION_STRING:string = `mongodb://mongo:27017/so_db`;
/**
 * @class ConfigBase
 * @desc
 * The base class that all the other configuration classes extend.
 * It has one protected method called `getValue`.
 * 
 * @method getValue(key:string, defaultValue:any):any
 * Checks if env variable named after the `key parameter` exists, if it does then it returns its value.
 * If the env var does NOT exists then the default value is returned. 
 */
class ConfigBase {

    protected getValue(key: string, defaultValue: any): any {
        return process.env[key] ? process.env[key] : defaultValue;
    }
}
export class ApiConfig extends ConfigBase {
    
    protected _defaultLanguage:string;      // The default API language
    protected _serverPort     : number;     // The server PORT
    constructor() {

        super();
        this._defaultLanguage = this.getValue("DEFAULT_LANGUAGE", DEFAULT_LANGUAGE);  
        this._serverPort      = this.getValue("SERVER_PORT", DEFAULT_PORT);
    }        

    /***
     * Gets the key that we use to sign the access and refresh tokens.
     * @returns {string}
     */
    public get defaultLanguage():string {
        return this._defaultLanguage;
    }
    public get serverPort():number {
        return this._serverPort;
    }
}
/**
 * Used to define the token settings
 */
export class TokenConfig extends ConfigBase {

    protected _signSecret        :string; // Used to sign the access and refresh tokens
    protected _accessTokenTTLL   :string;
    protected _refreshTokenTTL   :string;
    protected _refreshTokenLength:number;
    protected _renewalPeriodDays :number;

    protected _refreshTokenName:string = "refresh-token";
    protected _accessTokenName :string = "access-token";  
    protected refreshTokenExpiredFlashName:string = "refresh-token-expired";    

    constructor() {
        super();
        this._signSecret            = this.getValue("SIGNING_SECRET"        , SIGNING_SECRET      );  
        this._accessTokenTTLL       = this.getValue("ACCESS_TOKEN_TTL"      , ACCESS_TOKEN_TTL    );  
        this._refreshTokenTTL       = this.getValue("REFRESH_TOKEN_TTL"     , REFRESH_TOKEN_TTL   );  
        this._refreshTokenLength    = this.getValue("REFRESH_TOKEN_LENGTH"  , REFRESH_TOKEN_LENGTH);  
        this._renewalPeriodDays     = this.getValue("RENEWAL_PERIOD_DAYS"   , RENEWAL_PERIOD_DAYS );        
    }
    public get refreshTokenName():string {
        return this._refreshTokenName;
    }
    public get refreshTokenExpired():string {
        return this.refreshTokenExpiredFlashName;
    }    
    public get accessTokenName():string {
        return this._accessTokenName;
    }    
    /***
     * Gets the key that we use to sign the access and refresh tokens.
     * @returns {string}
     */
    public get signSecret():string {
        return this._signSecret;
    }
    /**
     * Gets the time to live of the access token.
     * @returns {string}
     */
    public get accessTokenTTLL():string {
        return this._accessTokenTTLL;
    }
    /**
     * Gets the refresh token's `time to live`.
     * @returns {string}
     */    
    public get refreshTokenTTL():string {
        return this._refreshTokenTTL;
    }
    /**
     * Gets the length of the refresh token.
     * @returns {number}
     */
    public get refreshTokenLength():number {
        return this._refreshTokenLength;
    }            
    /**
     * Gets a number that represents the numbers of days that we should try to renew the referesh token before expiry.
     * For example 5 days before the expiration day, we should renew it.
     * @returns {number}
     */
    public get renewalPeriodDays():number {
        return this._renewalPeriodDays;
    }
}
export class DataBaseConfig extends ConfigBase {
        
    protected _mongoConnectionString:string;

    constructor() {
        super();
        this._mongoConnectionString = this.getValue("MONGO_CONNECTION_STRING", DEFAULT_MONGO_CONNECTION_STRING);    
    }

    public get mongoConnectionString():string {
        return this._mongoConnectionString;
    }       
}    
export class NotificationServiceConfig extends ConfigBase {
    
    public host:string = "http://localhost:1080";

    constructor() {
        super();
        this.host = this.getValue("NOTIFICATION_SERVER_PORT", this.host);
    } 
}

export class Configuration extends ConfigBase {

    public notificationServiceConfig:NotificationServiceConfig;
    public dataBaseConfig:DataBaseConfig;
    public tokenConfig:TokenConfig;
    public apiConfig  :ApiConfig;

    public readonly PASSWORD_LENGTH      = 8;
    public readonly PASSWORD_RESET_LIMIT = 3;

    constructor() {
        super();

        this.dataBaseConfig = new DataBaseConfig();
        this.tokenConfig    = new TokenConfig();
        this.apiConfig      = new ApiConfig();
    }
}


export const Config: Configuration = new Configuration();