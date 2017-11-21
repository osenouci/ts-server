import { Gender } from './../domain/gender';

export class SocialProfile {

    protected _id:number;
    protected _name:string;
    protected _email:string;
    protected _gender:string;
    protected _isVerified:Boolean;


    protected genderManager:Gender = new Gender();

    constructor(data:any) {
   
        this._id     = data.id ? parseInt(data.id) : null;          // Facebool user id
        this._email  = data.email;
        this._gender = data.gender? this.genderManager.convertToLong(data.gender) : this.genderManager.convertToLong("Unknown") ;
        this._name   = data.name;

        // Available using google auth only.
        if(typeof data.email_verified == 'boolean') {
            this._isVerified = data.email_verified == 'true';
        } else {
            this._isVerified = true;
        }
    }

    /**
     * returns true of the google email is verified.
     * @return {number}
     */
    public get isVerified():Boolean {
        return this._isVerified;
    }    
    /**
     * returns the facebook user id.
     * @return {number}
     */
    public get id():number {
        return this._id;
    }
    /**
     * returns the user's name.
     * @return {string}
     */
    public get name():string {
        return this._name;
    }
    /**
     * returns the user's email.
     * @return {string}
     */
    public get email():string {
        return this._email;
    }
    /**
     * returns the user's gender.
     * @return {string}
     */    
    public get gender():string {
        return this._gender;
    }

}