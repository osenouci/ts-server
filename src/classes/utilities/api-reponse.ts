export class ApiResponse {

    protected _status:boolean;
    protected _data  :any;
    protected _error :string;

    constructor(){

        this._status = true;
        this._data   = {};
        this._error  = "";
    }

    set data (value:any){
        this._status = true;
        this._data = value;
    }
    set error(value:any){

        this._status = false;

        try{
            if(typeof value != "string") {
                value = JSON.stringify(value);
            }
        }catch(err){
            return;
        }
        this._error = value;
    }
    get jsonString():string {
        return JSON.stringify(this.json);
    }
    get json():any {
        return {
            status: this._status,
            data  : this._data,
            error : this._error
        };
    }
}