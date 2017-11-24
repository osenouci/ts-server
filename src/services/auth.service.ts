// Include classes
// ############################################################################
import { Language             } from './../classes/domain/language';
import { Gender, GenderSecret } from './../classes/domain/gender';
import { SocialProfile        } from './../classes/socialmedia/social.profile';
import { FacebookService      } from './../classes/socialmedia/facebook';
import { GoogleService        } from './../classes/socialmedia/google';

import { SecurityToken } from './../classes/security/security-token';
import { TokenManager  } from './../classes/security/token-manager';

import { DeviceInfo    } from './../classes/utilities/device-info';

// Include Models
// ############################################################################
import { User, UserModel               } from './../models/user-model';
import { Credentials, CredentialsModel, validateEmail } from './../models/user-credentials.model';

import { CredentialsManager } from './user-manager.credentials';
import { UserProfileManager } from './user-manager.profile';


import { DeviceManager      } from './device-manager';
import { Device             } from "./../models/device-model";

// Include the config file
// ############################################################################
import { Config } from './../config/config';

// Define Errors
// ############################################################################
export enum AuthServiceErrorCodes {
    INVALID_EMAIL,
    INVALID_PASSWORD,
    LOCAL_ACCOUNT_INVALID_PARAMS,
    INVALID_ACCESS_TOKEN,
    INVALID_SECURITY_CODE,
    ACCOUNT_DOES_NOT_EXIST,
    ACCOUNT_ALREADY_ACTIVATED,
    ACCOUNT_ALREADY_EXISTS,
    WRONG_PASSWORD,
    INACTIVATED_ACCOUNT,
    TOKEN_LIMIT_PER_DAY_REACHED,
    CANNOT_RESET_FACEBOOK_ACCOUNT_PASSWORD,
    CANNOT_RESET_GOOGLE_ACCOUNT_PASSWORD,
    UNKNOWN
}

export class AuthenticationData {

    protected _status:boolean;
    protected _error:AuthServiceErrorCodes;
    protected _accessToken:any;    
    protected _refreshToken:any;   
    
    protected _data:any;   

    constructor() {
        this._accessToken  = "";
        this._refreshToken = "";

        this._error  = null;
        this._status = true;
        this._data   = null;
    }

    public get status():boolean {
        return this._status;
    }
    public get error():AuthServiceErrorCodes {
        return this._error;
    }    
    public get refreshToken():any {
        return this._refreshToken;
    }        
    public set refreshToken(value:any) {
        this._refreshToken = value;
    }
    public get accessToken():any {
        return this._accessToken;
    }        
    public set accessToken(value:any) {
        this._accessToken = value;
    }

    public get data():any {
        return this._data;
    }        
    public set data(value:any) {
        this._data = value;
    }    
    public set error(error:AuthServiceErrorCodes) {

        this._error  = error;
        this._status = false;
    }

    public set unknownError(data:any) {

        this._error = AuthServiceErrorCodes.UNKNOWN;

        if(data) {
            this._data = data;
        }
    }
}

export enum AccountTypes {
    LOCAL,
    FACEBOOK,
    GOOGLE
}
/**
 * Manager class that is used to:
 *  - Create profiles.
 *  - Update their passwords.
 *  - Update the profile information.
 *  - Link account with facebook and google accounts.
 *  - Perfom login and logout.
 */

export class AuthService{

    protected facebookService:FacebookService = new FacebookService();
    protected googleService  :GoogleService   = new GoogleService();

    protected credentialsManager:CredentialsManager = new CredentialsManager();
    protected userProfileManager:UserProfileManager = new UserProfileManager();

    protected deviceManager:DeviceManager = new DeviceManager();
    protected tokenManager:TokenManager   = new TokenManager();

