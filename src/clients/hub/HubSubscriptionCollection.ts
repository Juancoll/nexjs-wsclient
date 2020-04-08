import { IHubRequest } from './messages/IHubRequest';

export class HubSubscriptionCollection {
    private _subscriptions = new Array<IHubRequest>();

    contains(req: IHubRequest): boolean {
        const sub = this._subscriptions.find(x => x.service == req.service && x.eventName == req.eventName);
        return sub ? true : false;
    }
    add(req: IHubRequest): void {
        if (this.contains(req)) {
            throw new Error(`[HubSubscriptionCollection] already exists`);
        }
        this._subscriptions.push(req);
    }
    remove(req: IHubRequest) {
        if (!this.contains(req)) {
            throw new Error('[HubSubscriptionCollection] not found');
        }

        const item = this.get(req);
        this._subscriptions = this._subscriptions.filter(x => x != item);
    }
    update(req: IHubRequest) {
        if (!this.contains(req)) {
            throw new Error('[HubSubscriptionCollection] not found');
        }

        this.get(req).credentials = req.credentials;
    }
    list(): IHubRequest[] {
        return this._subscriptions;
    }
    get(req: IHubRequest): IHubRequest {
        if (!this.contains(req)) {
            throw new Error('[HubSubscriptionCollection] not found');
        }
        return this._subscriptions.find(x => x.service == req.service && x.eventName == req.eventName) as IHubRequest;
    }
}
