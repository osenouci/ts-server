//  Include classes
// ###################################################################
import { AppController  } from './appController';
import { Container      } from './../config/container';
import { StatusCodes    } from './../classes/statusCodes';
import { ApiResponse    } from './../classes/api-reponse';

//  Include modules
// ###################################################################
import * as express from "express";

//  Define the controller
// ###################################################################
export class HelloController extends AppController {

    constructor(container:Container) {
        super(container);
    }

    /**
     * Configure routes
     * #############################################################
     */
    configurePublicRoutes(app:express.Application) {
         app.get ("/", this.sayHello.bind(this)  );        
    }

    /**
     * Route functions
     * #############################################################
     */  
    sayHello(req:express.Request, res:express.Response) {
        console.log("IndexerController:indexFromWebsites() -> Got request");
        let response = new ApiResponse();
        response.data = "Hello world";
        res.json(response.json);        
    }
}