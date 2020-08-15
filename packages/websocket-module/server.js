const { createServer: http } = require("http");
const { createServer } = require("./dist");
const redis = require("ioredis");

const httpServer = http();
const redissettings = { host: "172.17.0.2", port: 6379 };

const port = Number(process.argv[2] || 3000);

const io = createServer(httpServer, {
  redis: {
    pubClient: new redis(redissettings),
    subClient: new redis(redissettings),
  },
  broadcastedEvents: ["position"],
});

const positions = {};

io.nodes.on("position", ({ socketId, data }) => {
  console.log("from another node");

  if (positions[socketId]) {
    positions[socketId].push(data);
    return;
  }
  positions[socketId] = [data];
});

io.on("connection", (socket) => {
  console.log("client connected", socket.id);

  positions[socket.id] = [];

  socket.on("position", (id) => {
    console.log("from self node");
    positions[socket.id].push(id);
  });
});

setInterval(() => {
  console.log("positions", positions);
}, 3000);

httpServer.listen(port);
console.log("listening", port);
