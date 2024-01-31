const SerialPort = require("serialport");
const WebSocketServer = require("websocket").server;
const express = require("express");
const http = require("http");
const Readline = require("@serialport/parser-readline");

const app = express();
const server = http.createServer(app);
const portSerial = new SerialPort("/dev/cu.usbmodem141101", { baudRate: 9600 });
const parser = portSerial.pipe(new Readline({ delimiter: "\r\n" }));

const cors = require("cors");

app.use(cors());

const wsServer = new WebSocketServer({
  httpServer: server,
  // Caminho para ambas as conexões
  path: "/websocket",
});
//
wsServer.on("request", function (request) {
  if (request.httpRequest.url === "/websocket/construct") {
    const connection = request.accept(null, request.origin);
    console.log("Nova conexão WebSocket para o Construct estabelecida.");

    connection.on("message", function (message) {
      if (message.type === "utf8") {
        const dadosConstruct3 = message.utf8Data;
        console.log("Dados recebidos do Construct 3:", dadosConstruct3);

        // Enviar dados para o Arduino via SerialPort
        portSerial.write(dadosConstruct3, function (err) {
          if (err) {
            return console.log(
              "Erro ao enviar dados para o Arduino:",
              err.message
            );
          }
          console.log("Dados enviados para o Arduino:", dadosConstruct3);
        });
      }
    });
  }
});

// Configuração do WebSocket para o Arduino
wsServer.on("request", function (request) {
  if (request.httpRequest.url === "/websocket/arduino") {
    const connection = request.accept(null, request.origin);
    console.log("Nova conexão WebSocket para o Arduino estabelecida.");
    parser.on("data", (data) => {
      connection.send(data.toString());
    });
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Servidor WebSocket rodando em http://localhost:${port}`);
});
