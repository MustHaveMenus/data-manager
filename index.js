import cors from "cors";
import express from "express";
import multipart from "connect-multiparty";
import { deconstruct, getPopMenu } from "./service.js";

const app = express();
const multipartMiddleware = multipart();

const port = 3000;

const corsOptions = {
  origin: ["http://localhost:8081/", "http://127.0.0.1:8081/", "https://test.mhmfun.com/", "https://www.musthavemenus.com/"]
}

app.use(express.json());
app.use(express.urlencoded());
app.use(cors(corsOptions));

app.get("/status", (req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.send(true);
});

app.post("/pdf/analyze", multipartMiddleware, async (req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.send(await deconstruct(req.files.file.path));
});

app.get("/pop/menu", async (req, res) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.send(await getPopMenu(req.query.path));
});

app.listen(port, () => {
  console.log(`=> PDF Analyzer started on port ${port}`)
});