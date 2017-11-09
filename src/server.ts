import * as http        from 'http';
import * as path        from 'path';
import * as express     from 'express';
import * as bodyParser  from 'body-parser';
import * as i18n        from 'i18n';

import { DatabaseConnector } from "./database-connections/database-connector"


i18n.configure({
    locales  : ['en', 'fr', 'ar'],
    directory: path.join(__dirname, "local")
});


export class Server {

    public    express: express.Application;
    protected port: number = 80;

    protected connectors:Array<DatabaseConnector> = new Array();

    /**
     * Used to create and configure the express app and returns an instance of the class.
     * It requires to pass it a port to which it will bind the application when we call
     * the Server:run() method.
     * @param port 
     */
    constructor(port?:number){

        if(port) {
            this.port = port;
        }

        this.express = express();
        
        // Configure express
        this.express
        .use(bodyParser.json())
        .use(i18n.init)
        .use(bodyParser.urlencoded({ extended: false }));
    }

    /**
     * Returns the express app.
     */
    public get app():express.Application {
        return this.express;
    }

    /**
     * Adds a database connector to the class. The connector list will be executes before 
     * we start the server when we call the Server:run() method.
     * @param connector 
     */
    public addDBConnector(connector:DatabaseConnector):void {
        this.connectors.push(connector);
    }

    /**
     * Goes through all the connectors and call their connect method.
     * It returns a Promise that returns the list of connections.
     * It also starts the http server.
     * @return {Promise}
     */
    public run(): Promise<any>{

        let promises:Array<Promise<any>> = new Array();

        for(let i = 0; i < this.connectors.length; i++){
            promises.push(this.connectors[i].connect());
        }

        if(promises.length == 0) {
            promises.push(Promise.resolve());
        }

        return new Promise((resolve, reject) => {

            Promise.all(promises)
            .then(connectors => {

                // Use express over http
                http.createServer(this.app)
                    .listen(this.port);		        
                console.log("API - Running on PORT: " + this.port);
                resolve(connectors);
            })
            .catch(reject);
        });
    }
}