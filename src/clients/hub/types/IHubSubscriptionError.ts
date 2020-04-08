import { IHubRequest } from '../messages/IHubRequest';

export interface IHubSubscriptionError {
    request: IHubRequest;
    error: any;
}
