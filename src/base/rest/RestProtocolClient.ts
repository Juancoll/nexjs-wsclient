import { SimpleEventDispatcher } from 'strongly-typed-events';
import { v1 } from 'uuid';

import { IWSBase } from '../IWSBase';
import { IWSError } from '../../types/IWSError';

import { IRestProtocolResponse } from './messages/IRestProtocolResponse';
import { IRestProtocolRequest } from './messages/IRestProtocolRequest';
import { IRestProtocolResponseError } from './types/IRestProtocolResponseError';
import { RestProtocolRequestQueue } from './RestProtocolRequestQueue';

export class RestProtocolClient<TRequest, TResponse> {
    //#region  [ constants ]
    private get REQUEST_EVENT() { return `__${this.name}::restprotocol::request__`; }
    private get RESPONSE_EVENT() { return `__${this.name}::restprotocol::response__`; }
    //#endregion

    //#region [ fields ]
    private _ws: IWSBase;
    private _requestQueue = new RestProtocolRequestQueue<TResponse>();
    //#endregion

    //#region [ properties ]
    public readonly name: string;
    public defaultRequestTimeout = 3000;
    //#endregion

    //#region [events]
    public onResponseError = new SimpleEventDispatcher<IRestProtocolResponseError<TResponse>>();
    public onWSError = new SimpleEventDispatcher<IWSError>();
    //#endregion

    //#region [ constructor ]
    constructor(ws: IWSBase, name: string) {
        this._ws = ws;
        this.name = name;
    }
    //#endregion

    //#region [ public ]
    init() {
        const self = this;
        this._ws.on(this.RESPONSE_EVENT, (res: IRestProtocolResponse<TResponse>) => {
            if (!self._requestQueue.contains(res) || self._requestQueue.isDone(res)) {
                const error = `error with id = ${res.id}. not exists or is done`;
                this.onResponseError.dispatch({ response: res, error });
            } else {
                self._requestQueue.receive(res);
            }
        });
    }
    public async requestAsync(req: TRequest, timeout?: number): Promise<TResponse> {
        if (!this._ws || !this._ws.isConnected) {
            throw new Error('ws is not connected');
        }

        const restReq = {
            id: v1(),
            module: this.name,
            data: req,
        } as IRestProtocolRequest<TRequest>;

        if (this._requestQueue.contains(restReq)) {
            throw new Error(`RequestQueue already contains request id ${restReq.id}`);
        }

        this._requestQueue.add(restReq);
        this._ws.emit(this.REQUEST_EVENT, restReq);

        const timeoutSpan = !timeout || timeout == 0
            ? this.defaultRequestTimeout
            : timeout;

        const startTime = new Date().getTime();
        let time = 0;

        while (!this._requestQueue.isDone(restReq) && time < timeoutSpan) {
            await this.wait(16);
            time = new Date().getTime() - startTime;
        }

        const response = this._requestQueue.dequeue(restReq);

        if (time >= timeoutSpan) {
            throw new Error(`timeout. elapsed time = ${time} millis`);
        }
        if (!response) {
            throw new Error('dequeue a not done request');
        }

        if (!response.isSuccess) {
            if (response.error) {
                this.onWSError.dispatch(response.error);
                throw response.error;
            } else {
                throw new Error('undefined error');
            }
        }

        return response.data;
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
