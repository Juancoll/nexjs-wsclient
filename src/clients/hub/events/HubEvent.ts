import { SimpleEventDispatcher } from 'strongly-typed-events'

import { HubClient } from '../HubClient'

export class HubEvent {
    //#region [ fields ]
    private _hub: HubClient;
    private _actions: Array<()=> void | Promise<void>> = [];
    //#endregion

    //#region [ properties ]
    public service: string;
    public event: string;
    public onError = new SimpleEventDispatcher<Error>();
    //#endregion
    constructor ( hub: HubClient, service: string, event: string ) {
        this._hub = hub
        this.service = service
        this.event = event
        hub.onReceive.sub( async publication => {
            if ( publication.service == service && publication.eventName == event ) {
                for ( const action of this._actions ) {
                    if ( action ) {
                        try {
                            const result = action()
                            if ( ( result as any ).then ) {
                                await result
                            }
                        } catch ( err ) {
                            this.onError.dispatch( err )
                        }
                    }
                }
            }
        } )
    }

    on ( action: ()=> void | Promise<void> ): HubEvent {
        this._actions.push( action )
        return this
    }
    off (): HubEvent {
        this._actions = []
        return this
    }
    subscribe (): Promise<void> {
        return this._hub.subscribe( this.service, this.event, null )
    }
    unsubscribe (): Promise<void> {
        return this._hub.unsubscribe( this.service, this.event )
    }

    sub (): Promise<void>{
        return this.subscribe()
    }
    unsub (): Promise<void> {
        return this.unsubscribe()
    }
}
