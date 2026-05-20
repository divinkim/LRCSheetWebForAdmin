import { io } from "socket.io-client";

const socket = io("https://vps118934.serveur-vps.net:4001", { transports: ['websocket'] });

export default socket;