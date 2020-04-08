import { IWSBase } from '../base/IWSBase';
import { WSApiBase } from '../WSApiBase';

export abstract class WSClientBase {
    protected readonly ws: IWSBase;
    protected readonly api: WSApiBase<any, any>;

    constructor(api: WSApiBase<any, any>, ws: IWSBase) {
        this.api = api;
        this.ws = ws;
    }
}
