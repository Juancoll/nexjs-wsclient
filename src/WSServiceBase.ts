import { RestClient } from './clients/rest/RestClient';
import { HubClient } from './clients/hub/HubClient';

export abstract class WSServiceBase {
    //#region [ abstract ]
    public abstract name: string;
    //#endregion

    //#region [ private ]
    protected readonly _rest: RestClient;
    protected readonly _hub: HubClient;
    //#endregion

    //#region [ constructor ]
    constructor(rest: RestClient, hub: HubClient) {
        this._rest = rest;
        this._hub = hub;
    }
    //#endregion

    //#region  [ protected ]
    protected request<T = void>(method: string, data: any, credentials: any, timeout?: number) {
        return this._rest.requestAsync<T>(
            {
                service: this.name,
                method,
                data,
                credentials,
            },
            timeout,
        );
    }
    //#endregion
}