    /**
     * Gets a given user's profile and banner photos, gender, language and name.
     * @param {string} userId 
     * @return 
     */
    public async getUserInformation(userId:string) {

        try {

            let user = await this.userProfileManager.findById(userId);
            if(!user) { throw new Error() }

            return {
                profilePhoto: user.profilePhoto, 
                bannerPhoto : user.bannerPhoto, 
                gender      : user.gender,
                extensions  : user.extensions,
                language    : user.settings.language,
                name        : user.name
            };

        } catch(err){
            return null;   
        }
    }
    /**
     * Logs in a user using Google. If the user does not have an account then it will create it and logs in the user.  
     * It requires a google access id token.
     * @param {string} accessToken 
     * @param {DeviceInfo} deviceInfo
     * @return {Promise<{refreshToken:string, accessToken:string}>}
     */
    public async CreateAccountUsingGoogle(googleIdToken:string, deviceInfo:DeviceInfo):Promise<AuthenticationData>{
        
        try {        
            let userProfile:SocialProfile = await this.googleService.getUserProfile(googleIdToken);  
            return this.CreateAccountUsingSocialMedia(userProfile, deviceInfo, AccountTypes.GOOGLE);
        } catch(err){
            return null;
        }         
    }      
    /**
     * Logs in a user using facebook. If the user does not have an account then it will create it and logs in the user.  
     * It requires a facebook access token.
     * @param {string} accessToken 
     * @param {DeviceInfo} deviceInfo
     * @return {Promise<{refreshToken:string, accessToken:string}>}
     */
    public async CreateAccountUsingFacebook(accessToken:string, deviceInfo:DeviceInfo):Promise<AuthenticationData>{

        try {
            let userProfile:SocialProfile = await this.facebookService.getUserProfile(accessToken);   
            return this.CreateAccountUsingSocialMedia(userProfile, deviceInfo, AccountTypes.FACEBOOK);
        } catch(err){
            return null;
        } 

    } // End AuthComponent::loginAndCreateAccountUsingFacebook()

    public async loginUsingFacebook(accessToken:string, deviceInfo:DeviceInfo):Promise<AuthenticationData> {
        
        try 
        {
            let userProfile:SocialProfile = await this.facebookService.getUserProfile(accessToken);   
            return this.loginUsingSocialMedia(userProfile, deviceInfo, AccountTypes.FACEBOOK);
        } 
        catch(err)
        {
            return null;
        }

    } // End AuthComponent::loginAndCreateAccountUsingFacebook()

    public async loginUsingGoogle(googleIdToken:string, deviceInfo:DeviceInfo):Promise<AuthenticationData> {
        
        try 
        {
            let userProfile:SocialProfile = await this.googleService.getUserProfile(googleIdToken);   
            return this.loginUsingSocialMedia(userProfile, deviceInfo, AccountTypes.GOOGLE);
        } 
        catch(err)
        {
            return null;
        } 

    }    

