import * as path from "path";

export class Directories {

    public root:string;


    constructor(){
        this.root = path.dirname(require.main.filename);
    }


}