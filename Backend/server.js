const mongoose = require("mongoose");
const { createApp } = require("./src/app");
const config = require("./src/config");

mongoose.connect(config.mongoUri).then(() => createApp().listen(config.port, () => console.log(`DepLens API listening on ${config.port}`))).catch((error) => { console.error("MongoDB connection failed", error); process.exit(1); });
