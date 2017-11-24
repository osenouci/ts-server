import { Container         } from "./classes/container";
import { StatusCodes       } from './classes/utilities/statusCodes';
import { ApiResponse       } from './classes/utilities/api-reponse';

import { AppController     } from "./controllers/app.controller";
import { AccountController } from "./controllers/account.controller";
import { PasswordController} from "./controllers/password.controller";
import { TokenController   } from "./controllers/token.controller";
import { LoginController   } from "./controllers/login.controller";



import * as express from "express";

export class Router {

    protected controllers:Array<AppController> = new Array();

    constructor(private app:express.Application, private container:Container) {
        this.initControllers();
        this.configureRoutes();
    }

    initControllers() {
		this.controllers.push(new AccountController (this.container));
		this.controllers.push(new PasswordController(this.container));
		this.controllers.push(new TokenController   (this.container));
		this.controllers.push(new LoginController   (this.container));
    }
    configureRoutes() {

		// Optional perform pre-processing of the request
		this.app.all("*", (req, res, next) => {
			next();
		});

		// Configure public routes for all the controllers.
		for(let i = 0; i < this.controllers.length;i++) {
			this.controllers[i].configureRoutes(this.app);
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