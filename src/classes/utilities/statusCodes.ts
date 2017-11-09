export class StatusCodes {
    public static OK                        :number = 200; 
    public static CREATED                   :number = 201;
    public static ACCEPTED                  :number = 202;
    public static NO_CONTENT                :number = 204;
    public static BAD_REQUEST               :number = 400; 
    public static UNAUTHORIZED              :number = 401;
    public static PAYMENT_REQUIRED          :number = 402;
    public static FORBIDDEN                 :number = 403;
    public static NOT_FOUND                 :number = 404; 
    public static METHOD_NOT_ALLOWED        :number = 405;
    public static NOT_ACCEPTABLE            :number = 406;
    public static UNSUPPORTED_MEDIA_TYPE    :number = 415;
    public static TOO_MANY_REQUESTS         :number = 429; 
    public static INTERNAL_SERVER_ERROR     :number = 500;
    public static NOT_IMPLEMENTED           :number = 501;
    public static SERVICE_UNAVAILABLE       :number = 503;
    public static HTTP_VERSION_NOT_SUPPORTED:number = 505; 
}