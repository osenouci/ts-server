import { Container         } from "./container";
import { StatusCodes       } from './../classes/statusCodes';
import { ApiResponse       } from './../classes/api-reponse';
import { AppController     } from "./../controllers/appController";
import { HelloController } from "./../controllers/hello-controller";

import * as express from "express";

export class Router {

    protected controllers:Array<AppController>;

    constructor(private app:express.Application, private container:Container) {
        this.controllers = new Array();

        this.initControllers();
        this.configureRoutes();
    }

    initControllers(){
        this.controllers.push(new HelloController(this.container));
    }
    configureRoutes() {

		// Optional perform pre-processing of the request
		this.app.all("*", (req, res, next) => {
			next();
		});

		// Configure public routes
		for(let i = 0; i < this.controllers.length;i++) {
			this.controllers[i].configurePublicRoutes(this.app);
		}

		// Configure private routes
		//app.all("*", this.AuthController.verifyJWT.bind(this.AuthController));	// The following methods require a valid token to be accessed
		for(let i = 0; i < this.controllers.length;i++) {
			this.controllers[i].configureProtectedRoutes(this.app);
		}

		// Configure admin routes
		//app.all("/admin/*", this.AuthController.adminAccessOnly.bind(this.AuthController));	// Add security checks for the admin calls
		for(let i = 0; i < this.controllers.length;i++) {
			this.controllers[i].configureAdminRoutes(this.app);
		}

		this.configureErrorHandling(this.app);		
    }

	configureErrorHandling(app) {

		app.use((err, req, res, next) => {
			if(res && !res.headersSent){

                let response = new ApiResponse();
                response.error = "An error occured. Currently, your request cannot be proccessed.";

		  		res
				  .status(StatusCodes.METHOD_NOT_ALLOWED)
				  .json(response.json);
		  	}
		});
	}    
}