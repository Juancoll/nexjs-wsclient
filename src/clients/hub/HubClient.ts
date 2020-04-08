import { SimpleEventDispatcher } from 'strongly-typed-events';

import { IWSBase } from '../../base/IWSBase';
import { RestProtocolClient } from '../../base/rest/RestProtocolClient';
import { IWSError } from '../../types/IWSError';

import { IHubResponse } from './messages/IHubResponse';
import { IHubRequest } from './messages/IHubRequest';
import { IHubEventMessage } from './messages/IHubEventMessage';
import { IHubSubscriptionError } from './types/IHubSubscriptionError';

import { HubSubscriptionCollection } from './HubSubscriptionCollection';
import { IRestProtocolResponseError } from '../../base/rest/types/IRestProtocolResponseError';
import { WSApiBase } from '../../WSApiBase';
import { WSClientBase } from '../WSClientBase';

export class HubClient extends WSClientBase {
    //#region [ constants ]
    private PUBLISH_EVENT = '__hub::publish__';
    //#endregion

    //#region [ fields ]
    private _subscriptions = new HubSubscriptionCollection();
    private _restProtocol: RestProtocolClient<IHubRequest, IHubResponse>;
    //#endregion

    //#region [ properties ]
    public get defaultRequestTimeout() { return this.ws.defaultRequestTimeout; }
    public set defaultRequestTimeout(value: number) { this.ws.defaultRequestTimeout = value; }
    //#endregion

    //#region [ events ]
    public onReceive = new SimpleEventDispatcher<IHubEventMessage>();
    public onSubscribed = new SimpleEventDispatcher<IHubRequest>();
    public onSubscriptionError = new SimpleEventDispatcher<IHubSubscriptionError>();
    public onWSError = new SimpleEventDispatcher<IWSError>();
    public onResponseError = new SimpleEventDispatcher<IRestProtocolResponseError<IHubResponse>>();
    //#endregion

    //#region [ constructor ]
    constructor(api: WSApiBase<any, any>, ws: IWSBase) {
        super(api, ws);

        this._restProtocol = new RestProtocolClient<IHubRequest, IHubResponse>(ws, 'hub');
        this._restProtocol.onWSError.sub(x => this.onWSError.dispatch(x));
        this._restProtocol.onResponseError.sub(x => this.onResponseError.dispatch(x));
    }
    //#endregion

    //#region [ public ]
    init() {
        this._restProtocol.init();
        const self = this;
        this.ws.on(self.PUBLISH_EVENT, (publication: IHubEventMessage) => {
            self.onReceive.dispatch(publication);
        });
        this.ws.onReconnected.sub(async () => {
            const authenticateChangeHandle = async (value: boolean) => {
                this.api.auth.onAuthenticateChange.unsub(handle);
                const requests = this._subscriptions.list().concat();
                for (const req of requests) {
                    if (req) {
                        try {
                            await this.subscribe(req.service, req.eventName, req.credentials);
                        } catch (err) {
                            this.onSubscriptionError.dispatch({ request: req, error: err });
                        }
                    }
                }
            };
            const handle = authenticateChangeHandle.bind(this);
            this.api.auth.onAuthenticateChange.sub(handle);
        });
    }
    async subscribe(service: string, event: string, credentials?: any) {
        if (!this.ws.isConnected) {
            throw new Error('ws is not connected');
        }
        const subRequest = {
            service,
            eventName: event,
            credentials,
            method: 'subscribe',
        } as IHubRequest;

        if (this._subscriptions.contains(subRequest)) {
            this._subscriptions.remove(subRequest);
        }

        await this._restProtocol.requestAsync(subRequest);
        this._subscriptions.add(subRequest);
        this.onSubscribed.dispatch(subRequest);
    }
    async unsubscribe(service: string, event: string) {
        if (!this.ws.isConnected) {
            throw new Error('ws is not connected');
        }
        const unsubRequest = {
            service,
            eventName: event,
            method: 'unsubscribe',
        } as IHubRequest;

        if (!this._subscriptions.contains(unsubRequest)) {
            throw new Error('subscription not found');
        }

        await this._restProtocol.requestAsync(unsubRequest);
        this._subscriptions.remove(unsubRequest);
        this.onSubscribed.dispatch(unsubRequest);
    }
    //#endregion
}
