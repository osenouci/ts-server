/**
 * Define contants
 * ###############################################################################
 */
const mongoConnectionString = `mongodb://mongo:27017/auth`;
import { Config } from './config/config';

/**
 * Import modules
 * ###############################################################################
 */
import { Server             } from './server';
import { MongoDbConnector   } from './database-connections/mongodb-connector';

import { Container  } from './classes/container';
import { Router     } from './router';

/**
 * Configure the server
 * ###############################################################################
 */
const server = new Server(Config.apiConfig.serverPort);
server.addDBConnector(new MongoDbConnector(Config.dataBaseConfig.mongoConnectionString));

/**
 * Configure the routes
 * ###############################################################################
 */
const container = new Container();
const router    = new Router(server.app, container);
/**
 * Run the server
 * ###############################################################################
 */
(async() => {

    try{

        let connectors = await server.run();     
        global["connections"] = { mongo: connectors[0] };
        container.mongooseConnection = connectors[0];
        
    } catch(err) {

        console.log("Something went wrong while starting the server...");
        console.log(err);
    }

})();