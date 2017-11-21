// Include classes
// ############################################################################
import { SocialProfile        } from './../classes/socialmedia/social.profile';

// Include Models
// ############################################################################
import { Credentials, CredentialsModel } from './../models/user-credentials.model';
import { AccountTypes } from "./../services/auth.service";
/**
 * Account manager definition. It does the following
 *  - Looks up accounts
 *  - Creates facebook/Google/local accounts.
 *  - Links a credentials document to a userModel document
 * ##############################################################################################################
 */
export class CredentialsManager {

    /**
     * Finds a single document by id
     * @param {string} id 
     * @return {Promise<Credentials>}
     */
    public findById(id:string, populateUser:boolean = false):Promise<Credentials> {
        
        return new Promise(async (resolve, reject) => {

            let query:any = CredentialsModel.findOne({ _id: id });
            if(populateUser) { query = query.populate('user'); }

            let instance = await query.exec();  
            instance = instance ? new Credentials(instance) : null;
            resolve(instance);
        });
    }

    /**
     * Finds a single document whose email matches the email we passe as an argument.
     * @param {string} email 
     * @return {Promise<Credentials>}
     */
    public findByEmail(email:string, populateUser:boolean = false):Promise<Credentials> {
        
        return new Promise(async (resolve, reject) => {
        
            let query:any = CredentialsModel.findOne({email});
            if(populateUser) { query = query.populate('user'); }

            let instance = await query.exec();  
    
            if(!instance) {
                resolve(null);
                return;
            }
    
            resolve(new Credentials(instance));
        });
    }

    /**
     * Finds a single document whose email matches the email we passe as an argument.
     * @param {string} email 
     * @return {Promise<Credentials>}
     */
    public find(email:string, accountType:AccountTypes):Promise<Credentials> {
        
        return new Promise(async (resolve, reject) => {
        
            const filter = { email };

            if(accountType == AccountTypes.FACEBOOK) { filter["isFaceBookAccount"] = true; }
            if(accountType == AccountTypes.GOOGLE  ) { filter["isGoogleAccount"  ] = true; }

            let instance = await CredentialsModel.findOne(filter)
            .populate('user')
            .exec();  
    
            if(!instance) {
                resolve(null);
                return;
            }
    
            resolve(new Credentials(instance));
        });
    }
    /**
     * Creates a user's credentials record out of Facebook's SocialProfile.
     * @param {SocialProfile} userProfile 
     * @return {Promise}
     */    
    public createFacebook(userProfile:SocialProfile):Promise<Credentials> {

        return new Promise(async(resolve, reject) => {
            
            try {
                let userCredentials = await (CredentialsModel as any).createDocument(userProfile.email, "", false, true);
                resolve(new Credentials(userCredentials));
            } catch (err) {
                reject(err)
            };
        });
    }   

    /**
     * Create a local account credentials given a user's email and password.
     * @param email 
     * @param password 
     */
    public createLocalCredentials(email:string, password:string):Promise<Credentials> {

        return new Promise(async(resolve, reject) => {
            
            try {
                let userCredentials = await (CredentialsModel as any).createDocument(email, password, false, false);
                resolve(new Credentials(userCredentials));
            } catch (err) {
                reject(err)
            };
        });

    }

    /**
     * Creates a user's credentials record out of Google's SocialProfile.
     * @param {SocialProfile} userProfile 
     * @return {Promise}
     */
    public createGoogle(userProfile:SocialProfile):Promise<Credentials> {
        
        return new Promise(async(resolve, reject) => {
            
            try {
                let userCredentials = await (CredentialsModel as any).createDocument(userProfile.email, "", true, false);
                resolve(new Credentials(userCredentials));
            } catch (err) {
                reject(err)
            };
        });

    }    
    /**
     * Links an AccountModel document with a document of type UserCredentials.
     * @param {string} accountId 
     * @param {UserCredentialsModel} userCredentials 
     * @return {Promise<UserCredentialsModel>}
     */
    public linkToAccount(accountId:string, userCredentials:Credentials):Promise<Credentials> {

        return new Promise(async(resolve, reject) => {

            try {

                let instance:any = userCredentials.instanceDocument;
                instance.user    = accountId;

                await instance.savePromise();
                resolve(new Credentials(instance));

            } catch(err) {
                reject(err);
            }
        });
    } // End: Function -> linkToAccount()
}