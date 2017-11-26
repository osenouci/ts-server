//  Include classes
// ###################################################################
import { AppController } from './app.controller';
import { Container } from './../classes/container';
import { ApiResponse } from './../classes/utilities/api-reponse';

import { UserProfileManager } from './../services/user-manager.profile';

//  Include modules
// ###################################################################
import * as express from "express";

//  Define the controller
// ###################################################################
export class ProfileController extends AppController {

    protected userProfileManager: UserProfileManager = new UserProfileManager();

    constructor(container: Container) {
        super(container);
    }

    /**
     * Configure routes
     * #############################################################
     */
    configureRoutes(app: express.Application) {

        // Account creation routes
        app.post("/profile/banner", this.updateBannerPhoto.bind(this));
        app.post("/profile/photo", this.updateProfilePhoto.bind(this));

    }


    protected async updateProfilePhoto(req: express.Request, res: express.Response) {

        const response: ApiResponse = new ApiResponse();

        try {
            const userId = req.body.userId;
            const photoURL = req.body.photoURL;

            console.log("Got a profile photo update request", userId, photoURL);

            await this.userProfileManager.updateUserProfilePhoto(userId, photoURL);

        } catch (err) {
            response.error = err;
        }

        res.json(response.json);
    }
    protected async updateBannerPhoto(req: express.Request, res: express.Response) {

        const response: ApiResponse = new ApiResponse();

        try {

            const userId = req.body.userId;
            const photoURL = req.body.photoURL;

            console.log("Got a profile banner update request", userId, photoURL);

            await this.userProfileManager.updateUserBannerPhoto(userId, photoURL);

        } catch (err) {
            response.error = err;
        }

        res.json(response.json);
    }



}