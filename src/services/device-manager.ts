
import { Device, DeviceModel } from './../models/device-model';

import { SecurityToken } from './../classes/security/security-token';
import { TokenManager  } from './../classes/security/token-manager';


/**
 * Used to manage the generating of access and refresh tokens. 
 * This means registering devices and issues tokens to them. 
 * 
 * @Future feature:
 * We keep a database of the devices so that the user can revoke access to a device from distance.
 */
export class DeviceManager {

    protected tokenManager:TokenManager = new TokenManager();


    /**
     * Lists all the devices of a given user.
     * @param {string} userId
     * @returns {Promise<any>}
     */
    public listUserDevices(userId:string):Promise<any>{
        return DeviceModel.findOne({user: userId}).exec();
    } // End: DeviceManager::listUserDevices() 
    /**
     * Lists all the devices.
     * @returns {Promise<any>}
     */
    public list():Promise<any>{
        return DeviceModel.find({}).exec(); 
    } // End: DeviceManager::list()

    /**
     * Finds a given device by it's ID.
     * @param {string} deviceId 
     * @return {Promise<Object>}
     */
    findDeviceById(deviceId:string) {
        return DeviceModel.findOne({ _id: deviceId}).exec();
    }
     /**
      * Finds a given device by device name and user Id.
      * @param {string} deviceName 
      * @param {string} userId
      * @returns {Promise<Object>} 
      */
     public findDevice(deviceName:string, userId:string):Promise<any> {
         return DeviceModel.findOne({name: deviceName, user: userId}).exec();
    } // End: DeviceManager::findDevice()
     /**
      * Removes a device from the database.
      * @param {string} deviceName 
      * @param {string} userId
      * @return {Promise<any>}
      */
     public delete(deviceName:string, userId:string):Promise<any> {
 
         return new Promise((resolve, reject) => {
            DeviceModel.remove({ name: deviceName, user: userId }, async(err) => {
                 err ? reject(err) : resolve();
             });
         });        
         
    } // End: DeviceManager::delete()

    /**
     * Updates a given device's refrsh and access token.
     * @param device 
     * @param accessToken 
     * @param refreshToken 
     */
    updateDeviceTokens(device:Device, accessToken:string, refreshToken:string) {

        if(accessToken) {
            device.accessToken = accessToken;
        }

        if(refreshToken) {
            device.refreshToken = refreshToken;
        }

        return device.update();
    }

     /**
      * Adds a new device to the database.
      * @param {string} deviceName 
      * @param {string} deviceSignature 
      * @param {string} userId 
      * @param {string} accessToken
      * 
      * @return {Promise<any>}
      */
     public create(deviceName:string, deviceSignature:string, userId:string, credentialsId:string, accessToken:string = ""):Promise<Device> {
 
         return new Promise(async(resolve, reject) => {
 
             try {
 
                 let device = await this.findDevice(deviceName, userId);
                 if(device) {   // if the device exists then delete it
                     await this.delete(deviceName, userId);
                 }
                 device = await DeviceModel.create(deviceName, deviceSignature, userId, credentialsId, accessToken);   // Create a new device entry with a new access token
                 resolve(new Device(device));
 
             }catch(err){
                 reject(err)
             };
         });
     } // End: DeviceManager::create()

} // End: class DeviceManager