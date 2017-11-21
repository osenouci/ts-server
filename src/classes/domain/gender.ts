
export const GenderMale = {
    symboleUpper: "M",
    symboleLower: "m",
    name        : "Male", 
    nameLower   : "male",
};    
export const GenderFemale  = {
    symboleUpper: "F",
    symboleLower: "f",
    name        : "Female", 
    nameLower   : "female"
};
export const GenderSecret = {
    symboleUpper: "U",
    symboleLower: "u",
    name        : "Unknown", 
    nameLower   : "unknown"
};                 


export class Gender {

    /**
     * Returns true of the gender is equal to `male` or `m`.
     * @note this function is case insensitive.
     * @param {string} value 
     */
    public isMale(value:string):boolean {
        value = value.toLowerCase();
        return value == GenderMale.nameLower || value == GenderMale.symboleLower ;
    }
    /**
     * Returns true of the gender is equal to `female` or `f`.
     * @note this function is case insensitive.
     * @param {string} value 
     */    
    public isFemale(value:string):boolean {
        value = value.toLowerCase();
        return value == GenderFemale.nameLower || value == GenderFemale.symboleLower ;
    }    
    /**
     * Returns true of the gender is not equal to `male|m` or `female|f8987`
     * @note this function is case insensitive.
     * @param {string} value 
     */        
    public isSecret(value:string):boolean {
        value = value.toLowerCase();
        return !this.isFemale(value) && !this.isMale(value);
    }        

    /**
     * Converts a gender to a short (M,F,N)
     * @param {string} value 
     * @return {string}
     */
    public convertToShort(value:string):string {

        if(this.isMale(value)) {
            return GenderMale.symboleUpper;
        }

        if(this.isFemale(value)) {
            return GenderFemale.symboleUpper;
        }    
        
        return GenderSecret.symboleUpper;
    }

    /**
     * Converts a gender to a short (Male,Female,)
     * @param {string} value 
     * @return {string}
     */    
    convertToLong(value:string):string {
        if(this.isMale(value)) {
            return GenderMale.name;
        }

        if(this.isFemale(value)) {
            return GenderFemale.name;
        }    
        
        return GenderSecret.name;        
    }
}