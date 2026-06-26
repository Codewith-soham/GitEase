import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import { app } from "./src/app.js";
import connectDB from "./src/config/db.config.js";

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect  to the database", err);
  });
