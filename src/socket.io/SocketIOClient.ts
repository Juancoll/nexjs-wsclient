import { SimpleEventDispatcher, SignalDispatcher } from 'strongly-typed-events';
import * as io from 'socket.io-client';

import { IWSBase } from '../base/IWSBase';
import { IEventData } from '../base/IEventData';
import { IEventError } from '../base/IEventError';
import { INestJSWSException } from '../base/INestJSWSException';
import { SocketIOWildcardPatcher } from './SocketIOWildcardPatcher';

export interface IWSException {
    status: string;
    message: string;
}

export class SocketIOClient implements IWSBase {
    //#region [ fields ]
    private _requestDisconnect: boolean = false;
    private _requestQueue: RequestQueue = new RequestQueue();
    private _socket: SocketIOClient.Socket;
    private _baseUrl: string;
    private _path: string;
    private _nsp: string;
    private _isConnected: boolean = false;
    //#endregion

    //#region [ implement IWSBase]
    public defaultRequestTimeout = 3000;
    public get isConnected() { return this._isConnected; }
    public get id() { return this._socket ? this._socket.id : undefined; }
    public get baseUrl() { return this._baseUrl; }
    public get path() { return this._path; }
    public get nsp() { return this._nsp; }

    public onConnectionChange = new SimpleEventDispatcher<boolean>();
    public onReconnecting = new SimpleEventDispatcher<number>();
    public onReconnected = new SimpleEventDispatcher<number>();
    public onDisconnect = new SignalDispatcher();
    public onSend = new SimpleEventDispatcher<IEventData>();
    public onReceive = new SimpleEventDispatcher<IEventData>();
    public onNewSocketInstance = new SignalDispatcher();
    public onSubscriptionError = new SimpleEventDispatcher<IEventError>();
    public onNestJSException = new SimpleEventDispatcher<INestJSWSException>();

    public connect(baseUrl: string, path: string, nsp: string): void {
        this._baseUrl = baseUrl;
        this._path = path;
        this._nsp = nsp;

        const options: SocketIOClient.ConnectOpts = { path: this.path };
        const url = `${baseUrl}${nsp}`;

        if (this._socket != null) {
            this._socket.disconnect();
        }
        this._socket = io(url, options);

        // add wild card to socket-io events
        SocketIOWildcardPatcher.Patch(this._socket);

        const self = this;
        this._socket
            .on('connect', () => {
                this._isConnected = true;
                self.onConnectionChange.dispatch(true);
            })
            .on('disconnect', (reason: any) => {
                this._isConnected = false;
                self.onConnectionChange.dispatch(false);
                if (this._requestDisconnect) {
                    this._requestDisconnect = false;
                    this.onDisconnect.dispatch();
                }
            })
            .on('reconnecting', (count: number) => {
                self.onReconnecting.dispatch(count);
            })
            .on('reconnect', (count: number) => {
                this._isConnected = true;
                self.onReconnected.dispatch(count);
            })
            .on('exception', (err: INestJSWSException) => {
                self.onNestJSException.dispatch(err);
            })
            .on('*', (data: IEventData) => {
                self.onReceive.dispatch(data);
                if (this._requestQueue.contains(data.event)) {
                    this._requestQueue.receive(data.event, data.data);
                }
            });

        this.onNewSocketInstance.dispatch();
    }
    public async connectAsync(baseUrl: string, path: string, nsp: string): Promise<void> {
        this.connect(baseUrl, path, nsp);
        const timeout = 5000;
        const startTime = new Date().getTime();
        let time = 0;
        while (!this._isConnected && time < timeout) {
            await this.wait(16);
            time = new Date().getTime() - startTime;
        }
        if (time >= timeout) {
            throw new Error(`timeout. elapsed time = ${time} millis`);
        }
    }
    public disconnect(): void {
        this._requestDisconnect = true;
        this._socket.disconnect();
    }
    public on(event: string, action: (data: any) => void): IWSBase {
        this._socket.on(event, (data: any) => {
            try {
                action(data);
            } catch (err) {
                this.onSubscriptionError.dispatch({
                    event,
                    error: err.message,
                });
            }
        });
        return this;
    }
    public emit(event: string, data?: any) {
        this._socket.emit(event, data);
        this.onSend.dispatch({ event, data });
    }
    public async requestAsync<T = void>(event: string, data: any, timeout?: number | undefined): Promise<T> {
        if (!this._socket || this._socket.disconnected) {
            throw new Error('websocket not connected');
        }
        if (this._requestQueue.contains(event)) {
            throw new Error(`RequestQueue already contains request ${event}`);
        }

        this._requestQueue.add(event);
        this._socket.emit(event, data);

        const timeoutSpan = !timeout || timeout == 0
            ? this.defaultRequestTimeout
            : timeout;

        const startTime = new Date().getTime();
        let time = 0;

        while (!this._requestQueue.isDone(event) && time < timeoutSpan) {
            await this.wait(16);
            time = new Date().getTime() - startTime;
        }

        const responseData = this._requestQueue.dequeue(event);
        if (time >= timeoutSpan) {
            throw new Error(`timeout. elapsed time = ${time} millis`);
        }

        return responseData;
    }
    //#endregion

    //#region [ private ]
    private wait(millis: number = 1000): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => { resolve(); }, millis);
        });
    }
    //#endregion
}

interface IRequestQueueRequest {
    done: boolean;
    responseData: any;
}

// tslint:disable-next-line: max-classes-per-file
class RequestQueue {
    //#region  [ fields ]
    private _requests: { [event: string]: IRequestQueueRequest } = {};
    //#endregion

    //#region [ public ]
    public contains(event: string): boolean {
        return this._requests[event] ? true : false;
    }
    public add(event: string): void {
        if (this.contains(event)) {
            throw new Error(`RequestQueue already contains event '${event}'`);
        }
        this._requests[event] = {
            done: false,
            responseData: undefined,
        };
    }
    public isDone(event: string): boolean {
        if (!this.contains(event)) {
            throw new Error(`RequestQueue not contains event '${event}'`);
        }
        return this._requests[event].done;
    }
    public receive(event: string, data: any): void {
        if (!this.contains(event)) {
            throw new Error(`RequestQueue not contains event '${event}'`);
        }

        this._requests[event].done = true;
        this._requests[event].responseData = data;
    }
    dequeue(event: string): any {
        if (!this.contains(event)) {
            throw new Error(`RequestQueue not contains event '${event}'`);
        }
        const data = this._requests[event].responseData;
        delete this._requests[event];
        return data;
    }
    //#endregion
}
