/**
 *  Import modules
 * #####################################################################
 */
import * as crypto   from "crypto";

/**
 *  Import classes
 * #####################################################################
 */
import { SecurityToken  } from './security-token';
import { Config         } from './../../config/config';
import { DeviceInfo     } from './../../classes/utilities/device-info';

/**
 *  Import models
 * #####################################################################
 */
import { User           } from './../../models/user-model';
import { Credentials    } from './../../models/user-credentials.model';

/**
 *  TokenManager class definition
 * #####################################################################
 */
export class TokenManager {

    /**
     * Generates a signed access token.
     * @param {User} user
     * @param {Credentials} credentials 
     * @returns {string}
     */    
    public generateAccessToken(user:User, credentials:Credentials, deviceId:string):string {

        let data = {
            userId : user.documentId,
            email  : credentials.email,
            name   : user.name,
            deviceId                        
        };
        
        let securityToken = new SecurityToken();
        return securityToken.create(data, Config.tokenConfig.accessTokenTTLL);

    } // End: TokenManager::generateAccessToken()

    /**
     * Generates a signed refresh token.
     * @param deviceName 
     * @param deviceSignature 
     * @param userId 
     * @returns {Promise<string>}
     */
    public generateRefreshToken(deviceInfo:DeviceInfo, deviceId:string, userId:string):Promise<string> {

        return new Promise((resolve, reject) => {
            crypto.randomBytes(Config.tokenConfig.refreshTokenLength, async (err: Error, buf: Buffer) => {
    
                try {

                    if(err) {
                        throw err;
                    }

                    const securityToken = new SecurityToken()
                    const random:string = buf.toString('hex').toUpperCase();
                    const data          = {userId, deviceName:deviceInfo.name, deviceInfo:deviceInfo.signature, random, deviceId};            

                    const token:string  = securityToken.create(data, Config.tokenConfig.refreshTokenTTL);
                    
                    resolve(token);
                }
                catch(err) {
                    reject(err);
                }
            });
        });

    } // End: TokenManager::generateRefreshToken()

    public renewAccessToken(token:SecurityToken, user:User, credentials:Credentials) {
        return this.generateAccessToken(user, credentials, token.data.deviceId);
    } // End: TokenManager::renewAccessToken()

    public renewRefreshToken(token:SecurityToken, deviceInfo:DeviceInfo):Promise<string> {
        return this.generateRefreshToken(deviceInfo, token.data.deviceId, token.data.userId)
    } // End: TokenManager::renewRefreshToken()

} // End: class TokenManager