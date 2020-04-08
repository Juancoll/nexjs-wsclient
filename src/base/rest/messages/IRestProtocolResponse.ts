import { IWSError } from '../../../types/IWSError';

export interface IRestProtocolResponse<TResponse> {
    id: string;
    module: string;
    data: TResponse;
    isSuccess: boolean;
    error?: IWSError;

}
