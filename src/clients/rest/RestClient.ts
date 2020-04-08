import { SimpleEventDispatcher } from 'strongly-typed-events';

import { IWSBase } from '../../base/IWSBase';

import { IRestResponse } from './messages/IRestResponse';
import { IRestRequest } from './messages/IRestRequest';
import { IWSError } from '../../types/IWSError';
import { RestProtocolClient } from '../../base/rest/RestProtocolClient';
import { IRestProtocolResponseError } from '../../base/rest/types/IRestProtocolResponseError';
import { WSClientBase } from '../WSClientBase';
import { WSApiBase } from '../../WSApiBase';

export class RestClient extends WSClientBase {
    //#region [ fields ]
    private _restProtocol: RestProtocolClient<IRestRequest, IRestResponse>;
    //#endregion

    //#region [ properties ]
    public get defaultRequestTimeout() { return this.ws.defaultRequestTimeout; }
    public set defaultRequestTimeout(value: number) { this.ws.defaultRequestTimeout = value; }
    //#endregion

    //#region [events]
    public onWSError = new SimpleEventDispatcher<IWSError>();
    public onResponseError = new SimpleEventDispatcher<IRestProtocolResponseError<IRestResponse>>();
    //#endregion

    //#region [ constructor ]
    constructor(api: WSApiBase<any, any>, ws: IWSBase) {
        super(api, ws);

        this._restProtocol = new RestProtocolClient<IRestRequest, IRestResponse>(ws, 'rest');
        this._restProtocol.onWSError.sub(x => this.onWSError.dispatch(x));
        this._restProtocol.onResponseError.sub(x => this.onResponseError.dispatch(x));
    }
    //#endregion

    //#region [ public ]
    init() {
        this._restProtocol.init();
    }
    public requestAsync<T = void>(req: IRestRequest, timeout?: number): Promise<T> {
        return this._restProtocol.requestAsync(req, timeout);
    }
    //#endregion
}
