import { SimpleEventDispatcher } from 'strongly-typed-events';

import { IWSBase } from '../../base/IWSBase';

import { IAuthResponse } from './messages/IAuthResponse';
import { IAuthRequest } from './messages/IAuthRequest';
import { IWSError } from '../../types/IWSError';
import { RestProtocolClient } from '../../base/rest/RestProtocolClient';
import { IAuthClient } from './types/IAuthClient';
import { IAuthInfo } from './types/IAuthInfo';
import { IRestProtocolResponseError } from '../../base/rest/types/IRestProtocolResponseError';
import { WSClientBase } from '../WSClientBase';
import { WSApiBase } from '../../WSApiBase';

export class AuthClient<TUser, TToken> extends WSClientBase implements IAuthClient<TUser, TToken> {
    //#region [ fields ]
    private _isAuthenticate: boolean = false;
    private _authInfo?: IAuthInfo<TUser, TToken>;
    private _restProtocol: RestProtocolClient<IAuthRequest, IAuthResponse>;
    //#endregion

    //#region [ properties ]
    public get isAuthenticate(): boolean { return this._isAuthenticate; }
    public get authInfo(): IAuthInfo<TUser, TToken> | undefined {
        return this._authInfo;
    }
    public get defaultRequestTimeout() { return this.ws.defaultRequestTimeout; }
    public set defaultRequestTimeout(value: number) { this.ws.defaultRequestTimeout = value; }
    //#endregion

    //#region [events]
    public readonly onWSError: SimpleEventDispatcher<IWSError> = new SimpleEventDispatcher<IWSError>();
    public readonly onAuthenticateChange: SimpleEventDispatcher<boolean> = new SimpleEventDispatcher<boolean>();
    public readonly onResponseError: SimpleEventDispatcher<IRestProtocolResponseError<IAuthResponse>> = new SimpleEventDispatcher<IRestProtocolResponseError<IAuthResponse>>();
    //#endregion

    //#region [ constructor ]
    constructor(api: WSApiBase<any, any>, ws: IWSBase) {
        super(api, ws);

        this._restProtocol = new RestProtocolClient<IAuthRequest, IAuthResponse>(ws, 'auth');
        this._restProtocol.onWSError.sub(x => this.onWSError.dispatch(x));
        this._restProtocol.onResponseError.sub(x => this.onResponseError.dispatch(x));
        this.ws.onReconnected.sub(async x => {
            if (this.authInfo) {
                try {
                    await this.authenticate(this.authInfo.token);
                } catch (err) {
                    this.onWSError.dispatch(err);
                }
            } else {
                this.setIsAuthenticate(false);
            }
        });
        this.ws.onDisconnect.sub(() => {
            this._authInfo = undefined;
            this.setIsAuthenticate(false);
        });
    }
    //#endregion

    //#region [ public ]
    init() {
        this._restProtocol.init();
    }
    //#endregion

    //#region [ implements IAuthImplementation  ]
    async register(data: any): Promise<IAuthInfo<TUser, TToken>> {
        if (this._authInfo) {
            throw new Error('logout required');
        }
        this._authInfo = await this._restProtocol.requestAsync({ method: 'register', data });
        if (this._authInfo) {
            this.setIsAuthenticate(true);
            return this._authInfo;
        } else {
            this.setIsAuthenticate(false);
            throw new Error('no auth info');
        }
    }
    async login(data: any): Promise<IAuthInfo<TUser, TToken>> {
        if (this._authInfo) {
            throw new Error('logout required');
        }
        this._authInfo = await this._restProtocol.requestAsync({ method: 'login', data });
        if (this._authInfo) {
            this.setIsAuthenticate(true);
            return this._authInfo;
        } else {
            this.setIsAuthenticate(false);
            throw new Error('no auth info');
        }
    }
    async logout(): Promise<void> {
        await this._restProtocol.requestAsync({ method: 'logout' });
        this._authInfo = undefined;
        this.setIsAuthenticate(false);
    }
    async authenticate(token: TToken): Promise<IAuthInfo<TUser, TToken>> {
        try {
            this._authInfo = await this._restProtocol.requestAsync({ method: 'authenticate', data: token });
            if (this._authInfo) {
                this.setIsAuthenticate(true);
                return this._authInfo;
            } else {
                throw new Error('no auth info');
            }
        } catch (err) {
            this._authInfo = undefined;
            this.setIsAuthenticate(false);
            throw err;
        }
    }
    //#endregion

    //#region [ private ]
    private setIsAuthenticate(value: boolean) {
        this.onAuthenticateChange.dispatch(value);
        this._isAuthenticate = value;
    }
    //#endregion
}
