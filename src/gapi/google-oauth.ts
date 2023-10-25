import { google } from "googleapis";
import dotenv from "dotenv";
import process from "process";
import readline from "readline";

const scopes: string[] = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/forms",
];

async function getRefreshToken() {
  dotenv.config();
  const clientKey = process.env.GAPI_CLIENT_KEY;
  const clientSecret = process.env.GAPI_CLIENT_SECRET;
  const redirectUrl = process.env.GAPI_REDIRECT_URL;

  // Ensure that everything is provided to perform the authentication.
  if (!(clientKey && clientSecret && redirectUrl)) {
    throw new Error("Missing environment parameters!");
  }

  let oauth = new google.auth.OAuth2(clientKey, clientSecret, redirectUrl);
  let terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const url = oauth.generateAuthUrl({
    access_type: "offline",
    scope: scopes
  });
  console.log("Go here to acquire a code: " + url);

  const code = await new Promise<string>((resolve) => {
    terminal.question("Enter the acquired code: ", resolve);
  });

  const tokenResponse = await oauth.getToken(code);
  const tokens = tokenResponse.tokens;
  console.log(`Access Token:\n${tokens.access_token}\n`);
  console.log(`Refresh Token:\n${tokens.refresh_token}\n`);

  if (tokens.expiry_date) {
    console.log(`Expires: ${new Date(tokens.expiry_date)}`);
  }

  process.exit();
}

getRefreshToken();