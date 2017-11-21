// Import and configure mongoose
import * as mongoose from "mongoose";
import * as moment from 'moment';

(mongoose as any).Promise = Promise;
const schema = mongoose.Schema;

// Import social media profiles
import { SocialProfile   } from './../classes/socialmedia/social.profile';
import { PasswordHash    } from "./../classes/crypto/password-hash";     // Import security functions
import * as EmailValidator from "email-validator";                      // Import data validators
import { User } from './user-model';


import { Config } from './../config/config';
import { AuthServiceErrorCodes } from './../services/auth.service';

const securityTokenTTL = 7; // in days

/**
 * Define the schema
 * ##############################################################################################################
 */
const UserCredentialsSchema:mongoose.Schema = new schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' },

    email: { 
        type: String, 
        lowercase: true, 
        trim: true, 
      //  index: { unique: true } 
    },  
    password         : String,
    isGoogleAccount  : { type: Boolean, default: false },
    isFaceBookAccount: { type: Boolean, default: false },
    isLocalAccount   : { type: Boolean, default: false },

    activated        : { type: Boolean, default: false },    
    securityCode     : {                            // Security code used to hold codes like activation and password reset codes.
        code   : { type: String},                   // A random code
        expiry : { type: Date },                    // Expiry date
        created: { type: Date },                    // The date when the code has been generated
        counter: { type: Number, default: 0 }       // Used for counting requests. For example the number of the user ask for `password reset code` per day.
    },

    created          : { type: Date, default: Date.now },     // The account creation date.
    updated          : { type: Date                    }      // The last time the account was updated!    
});

/**
 * Call back function that is called before the document has been saved. 
 * It updated the updated field and hashes the passowrd if one has been provided.
 */
UserCredentialsSchema.pre('save', async function (next) {
    
    try {

        this.updated = new Date();  // Update the last seen field

        const isNewRecord       = this.isNew;
        const isUpdatedPassword = this.isModified('password');

        // Hash the password
        if (isUpdatedPassword || isNewRecord) {                            // If the password has been modified or if the document is new 

            if(this.password && this.password.length > 0) {                         // Do only is the password is at least one character long
                const security:PasswordHash = new PasswordHash();                    
                this.password = await security.hashUserPassword(this.password);     // Hash the password
            }
        }

        if(isNewRecord && this.password) {
            await this.generateSecurityToken();
        }

        next();

    } catch(err) {
        console.log(err);
        next(err);
    }

});
/**
 * Creates a new document in the database.
 * @return {Promise<UserCredentialsModel>}
 */
UserCredentialsSchema.statics.createDocument = function(email:string, password:string = "", isGoogleAccount:Boolean = false, isFaceBookAccount:Boolean = false):Promise<Credentials> {
    
    return new Promise(async(resolve, reject) => {

        if(!email || !EmailValidator.validate(email)) {
            reject("Invalid email address!");
            return;
        }

        if(isGoogleAccount && isFaceBookAccount) {
            reject("The cannot cannot be a facebook and google at the same time!");
            return;
        }

        if((isGoogleAccount || isFaceBookAccount) && password) {
            reject("A social media account cannot have a password defined!");
            return;
        }

        // Create a new instance and assign it the properties
        let newInstance      = new this();
        newInstance.email    = email;   
        newInstance.password = password || "";            

        newInstance.isGoogleAccount   = isGoogleAccount;
        newInstance.isFaceBookAccount = isFaceBookAccount;
        newInstance.isLocalAccount    = !!password;

        // Save the instance
        newInstance.save((err) => {
            err ? reject(err) : resolve(newInstance);
        });

    });
};
UserCredentialsSchema.methods.generateSecurityToken = function ():Promise<any> {
    
    return new Promise(async(resolve, reject) => {

        try {

            const security:PasswordHash = new PasswordHash();
            this.securityCode.code   = await security.generateRandomToken();
            this.securityCode.expiry = moment(new Date()).add(securityTokenTTL, 'days').toDate();

            if(this.securityCode.counter == 0) {
                this.securityCode.created = new Date();
            }

            this.securityCode.counter = this.securityCode.counter + 1;  
            resolve();

        } catch(err) {
            reject(err);
        }
    });
};
/**
 * Checks if a given password matches the password hash in the database.
 * @param {string} password
 * @return {Promise}
 *  
 * Promise details
 * - resolve(isMatch:Boolean)
 * - reject (error)
 */
