import { SimpleEventDispatcher, SignalDispatcher } from 'strongly-typed-events';

import { IEventError } from './IEventError';
import { IEventData } from './IEventData';
import { INestJSWSException } from './INestJSWSException';

export interface IWSBase {
    //#region  [ properies ]
    readonly id: string | undefined;
    defaultRequestTimeout: number;
    readonly isConnected: boolean;
    readonly baseUrl: string | undefined;
    readonly path: string | undefined;
    readonly nsp: string | undefined;
    //#endregion

    //#region  [ events ]
    onConnectionChange: SimpleEventDispatcher<boolean>;
    onReconnecting: SimpleEventDispatcher<number>;
    onReconnected: SimpleEventDispatcher<number>;
    onDisconnect: SignalDispatcher;
    onSend: SimpleEventDispatcher<IEventData>;
    onReceive: SimpleEventDispatcher<IEventData>;
    onNewSocketInstance: SignalDispatcher;
    onSubscriptionError: SimpleEventDispatcher<IEventError>;
    onNestJSException: SimpleEventDispatcher<INestJSWSException>;
    //#endregion

    //#region  [ methods ]
    connect(baseUrl: string, path: string, nsp: string): void;
    connectAsync(baseUrl: string, path: string, nsp: string): Promise<void>;
    disconnect(): void;

    on(event: string, action: (data: any) => void): IWSBase;
    emit(event: string, data?: any): void;

    requestAsync<T = void>(event: string, data?: any, timeout?: number): Promise<T>;
    //#endregion
}
