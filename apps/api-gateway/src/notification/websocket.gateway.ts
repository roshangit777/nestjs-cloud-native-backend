import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import * as jwt from "jsonwebtoken";
import { AppLogger } from "apps/common/logger/logger.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly logger: AppLogger) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      console.log("Client rejected (no token)");
      client.disconnect();
      return;
    }

    try {
      const secret = "jwtsecret";
      const decoded: any = jwt.verify(token, secret);

      // Assign socket to user-specific room
      client.join(`user_${decoded.sub}`);

      console.log(`User ${decoded.sub} connected → room: user_${decoded.sub}`);
    } catch (err) {
      console.log("Invalid token");
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log("Client disconnected:", client.id);
  }

  async sendToUser(userId: number, payload: any) {
    const room = `user_${userId}`;

    this.logger.logEvent({
      event: "SEND_NOTIFICATION",
      status: "START",
      userId,
    });

    try {
      const sockets = await this.server.in(room).fetchSockets();

      if (sockets.length === 0) {
        this.logger.logEvent({
          event: "SEND_NOTIFICATION",
          status: "NO_ACTIVE_CONNECTION",
          userId,
        });
        return;
      }

      this.server.to(room).emit("notification", payload);

      this.logger.logEvent({
        event: "SEND_NOTIFICATION",
        status: "SUCCESS",
        userId,
        connections: sockets.length,
      });
    } catch (error) {
      this.logger.errorEvent({
        event: "SEND_NOTIFICATION",
        status: "FAILED",
        userId,
        error: error.message,
        stack: error.stack,
      });
    }
  }
}
