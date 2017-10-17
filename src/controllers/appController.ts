import { ApiResponse } from './../classes/api-reponse';
import { Container } from './../config/container';

export class AppController {

    protected container:Container;

    constructor(container:Container) {
        this.container = container;
    }

    configurePublicRoutes   (app) {
        //console.log("in AppController::configurePublicRoutes()");
    }
    configureProtectedRoutes(app) {
        //console.log("in AppController::configureProtectedRoutes()");
    }    
    configureAdminRoutes    (app) {
        //console.log("in AppController::configureAdminRoutes()");
    } 
}