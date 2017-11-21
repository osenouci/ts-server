import * as crypto from"crypto";

/**
 * Class used to hash and verify the password.
 */
export class PasswordHash {

    /**
     * #################################################################################################################
     *  Public methods
     * #################################################################################################################
     */
    /**
     * Checks if plain password matches a hashed password data.
     * @param string plainPassword
     * @param string|object passwordData
     * @returns {boolean}
     */
    public isPasswordValid(plainPassword, passwordData){

        if(typeof passwordData == "string") {                                       
            passwordData = this.split(passwordData);
        }

        const hashedPassword = passwordData.hashedPassword;
        const password       = this.hashPassword(plainPassword, passwordData);

        return hashedPassword == password;
    }
    /**
     * Generates a password data and uses it to hash a plain password.
     * @param plainPassword
     * @returns {Promise}
     */
    public hashUserPassword(plainPassword) {

        return new Promise(async(resolve, reject) => {

            try {

                let passwordData:any        = await this.generateHashData();
                passwordData.hashedPassword = this.hashPassword(plainPassword, passwordData);
                resolve(this.join(passwordData));

            } catch(err) {
                reject(err);
            } 

        });// end promise
    }
    /**
     * #################################################################################################################
     *  Internal methods
     * #################################################################################################################
     */
    /**
     * Joins user password parts and converts them into colon seperated string.
     * @param object password
     * @returns {string}
     */
    protected join(password:any = {}){

        if(!password.iterations || !password.seed || !password.algorithm || !password.hashedPassword) {
            throw "PasswordHash::join() - Password parts are not defined.";
        }

        return password.hashedPassword + ":" + password.algorithm + ":" + password.seed + ":" + password.iterations;
    }
    /**
     * Splits an string generated by the join function and converts it back into an object.
     * @param string password
     * @returns {{hashedPassword: string, algorithm: string, seed: string, iterations: Number}}
     */
    protected split(password){

        password = password.split(":");
        
        if(password.length != 4) {
            throw "PasswordHash::split() - the password split function did not generate 4 parts. Instead it generated: " + password.length;
        }
        
        return {
            hashedPassword: password[0],
            algorithm     : password[1],
            seed          : password[2],
            iterations    : parseInt(password[3])
        };
    }
    /**
     * Hashes a plain password using passed passwordData
     * @param string plainPassword
     * @param object passwordData
     * @returns string
     */
    protected hashPassword(plainPassword, passwordData){

        var iterations = passwordData.iterations;
        var algorithm  = null;

        if(passwordData.algorithm == "sha1"){
            algorithm = this.sha1.bind(this);
        }else{
            throw "PasswordHash::hashPassword() - Unknown hash algorithm: " + passwordData.algorithm;
        }

        // Hash the password
        for(;iterations != 0; iterations--) {
            plainPassword = algorithm(plainPassword  + passwordData.seed);
        }

        return plainPassword;
    }
    public generateRandomToken(length:number = 12):Promise<any> {
        return this.generateSalt(12);
    }
    /**
     * #################################################################################################################
     *  Utility functions
     * #################################################################################################################
     */
    /**
     * Generates a random number between min and max.
     * @param int min
     * @param int max
     * @returns int
     */
    protected getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * Generates a random string having its length defined by the length argument.
     * @param int length 11
     * @returns {Promise}
     */
    protected generateSalt(length = 11){
        return new Promise(function(resolve, reject){
            crypto.randomBytes(length, function(err, buffer) {

                if(err) { return reject(err);}
                resolve(buffer.toString('hex'));
            });
        });
    }
    /**
     * Generates data used to hash a plain password. This includes a hashing algorithm, a random seed
     * and a number of iterations
     * @returns {Promise}
     */
    protected generateHashData(){
        const hashData = {
            hashedPassword: null,
            algorithm     : "sha1",
            seed          : null,
            iterations    : this.getRandomIntInclusive(5, 15)
        };

        return new Promise(function(resolve, reject){

            this.generateSalt().then(function(salt){
                hashData.seed = salt;
                resolve(hashData);

            }).catch(function(err){
                reject(err);
            });
        }.bind(this));
    }
    /**
     * Hashes a string using sha1 algorithm.
     * @param string
     * @returns string
     */
    protected sha1(string) {
        let sha1 = crypto.createHash('sha1');
        sha1.update(string);
        return sha1.digest('hex').toString();
    }
}