UserCredentialsSchema.methods.comparePassword = function(password) {  
    
    return new Promise((resolve, reject) => {
        
        try {
            const security:PasswordHash = new PasswordHash();
            let isMatch = security.isPasswordValid(password, this.password);
            resolve(isMatch);
        } catch(err) {
            reject(err);
        }
    });
};
UserCredentialsSchema.methods.savePromise = function ():Promise<any> {
    return new Promise((resolve, reject) => {
        this.save((error) => {
            error ? reject(error) : resolve(this);
        });
    });
}

export const CredentialsModel = mongoose.model('UserCredentialsModel', UserCredentialsSchema);


/**
 * Define the model to export. The model will be used to:
 *  - Read the properties of the instance.
 *  - Get the instance.
 * ##############################################################################################################
 */
export class Credentials {

    protected instance:any;
    protected _user:User;

    constructor(instance: any) {
        this.instance = instance;
    }

    /**
     * Checks if a password matches the one we have passed it.
     * @param {string} password 
     * @return {Promise<Boolean>}
     */
    public comparePassword(password):Promise<Boolean> {
        return this.instance.comparePassword(password);
    }

    /**
     * Returns the mongodb id of the document.
     * @returns {string}
     */
    public get id():string {
        return this.instance._id;
    }
    /**
     * Returns the email address of the document.
     * @returns {string}
     */
    public get email():string {
        return this.instance.email;
    }
    /**
     * Returns true of the account type is Google account. Meaning that account has a username and password.
     * @returns {Boolean}
     */
    public get isGoogleAccount():Boolean {
        return this.instance.isGoogleAccount;
    }
    /**
     * Returns true of the account type is facebook account. Meaning that account has a username and password.
     * @returns {Boolean}
     */
    public get isFaceBookAccount():Boolean {
        return this.instance.isFaceBookAccount;
    }
    /**
     * Returns true of the account type is local. Meaning the account has a username and password.
     * @returns {Boolean}
     */
    public get isLocalAccount():Boolean {
        return this.instance.isLocalAccount;
    }
    /**
     * Returns the instance of the mongo db document. To be used with care!
     * @returns {any}
     */    
    public get instanceDocument():any {
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
     * Returns the creation date of the document.
     * @returns {Date}
     */
    public get created():Date {
        return this.instance.created;
    }
    /**
     * Returns the last update date of the document.
     * @returns {Date}
     */
    public get updated():Date {
        return this.instance.updated;
    }
    /**
     * Commits the changes to the database.
     * @returns {Promise<any>}
     */
    public update():Promise<any> {
        return this.instance.savePromise();
    }
    /**
     * Gets the user who owns the credentials
     * @returns {User}
     */
    public get user():User {

        if(!this.instance.user) {
            return null;
        }

        if(!this._user) {
            this._user = new User(this.instance.user);

        }
        return this._user;
    }
    public get userId() {

        if(this.instance.user && this.instance.user._id) {
            return this.instance.user._id;
        }

        return this.instance.user;
    }
    public clearSecurityCode():Promise<any> {

        this.instance.securityCode.code    = "";
        this.instance.securityCode.expiry  = new Date();
        this.instance.securityCode.created = new Date();
        this.instance.securityCode.counter = 0;

        return this.update();
    }
    public get securityCode(){

        if(!this.instance) { return null; }
           
        return {
            code   : this.instance.securityCode.code,       // A random code
            expiry : this.instance.securityCode.expiry,     // Expiry date
            created: this.instance.securityCode.created,    // The date when the code has been generated
            counter: this.instance.securityCode.counter,    // Used for counting requests. For example the number of the user ask for `password reset code` per day.
        };
    }
    public issueNewSecurityCode() {

        return new Promise(async (resolve:Function, reject:Function) => {

            try {
                // Can issue max 3 password reset request in 24h.
                if(Config.PASSWORD_RESET_LIMIT <= this.instance.securityCode.counter) {

                    let timeDifference = new Date().getTime() - this.instance.securityCode.created;
                    let hours = Math.floor(Math.abs(timeDifference) / 360000);

                    if(hours < 24) {
                        throw AuthServiceErrorCodes.TOKEN_LIMIT_PER_DAY_REACHED;
                    }

                    this.instance.securityCode.counter = 0;
                }

                // Issue a new security code
                await this.instance.generateSecurityToken();
                await this.update();

                resolve();
            }
            catch(err) {
                reject(err)
            }
        });
    }
}

/**
 * Validates an email address.
 * @param {string} email
 * @return {boolean}
 */
export function validateEmail(email:string) {
    return EmailValidator.validate(email);
}