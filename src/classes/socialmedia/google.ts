const unirest = require('unirest');
import { SocialProfile } from "./social.profile";

const googleURL:string = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';

export class GoogleService {

    getUserProfile(idToken:string):Promise<SocialProfile> {

        return new Promise((resolve, reject) => {
            unirest.get(googleURL + idToken).end(function (response) {
                try{
                    resolve(new SocialProfile(response.body));
                }catch(err){
                    reject(err);
                }
            });      
        });
    }

}