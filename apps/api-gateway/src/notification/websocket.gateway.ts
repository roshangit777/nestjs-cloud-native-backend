import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import * as jwt from "jsonwebtoken";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      console.log("❌ Client rejected (no token)");
      client.disconnect();
      return;
    }

    try {
      const secret = "jwtsecret";
      const decoded: any = jwt.verify(token, 
        secret,
      );

      // Assign socket to user-specific room
      client.join(`user_${decoded.sub}`);

      console.log(`✅ User ${decoded.sub} connected → room: user_${decoded.sub}`);
    } catch (err) {
      console.log("❌ Invalid token");
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log("🔌 Client disconnected:", client.id);
  }

  sendToUser(userId: number, payload: any) {
    this.server.to(`user_${userId}`).emit("notification", payload);
  }
}
