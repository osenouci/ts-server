export interface DatabaseConnector {

    // Every database connection class must have a method called 
    // connect that return a Promise.
    connect():Promise<any>;
}