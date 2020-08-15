const io = require("socket.io-client");

const port = Number(process.argv[2] || 3000);

const client = io(`http://localhost:${port}`);

client.on("connect", () => {
  console.log("connected", client.id);

  let id = 0;
  setInterval(() => {
    ++id;
    client.emit("position", id);
  }, 1000);
});
