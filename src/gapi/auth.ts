import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

var _authClient: OAuth2Client | undefined = undefined;

export function setGApiAuthentication(
  clientId: string,
  clientSecret: string,
  refreshToken: string
) {
    _authClient = new google.auth.OAuth2(clientId, clientSecret, refreshToken)
    _authClient.setCredentials({
        refresh_token: refreshToken
    })
}

export function getGApiAuthentication() {
    if (!_authClient) throw new Error("No credentials have been set!")
    return _authClient;
}