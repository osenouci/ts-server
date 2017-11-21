const unirest = require('unirest');

import { Config } from './../../config/config';

export class EmailConnector {

    constructor() {

    }

    /**
     * Connects to the email service and sends an activation email to the user
     * @param {string} accountData 'userId.credentialId' 
     * @param {string} fullname 
     * @param {string} recipientEmail 
     * @param {string} activationCode 
     * @param {string} language
     * 
     * @return Promise<response.body>
     */
    public sendActivationEmail(accountData:string, fullname:string, recipientEmail:string, activationCode:string, language = "en") {
        const data = { accountData: `${accountData}`, fullname, recipientEmail, activationCode };
        return this.postData('/account/activation', data, language);
    } // End: EmailConnector::sendActivationEmail()

    public sendPasswordResetEmail(credentialId:string, fullname:string, recipientEmail:string, securityCode:string, language:string = "en") {
        const data = { credentialId, fullname, recipientEmail, securityCode };
        return this.postData('/account/password-reset', data, language);
    } // End: EmailConnector::sendPasswordResetEmail()

    /**
     * Posts data to the notification server.
     * @param {string} path 
     * @param {any} data 
     * @param {string} language 
     * @returns {Promise<string>}
     */
    protected postData(path:string, data:any, language:string = "en"){

        return new Promise((resolve, reject) => {
            unirest.post(Config.notificationServiceConfig.host + path)
            .headers({'accept-language': language})
            .send(data)
            .end(function (response) {
                resolve(response.body);
            });
        }); // end Promise  

    } // End: EmailConnector::postData()

}