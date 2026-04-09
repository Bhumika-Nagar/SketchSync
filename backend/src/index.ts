import express from "express";
import cors from "cors";
import http from "http";
import { initWebSocket } from "./ws";

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
initWebSocket(server);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});