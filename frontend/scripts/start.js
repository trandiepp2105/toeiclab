const path = require("path");
const dotenv = require("dotenv");

// CRA only loads env files inside frontend/. Load the project-level .env too,
// so `npm start` and Docker Compose use the same Google OAuth configuration.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID) {
  process.env.REACT_APP_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
}

require("react-scripts/scripts/start");
