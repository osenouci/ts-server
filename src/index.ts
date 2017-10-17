/**
 * Define contants
 * ###############################################################################
 */
const mongoConnectionString = `mongodb://mongo:27017/auth`;
const PORT = 80;

/**
 * Import modules
 * ###############################################################################
 */
import { Server } from './server';
import { MongoDbConnector } from './database-connections/mongodb-connector';

import { Container } from './config/container';
import { Router } from './config/router';

/**
 * Configure the server
 * ###############################################################################
 */
const server = new Server(PORT);
//server.addDBConnector(new MongoDbConnector(mongoConnectionString));

/**
 * Configure the routes
 * ###############################################################################
 */
const container = new Container();


const router = new Router(server.app, container);

/**
 * Run the server
 * ###############################################################################
 */

(async() => {

    try{
        let connectors = await server.run();
        
        global["connections"] = {
            mongo: connectors[0]
        };

        container.mongooseConnection = connectors[0];

    } catch(err) {

        console.log("Something went wrong while starting the server...");
        console.log(err);
    }

})();