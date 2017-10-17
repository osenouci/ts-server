import { DatabaseConnector } from './database-connector';
import * as mongoose from "mongoose";


export class MongoDbConnector implements DatabaseConnector {

    _isConnected:boolean = false;
    _connection :any     = null;

    connectionString:string;

    constructor(connectionString:string){
        this.connectionString = connectionString;
    }

    connect():Promise<any> {

        return new Promise((resolve, reject) => {

            if(this._isConnected == true) {
                resolve(this._connection);
                return;
            }

            console.log("Connecting to mongo db on " + this.connectionString);

            // Connect to mongoose
            mongoose.connect(this.connectionString);
            this._connection = mongoose.connection;

            this.connection.on('connected', () => {  
                resolve({connection: this._connection, mongoose});
            });

            this.connection.on('disconnected',  () => {  
                this.onConnectionLost('Mongoose default connection disconnected'); 
                reject();
            });

            this.connection.on('error', err => {                
                this.onConnectionLost("An error took place", err);
                reject();
            });
        });
    }

    get isConnected():boolean {
        return this._isConnected;
    }
    get connection():any {
        return this._connection;
    }

    onConnectionLost(message, error = null):void{

        console.log(message);
        
        if(error){
            console.log(error);
        }
    }
}