    /**
     * Creates a new user account that uses an email and password to authenticate.
     * @returns {Promise<any>}
     */
    public async createLocalAccount(body:any):Promise<any> {

        return new Promise(async (resolve:Function, reject:Function) => {

            let userProfile:User;
            let credentials:Credentials;
       
            const name:string     = body.name;
            const email:string    = body.email;
            const password:string = body.password;   
            const gender:string   = body.gender;
            const language:string = body.language;

            try 
            { 
                if(!name || !email || !password || !gender || !language) {              // Check the fields
                    throw AuthServiceErrorCodes.LOCAL_ACCOUNT_INVALID_PARAMS;
                }            
                
                if(!validateEmail(email)) {                                             // Check if the email address is valid
                    throw AuthServiceErrorCodes.INVALID_EMAIL;
                }

                if(password.length < Config.PASSWORD_LENGTH || password.includes(" ")) { // Check the password length and also it should not contain any spaces.
                    throw AuthServiceErrorCodes.INVALID_PASSWORD;
                }

                let userHasAccount = await this.credentialsManager.findByEmail(email);   // Check if the email has already been registered
                if(userHasAccount) {
                    throw AuthServiceErrorCodes.ACCOUNT_ALREADY_EXISTS;
                }

                userProfile = await this.userProfileManager.create(name, gender, true, language);       // Create the account profile
                credentials = await this.credentialsManager.createLocalCredentials(email, password);    // Create the credentials
    
                userProfile = await this.userProfileManager.linkWithCredentials(credentials.documentId, userProfile);   // Add the credentials to the account profile
                credentials = await this.credentialsManager.linkToAccount(userProfile.documentId, credentials);         // Link the credentials with the profile
        
                //let document:any = credentials.instanceDocument;            // Generate an activation code.
                //let instance = await document.generateSecurityToken();

                resolve(await this.credentialsManager.findById(credentials.instanceDocument._id, true));  // Return the credentials and the user so that they can be used to send the activation email.
            }
            catch(err) {    // Clean up on failure

                if(userProfile) { userProfile.instanceDocument.remove(); }     // Delete document if case of an error
                if(credentials) { credentials.instanceDocument.remove(); }     // Delete document if case of an error
                reject(err);
            }

        });

    } // createLocalAccount
    /**
     * Logs a given user in using his local account. 
     * @param {string} email
     * @param {string} password
     */
    login(email:string, password:string, deviceInfo:DeviceInfo):Promise<{refreshToken:string, accessToken:string}> {

        return new Promise(async(resolve, reject) => {

            try {

                if(!email || !password || !deviceInfo) {
                    throw AuthServiceErrorCodes.INVALID_EMAIL;
                }

                const credentials:Credentials = await this.credentialsManager.findByEmail(email);

                if(!credentials) {   // Invalid email address
                    throw AuthServiceErrorCodes.INVALID_EMAIL;
                }

                if(credentials.isFaceBookAccount) {
                    throw AuthServiceErrorCodes.CANNOT_RESET_FACEBOOK_ACCOUNT_PASSWORD;
                }

                if(credentials.isGoogleAccount) {
                    throw AuthServiceErrorCodes.CANNOT_RESET_GOOGLE_ACCOUNT_PASSWORD;                    
                }                

                let isMatch = await credentials.comparePassword(password);

                if(!isMatch) {      // Invalid password
                    throw AuthServiceErrorCodes.INVALID_PASSWORD;
                }

                // Check if the user account has already been activated
                let user:User = new User(await this.userProfileManager.findById(credentials.userId));
     
                if(!user) {
                    throw AuthServiceErrorCodes.INVALID_EMAIL;
                }
       
                if(!user.activated) {
                    throw AuthServiceErrorCodes.INACTIVATED_ACCOUNT;
                }

                // Issue access and refresh tokens
                const device:Device       = await this.deviceManager.create(deviceInfo.name, deviceInfo.signature, credentials.userId, credentials.documentId);  // Create a new device    
                const refreshToken:string = await this.tokenManager.generateRefreshToken(deviceInfo, device.documentId, credentials.userId);                     // Generate a refresh token
                const accessToken:string  = await this.tokenManager.generateAccessToken(user, credentials, device.documentId);                       // Generate an access token         

                // Update the device object by adding the access and refresh tokens to it.
                let updatedDevice = await this.deviceManager.updateDeviceTokens(device, accessToken, refreshToken);
          
                resolve({refreshToken, accessToken});    // Return an access and refresh tokens

            } catch(err) {
                reject(err);
            }

        });
    }
    /**
     * ############################################################################################################################
     *  Protected methods: Social media profile management (Login and account creation) 
     * ############################################################################################################################
     */    
    /**
     * Login a user using a social media profile. The social media profile is retrieved from a social media website.
     * 1- if the userProfile is valid but it does not have an account then a userProfile is returned.
     * 1- If the userPfofile is valid and the account exists then we login the user and we return {refreshToken, accessToken}.
     * 
     * @throws {INVALID_ACCESS_TOKEN|ACCOUNT_DOES_NOT_EXIST}
     * 
     * @param {UserProfile} userProfile 
     * @param {DeviceInfo} deviceInfo 
     * @returns {Promise<AuthenticationData>}
     */
    protected loginUsingSocialMedia(userProfile:SocialProfile, deviceInfo:DeviceInfo, accountType:AccountTypes):Promise<AuthenticationData> {
        
        return new Promise(async (resolve:Function, reject:Function) => {

            const response:AuthenticationData = new AuthenticationData();

            try {

                if(!userProfile) { throw AuthServiceErrorCodes.INVALID_ACCESS_TOKEN; }
                let credentials:Credentials = await this.credentialsManager.find(userProfile.email, accountType); // Find the credentials using the email address.
                
                if(!credentials) {                                      // Credentials not found then the account does not exists
                    response.data = userProfile;                        // Pass back the social profile so that we can use to create a new account.
                    throw AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST;      // Throw an exception
                }   

                // Account exists then generate an access and refresh token                
                const userId:string       = credentials.user.documentId;
                const device:Device       = await this.deviceManager.create(deviceInfo.name, deviceInfo.signature, userId, credentials.documentId);  // Create a new device    
                const refreshToken:string = await this.tokenManager.generateRefreshToken(deviceInfo, device.documentId, userId);                     // Generate a refresh token
                const accessToken:string  = await this.tokenManager.generateAccessToken(credentials.user, credentials, device.documentId);           // Generate an access token         
               
                // Update the device object by adding the access and refresh tokens to it.
                let updatedDevice = await this.deviceManager.updateDeviceTokens(device, accessToken, refreshToken);
                response.accessToken = accessToken;
                response.refreshToken= refreshToken;

            }
            catch(err){
                
                if(err in AuthServiceErrorCodes) {
                    response.error = err;
                } else {
                    response.unknownError = err;
                }
            }

            resolve(response);
        });

    }
    /**
     * Tries to login a user using a social media account. If the user has a valid social media account and is not registered then it
     * will create a new account for the user then it will log him in.
     * @param {SocialProfile} socialProfile 
     * @param {DeviceInfo} deviceInfo 
     * @param {AccountTypes} accountType 
     * 
     * @return {Promise<any>}
     */
    protected CreateAccountUsingSocialMedia(socialProfile:SocialProfile, deviceInfo:DeviceInfo, accountType:AccountTypes):Promise<AuthenticationData> {
        
        return new Promise(async(resolve:Function, reject:Function):Promise<{refreshToken:string, accessToken:string}> => {

            try {

                // 1) Try to login the user
                let loginResponse:AuthenticationData = await this.loginUsingSocialMedia(socialProfile, deviceInfo, accountType);
                
                if(loginResponse.status) {
                    resolve(loginResponse);
                    return;
                }

                if(loginResponse.error != AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST) {    // If the social media account does not exists the return an error.
                   throw AuthServiceErrorCodes.ACCOUNT_ALREADY_EXISTS;
                }

                let userHasAccount = await this.credentialsManager.findByEmail(socialProfile.email);
                if(userHasAccount) {
                    throw AuthServiceErrorCodes.ACCOUNT_ALREADY_EXISTS;
                }

                // 2) If the account does not exists then create a new account
                let userProfile:SocialProfile = loginResponse.data;
                let data = await this.createAccountFromSocialMediaProfile(socialProfile, accountType);                

                // 3) Try to login the user
                loginResponse = await this.loginUsingSocialMedia(socialProfile, deviceInfo, accountType);
                
                if(loginResponse.status) {
                    resolve(loginResponse);
                    return;
                }

                reject();

            } catch(err){
                reject(err);
            } // End of try-catch

        });
    }
    /**
     * Creates a new user account from a social media profile
     * @param {SocialProfile} socialProfile 
     * @param {AccountTypes} accountType 
     */
    protected async createAccountFromSocialMediaProfile(socialProfile:SocialProfile, accountType:AccountTypes):Promise<any> {
        
        return new Promise(async(resolve, reject) => {
            
            let userProfile:User = null, credentials:Credentials = null;

            if(!socialProfile || !socialProfile.email) {
                reject();
                return;
            }

            try {
        
                userProfile = await this.userProfileManager.create(socialProfile.name, socialProfile.gender, false);    // Create an account profile
                
                // Save the credentials
                if(accountType == AccountTypes.FACEBOOK) { credentials = await this.credentialsManager.createFacebook(socialProfile); }
                if(accountType == AccountTypes.GOOGLE  ) { credentials = await this.credentialsManager.createGoogle(socialProfile);   }                
                                                
                userProfile = await this.userProfileManager.linkWithCredentials(credentials.documentId, userProfile);   // Add the credentials to the account profile
                credentials = await this.credentialsManager.linkToAccount(userProfile.documentId, credentials);         // Link the credentials with the profile
        
                resolve({userProfile, credentials});
            }
            catch(err) {

                // Clean up on failure
                if(userProfile) { userProfile.instanceDocument.remove(); }     // Delete document if case of an error
                if(credentials) { credentials.instanceDocument.remove(); }     // Delete document if case of an error
                reject(err);
            }
        }); // end Promise

    } // end method   
    /**
     * ############################################################################################################################
     *  Protected methods: Activate a user's account
     * ############################################################################################################################
     */    
    /**
     * Activates an account given the accountData and a security code. The two are sent to the user by email.
     * the account data has the following format `${userId}.${credentialId}`.
     * @param {string} accountData 
     * @param {string} securityCode 
     * @return {Promise<any>}
     */
    public activateAccount(accountData:string, securityCode:string) {

        return new Promise(async(resolve, reject) => {

            try {
            
                const accountDataParts:Array<string> = accountData.split(".");                                      // Split the user data into user and credentials IDs.
                if(accountDataParts.length != 2) { throw AuthServiceErrorCodes.INVALID_SECURITY_CODE; }

                const userId       :string = accountDataParts[0];
                const credentialsId:string = accountDataParts[1];

                const credentials:Credentials = await this.credentialsManager.findById(credentialsId, true);        // Get the user and his credentials
                if(!credentials) { throw AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST; }  

                const user:User = credentials.user;                                                                 // Get the user document

                if(user.activated) {
                    throw AuthServiceErrorCodes.ACCOUNT_ALREADY_ACTIVATED;
                }

                if(!user) { throw AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST; }
           
                if(!credentials.securityCode.code || credentials.securityCode.code != securityCode) {               // Check if the security code matches
                    throw AuthServiceErrorCodes.INVALID_SECURITY_CODE 
                }

                user.setActivation(true);               // Mark the user as activated
                await user.update();

                await credentials.clearSecurityCode();  // Clear the activation code
                resolve();                              // Done

            } catch(err) {
                reject(err);
            }

        });
    }
    /**
     * ############################################################################################################################
     *  Protected methods: Password reset
     * ############################################################################################################################
     */  
    createPasswordResetTicket(email:string):Promise<Credentials> {

        return new Promise(async (resolve:Function, reject:Function) => {

            try {

                if(!email || !validateEmail(email)) { throw AuthServiceErrorCodes.INVALID_EMAIL; }       // Check if the email address is valid
                    
                let credentials:Credentials = await this.credentialsManager.findByEmail(email, true);             // Look up the user account
                if(!credentials) { throw AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST; }                  // Check if the account exists
                if(!credentials.user.activated) { throw AuthServiceErrorCodes.INACTIVATED_ACCOUNT; }      // Check if the account has already been activated.

                if(credentials.isFaceBookAccount) { throw AuthServiceErrorCodes.CANNOT_RESET_FACEBOOK_ACCOUNT_PASSWORD; }
                if(credentials.isGoogleAccount) { throw AuthServiceErrorCodes.CANNOT_RESET_GOOGLE_ACCOUNT_PASSWORD; }                
                await credentials.issueNewSecurityCode();   // Generate new credentials
                resolve(credentials);

            } catch(err) {
                reject(err);
            }
        });
    } // End: AuthComponent::createPasswordResetTicket()

