const unirest = require('unirest');
import { SocialProfile } from "./social.profile";

const facebookURL:string = 'https://graph.facebook.com/v2.10/10211751127788592?fields=id,name,picture,email,gender&access_token=';

export class FacebookService {

    getUserProfile(accessToken:string):Promise<SocialProfile> {
        
        return new Promise((resolve, reject) => {
            unirest.get(facebookURL + accessToken).end(function (response) {
                try{
                    resolve(new SocialProfile(JSON.parse(response.body)));
                }catch(err){
                    reject(err);
                }
            });      
        });
    }

}