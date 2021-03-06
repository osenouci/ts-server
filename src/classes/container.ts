import { DatabaseConnections } from "./utilities/database-connections";
import { EmailConnector } from './connectors/email-connector';


export class Container {

    protected utilities  :any;
    protected models     :any;
    protected connections:DatabaseConnections;

    protected _emailConnector:EmailConnector;

    constructor(){
        this.connections     = new DatabaseConnections();
        this._emailConnector = new EmailConnector();
    }

    /**
     * ###################################################################
     *  Get connectors
     * ###################################################################
     */
    get emailConnector():EmailConnector {
        return this._emailConnector;
    }    
    /**
     * ###################################################################
     *  Set the database connections
     * ###################################################################
     */
    set mongooseConnection(value:any) {
        this.connections.mongoose = value;
    }
    set neo4jConnection(value:any) {
        this.connections.neo4j = value;
    }    

    /**
     * ###################################################################
     *  Getters
     * ###################################################################
     */
    /**
     * Returns a set of utilities
     */    
    public get utility():any {
        return this.utilities;
    }
    /**
     * Returns the model collection.
     */    
    public get model():any {
        return this.models;
    }
    /**
     * Returns the connection set. It contains one or more database connections.
     */    
    public get connection():any {
        return this.connections;
    }

    public getMongoConnection():any{
        return global["connections"].mongo;
    }
}