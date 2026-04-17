import express from "express";
import cors from "cors";
import router from "./routes/userRoutes";
import "./ws";

const app = express();

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