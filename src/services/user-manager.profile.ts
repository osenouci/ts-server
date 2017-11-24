// Include classes
// ############################################################################
import { SocialProfile   } from './../classes/socialmedia/social.profile';
import * as mongoose from "mongoose";

// Include Models
// ############################################################################
import { User, UserModel } from './../models/user-model';

export class UserProfileManager {


    /**
     * Creates a new user entry in the database
     * @param {string} name 
     * @param {string} gender 
     * @param {boolean} isLocalAccount 
     * @param {string} language 
     * @return {Promise}
     */
    public create(name: string, gender: string, isLocalAccount: boolean = true, language: string = "en"):Promise<User> {

        return new Promise(async(resolve, reject) => {

            try {

                let user = await UserModel.createDocument(name, gender, isLocalAccount, language); // Create the user's account
                resolve(new User(user));

            } catch (err) {
                reject(err)
            };
        });
    } // End: UserManager::create()

    /**
     * Updates a given user's profile, given his id and profile photo link
     * @param {any} userId 
     * @param {string} photoURL 
     * @return {Promise<null>}
     */
    public updateUserProfilePhoto(userId:any, photoURL:string):Promise<null> {
        return new Promise(async(resolve, reject) => {
        
            try {
                
                let document = await this.findById(userId, false);
                if(!document) {throw 'UserProfileManager::updateUserProfile() -> user not found!'}
                
                let user:User = new User(document);
                user.setProfilePhoto(photoURL);
                await user.update();
                resolve(null);

            } catch(err) {
                reject();
            } 
        });
    }
    /**
     * Updates a given user's profile, given his id and profile photo link
     * @param {any} userId 
     * @param {string} photoURL 
     * @return {Promise<null>}
     */
    public updateUserBannerPhoto(userId:any, photoURL:string):Promise<null> {
        return new Promise(async(resolve, reject) => {
        
            try {
                
                let document = await this.findById(userId, false);
                if(!document) {throw 'UserProfileManager::updateUserProfile() -> user not found!'}
                
                let user:User = new User(document);
                user.setBannerPhoto(photoURL);
                await user.update();
                resolve(null);

            } catch(err) {
                reject();
            } 
        });
    }
    /**
     * Links a credentials ID with an existing UserAccount.
     * @param {string} credentialsId 
     * @param {UserModel} userAccount 
     * 
     * @return {Promise<UserModel>}
     */
    public linkWithCredentials(credentialsId: string, userAccount: User):Promise<User> {

        return new Promise(async(resolve, reject) => {
            try {

                let instance: any = userAccount.instanceDocument;
                if((instance.credentials as Array<string>).indexOf(credentialsId) != -1){
                    resolve(userAccount);
                    return;
                }

                (instance.credentials as Array<string>).push(credentialsId);
                await instance.savePromise();
                resolve(new User(instance));

            } catch (err) {
                reject(err);
            }
        });

    } // End: UserManager::linkWithCredentials()
    /**
     * Find a given user by mongo id.
     * @param {string} userId 
     * @return {Promise}
     */
    public findById(userId: string, includeAccounts: boolean = false): Promise < any > {
        
        let query:any = UserModel.findById(userId);
        query = includeAccounts? query.populate('credentials') : query;
        return query.exec();
            
    } // End: UserManager::findById()

}