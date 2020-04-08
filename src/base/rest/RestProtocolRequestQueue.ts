import { IRestProtocolResponse } from './messages/IRestProtocolResponse';

interface IRequest<TResponse> {
    done: boolean;
    response?: IRestProtocolResponse<TResponse>;
}

interface IId { id: string; }

export class RestProtocolRequestQueue<TResponse> {
    //#region  [ fields ]
    private _requests: { [id: string]: IRequest<TResponse> } = {};
    //#endregion

    //#region [ public ]
    public contains(res: { id: string }): boolean {
        return this._requests[res.id] ? true : false;
    }
    public add(msg: IId): void {
        const id = msg.id;
        if (this._requests[id]) {
            throw new Error(`[RequestProtocolQueue] already exists id ${id}`);
        }

        this._requests[id] = {
            done: false,
            response: undefined,
        };
    }
    public isDone(msg: IId): boolean {
        const id = msg.id;
        if (!this._requests[id]) {
            throw new Error(`[RequestProtocolQueue] not contains id ${id}`);
        }

        return this._requests[id].done;
    }
    public receive(msg: IRestProtocolResponse<TResponse>): void {
        const id = msg.id;
        if (!this._requests[id]) {
            throw new Error(`[RequestProtocolQueue] not contains id ${id}`);
        }

        this._requests[id].done = true;
        this._requests[id].response = msg;
    }
    public dequeue(msg: IId): IRestProtocolResponse<TResponse> | undefined {
        const id = msg.id;
        if (!this._requests[id]) {
            throw new Error(`[RequestProtocolQueue] not contains id ${id}`);
        }

        const response = this._requests[id].response;
        delete this._requests[id];
        return response;
    }
    //#endregion
}