    public isSecurityCodeValid(credentialsId, securityCode):Promise<boolean> {
        
        return new Promise(async(resolve:Function, reject:Function) => {
            try {

                if(!credentialsId || !securityCode) { throw AuthServiceErrorCodes.INVALID_SECURITY_CODE; }
                let credentials:Credentials = await this.credentialsManager.findById(credentialsId);
                
                if(securityCode != credentials.securityCode.code) { throw AuthServiceErrorCodes.INVALID_SECURITY_CODE; }

                const hasExpired:boolean = new Date() > credentials.securityCode.expiry;    // Check if the code has not expired yet
                resolve(!hasExpired);

            } catch(err) {
                resolve(false);
            }
        });
    }  // End: AuthComponent::isSecurityCodeValid()

    public setNewPassword(credentialsId:string, password:string, resetSecurityCode:boolean = false) {

        return new Promise(async(resolve:Function, reject:Function) => {
            try {

                let credentials:Credentials = await this.credentialsManager.findById(credentialsId);
                if(!credentials) { throw AuthServiceErrorCodes.ACCOUNT_DOES_NOT_EXIST; }

                credentials.instanceDocument.password = password;

                if(resetSecurityCode) {
                    await credentials.clearSecurityCode();
                }
                await credentials.instanceDocument.savePromise();
                resolve();

            } catch(err) {

                resolve(false);
            }
        });

    }

}