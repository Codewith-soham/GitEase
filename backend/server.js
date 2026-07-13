import "dotenv/config";
import "./src/config/env.config.js";
import { app } from "./src/app.js";
import connectDB from "./src/config/db.config.js";
import { setupWebSocket } from "./src/config/webScoket.config.js";

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Server is running on ${port}`)
    })
    setupWebSocket(server)
  })
  .catch((err) => {
    console.error("Failed to connect to the database", err)
  })
