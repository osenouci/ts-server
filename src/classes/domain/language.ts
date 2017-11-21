export const LANGUAGE_FRENCH_SHORT  = "FR";
export const LANGUAGE_ENGLISH_SHORT = "EN";
export const LANGUAGE_ARABIC_SHORT  = "AR";
export const LANGUAGE_GERMAN_SHORT  = "DE";
export const LANGUAGE_DUTCH_SHORT   = "NL";

export class Language {


    public convertToShort(value:string):string {

        try{

            if(!value) { return LANGUAGE_ENGLISH_SHORT; }
            value = value.toLowerCase().trim();

            if(this.isFrench(value)) { return LANGUAGE_FRENCH_SHORT; }
            if(this.isGerman(value)) { return LANGUAGE_GERMAN_SHORT; }            
            if(this.isDutch (value)) { return LANGUAGE_DUTCH_SHORT;  }                        
            if(this.isArabic(value)) { return LANGUAGE_ARABIC_SHORT; }                                    

            return LANGUAGE_ENGLISH_SHORT;

        }catch(err){
            return LANGUAGE_ENGLISH_SHORT;
        }
    }

    /**
     * Checks if the parameters represents the French language
     * @param {string} value 
     * @return {boolean}
     */
    isFrench(value:string):boolean {
        value = value.toLowerCase().trim();
        return (value == "français" || value == "fr" || value == "french");
    }
    /**
     * Checks if the parameters represents the Arabic language
     * @param {string} value 
     * @return {boolean}
     */
    isArabic(value:string):boolean {
        value = value.toLowerCase().trim();
        return (value == "العربية" || value == "ar" || value == "arabic");
    }
    /**
     * Checks if the parameters represents the English language
     * @param {string} value 
     * @return {boolean}
     */
    isEnglish(value:string):boolean {
        value = value.toLowerCase().trim();
        return (value == "english" || value == "en");
    }
    /**
     * Checks if the parameters represents the German lanuage
     * @param {string} value 
     * @return {boolean}
     */
    isGerman(value:string):boolean {
        value = value.toLowerCase().trim();
        return (value == "deutsche" || value == "de" || value == "german");
    }        
    /**
     * Checks if the parameters represents the Dutch lanuage
     * @param {string} value 
     * @return {boolean}
     */
    isDutch(value:string):boolean {
        value = value.toLowerCase().trim();
        return (value == "nederlands" || value == "nl" || value == "dutch");
    }
}