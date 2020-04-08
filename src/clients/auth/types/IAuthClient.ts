import { SimpleEventDispatcher } from 'strongly-typed-events';
import { IAuthInfo } from './IAuthInfo';

export interface IAuthClient<TUser, TToken> {
    authInfo: IAuthInfo<TUser, TToken> | undefined;
    onAuthenticateChange: SimpleEventDispatcher<boolean>;

    register(data: any): Promise<IAuthInfo<TUser, TToken>>;
    login(data: any): Promise<IAuthInfo<TUser, TToken>>;
    logout(): Promise<void>;
    authenticate(token: TToken): Promise<IAuthInfo<TUser, TToken>>;
}
