// Included 3ed party modules
// ############################################################################
import * as mongoose from "mongoose";

// Include the config file
// ############################################################################
import { Config } from './../config/config';

// Include classes
// ############################################################################
import { Language             } from './../classes/domain/language';
import { Gender, GenderSecret } from './../classes/domain/gender';
import { SocialProfile        } from './../classes/socialmedia/social.profile';

// Define contants
// ############################################################################
export const MIN_PASSWORD_LENGTH = 8;

// Configure mongoose
// ############################################################################
(mongoose as any).Promise = Promise;
const schema = mongoose.Schema;

let genderManager:Gender = new Gender();

// Define the schema
// ############################################################################
const UserSchema: mongoose.Schema = new schema({

    name: {
        type: String,
        lowercase: true,
        trim: true
    }, // Use's full name
    profilePhoto: {
        type: String
    }, // URL used to set the profile photo
    bannerPhoto: {
        type: String
    }, // URL used to set the profile photo    
    extensions: { // Used to determin which extensions the user has enabled.
        sports: {
            type: Boolean,
            default: false
        }, // -> Sports extension enabled or not for the user.
        social: {
            type: Boolean,
            default: false
        }, // -> Social extension enabled or not for the user.
        gaming: {
            type: Boolean,
            default: false
        }, // -> Gaming extension enabled or not for the user.
        dating: {
            type: Boolean,
            default: false
        } // -> Dating extension enabled or not for the user.
    },
    banned: {
        type: Boolean,
        default: false
    }, // Flag the account as banned.
    activated: {
        type: Boolean,
        default: false
    }, // Flag the account as not activated yet.
    gender: {
        type: String,
        uppercase: true,
        trim: true,
        default: GenderSecret.symboleUpper
    }, // M(ale)/F(emale)/U(nkown)
    created: {
        type: Date,
        default: Date.now
    }, // The account creation date.
    updated: {
        type: Date,
        default: Date.now
    }, // The last time the account was updated!

    // Will hold pointers to credentials
    credentials: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserCredentialsModel'
    }],
    settings: { // Account settings
        language: {
            type: String,
            lowercase: true,
            trim: true
        }, // -> Language code like `fr`, `en`, `ar`, `de`, `nl` and so on.
        search: {
            name: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: true
            }
        }
    }

});

/**
 * Formats the language and the gender. Also sets the updated property to the current date.
 */
UserSchema.pre('save', function (next) {
    this.updated = new Date();

    // Parse the gender
    if (this.isModified('gender') || this.isNew) {
        let gender: Gender = new Gender();
        this.gender = gender.convertToShort(this.gender);
    }

    // Parse the language
    if (this.isModified('settings.language') || this.isNew) {
        let language: Language = new Language();
        this.settings.language = language.convertToShort(this.settings.language);
    }

    next();
});

/**
 * Creates a new user.
 * @param {string} name
 * @param {string} gender
 * @param {string} isActivated [false]
 * @param {string} language [en]
 * @return {Promise}
 *  
 * Promise details
 * - resolve(newUser:Mongoose object)
 * - reject (error)
 */
UserSchema.statics.createDocument = function (name: string, gender: string, isLocalAccount: boolean = false, language: string = "en") {

    return new Promise(async(resolve, reject) => {

        try {
            let instance = new this();

            instance.name      = name;
            instance.gender    = genderManager.convertToShort(gender);
            instance.activated = !isLocalAccount; // Local accounts are not activated by default. They need to be activated using email address.

            instance.credentials = new Array();

            instance = await instance.savePromise();
            resolve(instance);

        } catch (err) {
            console.log("==============================", "\n", err, "\n", "==============================");
            reject(err);
        }
    });
};
/**
 * Saves a document into the database.
 * @return {Promise<Document>}
 */
UserSchema.methods.savePromise = function (): Promise < any > {
    return new Promise((resolve, reject) => {
        this.save((error) => {
            error ? reject(error) : resolve(this);
        });
    });
};

export const UserModel:any = mongoose.model('UserModel', UserSchema);

// Define the model class
// ===================================================================================================
/**
 * The user model class used to manage users.
 */
type preferenceReturnType = { name: boolean, email: boolean } ;
export class User {

    protected instance;

    protected UserModel: any;
    protected User: any;

    protected languageManager: Language;
    protected genderManager: Gender;

    constructor(instance:any) {
        this.instance = instance;
    }
    /**
     *  Getters
     * ======================================================================
     */
    /**
     * Returns the name of the user.
     * @returns {string}
     */
    public get name(): string {
        return this.instance.name;
    }
    /**
     * Returns the prefered language of the user.
     * @returns {string}
     */
    public get language(): string {
        return this.instance.settings.language;
    }
    /**
     * Returns the user's profile photo.
     * @returns {string}
     */
    public get profilePhoto(): string {
        return this.instance.profilePhoto;
    }

    public get bannerPhoto(): string {
        return this.instance.bannerPhoto;
    }

    /**
     * Checks if the user's account has been activated or not.
     * @note Accounts created using facebook and google sign-in are automatically activated.
     * @returns {boolean}
     */
    public get activated(): boolean {
        return this.instance.activated;
    }
    /**
     * Returns the user's gender.
     * @returns {string}
     */
    public get gender(): string {
        return this.instance.gender;
    }
    /**
     * Returns the user's gender.
     * @returns {string}
     */
    public get searchPreferences(): preferenceReturnType {
        return {
            name: this.instance.settings.Search.name,
            email: this.instance.settings.Search.email
        }
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
     *  Setters
     * ======================================================================
     */
    /**
     * Updates the user's full name
     * @param {string} name 
     * @return {Promise<Document>}
     */
    public setName(name: string) {
        this.instance.name = name; // The pre-save function will parse it to a correct short value
    }
    /**
     * Updates the gender property.
     * @param {string} gender 
     * @return {Promise<Document>}
     */
    public setGender(gender: string) {
        this.instance.gender = gender; // The pre-save function will parse it to a correct short value
    }
    /**
     * Updates the prefered language.
     * @param {string} language 
     * @return {Promise<Document>}
     */
    public setLanguage(language: string) {
        this.instance.settings.language = language; // The pre-save function will parse it to a correct short value
    }
    /**
     * Sets the account activation.
     * @param {Boolean} value 
     * @return {Promise<Document>}
     */
    public setActivation(value: boolean) {
        this.instance.activated = value;
    }
    /**
     * Sets the user's profile photo.
     * @param {string} photo 
     * @return {Promise<Document>}
     */
    public setProfilePhoto(photo: string) {
        this.instance.profilePhoto = photo;
    }
    /**
     * Sets the user's banner photo.
     * @param {string} photo 
     * @return {Promise<Document>}
     */
    public setBannerPhoto(photo: string) {
        this.instance.bannerPhoto = photo;
    }
    

    /**
     * Commits the changes to the database.
     * @returns {Promise<any>}
     */
    public update():Promise<any> {
        return this.instance.savePromise();
    }


} // End: UserModel class

