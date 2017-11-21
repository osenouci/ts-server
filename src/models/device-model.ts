import * as mongoose from "mongoose";
import * as crypto   from "crypto";
import { Config } from './../config/config';
import { SecurityToken } from './../classes/security/security-token';

(mongoose as any).Promise = Promise;
const schema = mongoose.Schema;

const DeviceSchema:mongoose.Schema = new schema({

    credentials : { type: mongoose.Schema.Types.ObjectId, ref: 'UserCredentialsModel', required:true },    
    name        : { type: String                , required: true        },
    signature   : { type: String                , required: true        },
    user        : { type: schema.Types.ObjectId , ref     : 'UserModel' },
    created     : { type: schema.Types.Date     , default : Date.now    },
    updated     : { type: schema.Types.Date     , default : Date.now    },
    refreshToken: { type: String                , required: true        },
    accessToken : { type: String                , required: true        }
});

DeviceSchema.pre('save', function (next) {  
    this.updated = new Date();
    next();
});

/**
 * Creates a new user.
 * @param {string} deviceName
 * @param {string} deviceSignature
 * @param {string} userId
 * 
 * @return {Promise}
 *  
 * Promise details
 * - resolve(DeviceModel:Mongoose object)
 * - reject (error)
 */
DeviceSchema.statics.create = function(deviceName: string, deviceSignature: string, userId: string, credentialsId:string, accessToken: string) {

    return new Promise(async (resolve, reject) => {

        let newDocument = new this();

        newDocument.credentials  = credentialsId;
        newDocument.name         = deviceName      || "undefined";
        newDocument.signature    = deviceSignature || "undefined";
        newDocument.accessToken  = accessToken     || "undefined";
        newDocument.refreshToken = "undefined";
        newDocument.user         = userId;                

        newDocument.save((err) => {
            err?reject(err):resolve(newDocument);
        });
    });
}

/**
 * Generates a new access token and assigns in to the document field `refreshToken`.
 * It returns a promise that resolved to the `refreshToken`.
 * @return {Promise<string>}
 */
DeviceSchema.methods.generateNewRefreshToken = function():Promise<string> {

    return new Promise((resolve, reject) => {
        crypto.randomBytes(Config.tokenConfig.refreshTokenLength, async (err: Error, buf: Buffer) => {

            if(err) {
                reject(err);
                return; 
            }
            
            let securityToken   = new SecurityToken();

            let deviceName      = this.name;
            let deviceSignature = this.signature;            
            let userId          = this.user;

            let token = securityToken.create({
                    userId: userId,
                    random: buf.toString('hex').toUpperCase(),
                    name  : deviceName,
                    deviceSignature: deviceSignature
                }, 
                Config.tokenConfig.refreshTokenTTL
            );
            this.refreshToken = token;
            resolve(token);
        });
    });
}

/**
 * Saves a document into the database.
 * @return {Promise<Document>}
 */
DeviceSchema.methods.savePromise = function (): Promise < any > {
    return new Promise((resolve, reject) => {
        this.save((error) => {
            error ? reject(error) : resolve(this);
        });
    });
};

export const DeviceModel = mongoose.model('DeviceModel', DeviceSchema);

export class Device {

    protected instance:any;     // Mongo db instance
    
    public constructor(instance:any) {
        this.instance = instance;
    }

    /***
     * gets the name property from the mongodb document loaded.
     * @returns {string}
     */    
    public get name():string {
        return this.instance.name;
    }
    /***
     * Sets the value of the device name. It does not commit the changes, the update method need to be called to update the changes.
     * @param {string} value
     */    
    public set name(value:string) {
        this.instance.name = value;
    }  
    /***
     * gets the device signature from the mongodb document loaded.
     * @returns {string}
     */      
    public get signature():string {
        return this.instance.signature;
    }
    /***
     * Sets the value of the device signature. It does not commit the changes, the update method need to be called to update the changes.
     * @param {string} value
     */    
    public set signature(value:string) {
        this.instance.signature = value;
    }    
    /***
     * gets the refresh token from the mongodb document loaded.
     * @returns {string}
     */    
    public get refreshToken():string {
        return this.instance.refreshToken;
    }
    /***
     * Sets the value of the refresh token. It does not commit the changes, the update method need to be called to update the changes.
     * @param {string} value
     */    
    public set refreshToken(value:string) {
        this.instance.refreshToken = value;
    }    
    /***
     * gets the access token from the mongodb document loaded.
     * @returns {string}
     */
    public get accessToken():string {
        return this.instance.accessToken;
    }
    /**
     * Sets the value of the access token. It does not commit the changes, the update method need to be called to update the changes.
     * @param {string} value
     */
    public set accessToken(value:string) {
        this.instance.accessToken = value;
    }
    /**
     * Returns the instance of the mongo db document. To be used with care!
     * @returns {any}
     */        
    public get instanceDocument() {
        return this.instance;
    }
    /**
     * Returns the mongodb document id.
     * @returns {any}
     */   
    public get documentId() {
        return this.instance._id;
    }

    /**
     * Commits the changes to the database.
     * @returns {Promise<any>}
     */
    public update():Promise<any> {
        return this.instance.savePromise();
    }

    /***
     * gets the credentials ID. The credentials that were to login the user.
     * @returns {string}
     */    
    public get credentialsId():string {
        return this.instance.credentials;
    }    

} // End class Device