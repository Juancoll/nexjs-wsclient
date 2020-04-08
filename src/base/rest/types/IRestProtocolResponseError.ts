import { IRestProtocolResponse } from '../messages/IRestProtocolResponse';

export interface IRestProtocolResponseError<TResponse> {
    response: IRestProtocolResponse<TResponse>;
    error: string;
}
