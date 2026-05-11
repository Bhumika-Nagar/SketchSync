import express from "express";
import cors from "cors";
import router from "./routes/userRoutes";
import http from "http";
import { setupWebSocket } from "./ws";

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());


app.get("/", (req, res) => {
  res.send("Backend is running");
});


app.use("/user", router);
app.listen(5000, () => {
  console.log("HTTP server running on port 5000");
});

setupWebSocket(server);

server.listen(8080, ()=>{
  console.log("websocket server running on port 8080");
});