import { io, Socket, Manager } from 'socket.io-client';
import { IEventData } from '../base/IEventData';

export class SocketIOWildcardPatcher {
    public static Patch(socket: Socket) {
        const emit = Manager.prototype.emit;

        function onevent_hook(this: Socket, packet: any) {
            const args = packet.data || [];
            if (packet.id != null) {
                args.push((this as any).ack(packet.id));
            }
            if (Array.isArray(args) && args.length == 2) {
                emit.call(this, '*', {
                    event: args[0],
                    data: args[1],
                } as IEventData);
            }
            return emit.apply(this, args);
        }

        (socket as any).onevent = onevent_hook;
    }
}
