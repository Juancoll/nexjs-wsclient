import { SimpleEventDispatcher } from 'strongly-typed-events';

import { RestClient } from './clients/rest/RestClient';
import { HubClient } from './clients/hub/HubClient';
import { IWSBase } from './base/IWSBase';
import { IWSError } from './types/IWSError';
import { AuthClient } from './clients/auth/AuthClient';

export class WSApiBase<TUser, TToken> {
    //#region [ properties ]
    public readonly auth: AuthClient<TUser, TToken>;
    public readonly rest: RestClient;
    public readonly hub: HubClient;
    public readonly ws: IWSBase;
    //#endregion

    //#region  [ event ]
    public onWSError = new SimpleEventDispatcher<IWSError>();
    //#endregion

    //#region [ constructor ]
    constructor(ws: IWSBase) {
        this.ws = ws;
        this.auth = new AuthClient<TUser, TToken>(this, this.ws);
        this.hub = new HubClient(this, this.ws);
        this.rest = new RestClient(this, this.ws);
        this.ws.onNewSocketInstance.sub(() => {
            this.auth.init();
            this.rest.init();
            this.hub.init();
        });
        const self = this;
        this.auth.onWSError.sub((x) => self.onWSError.dispatch(x));
        this.rest.onWSError.sub((x) => self.onWSError.dispatch(x));
        this.hub.onWSError.sub(x => self.onWSError.dispatch(x));
    }
    //#endregion
}
