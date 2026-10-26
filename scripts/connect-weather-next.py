#!/usr/bin/env python3
"""Authorize the existing personal WeatherNext account and store its credential in Vercel.

Run in Google Cloud Shell. Secrets travel through subprocess stdin, never arguments,
Git, or chat. This script targets only the existing Mountain Weather production app.
"""
import argparse
import json
import pathlib
import shutil
import subprocess
import sys
import urllib.error
import urllib.request

PROJECT = "mountain-weather-512523"
VERCEL_PROJECT = "prj_tAgUgEjs0zSQnNwnL7FJDsY0YDTV"
TEAM = "rorys-projects-2b98f0be"
CLI = ["npx", "--yes", "vercel@65.3.1"]
COLLECTION = "projects/gcp-public-data-weathernext/assets/weathernext_3_0_0_0p1deg"

def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--no-redeploy", action="store_true", help="Store the credential without redeploying.")
    args = parser.parse_args()
    if not shutil.which("gcloud") or not shutil.which("npx"):
        sys.exit("Run this script in Google Cloud Shell, which includes gcloud and Node.js.")
    print("Use oconnellr@gmail.com, the account already approved for WeatherNext.")
    print("Authorize Google application-default credentials when the browser login opens.", flush=True)
    run(["gcloud", "auth", "application-default", "login", "--no-launch-browser",
         "--scopes=https://www.googleapis.com/auth/cloud-platform"])
    run(["gcloud", "auth", "application-default", "set-quota-project", PROJECT])
    credential_path = pathlib.Path.home() / ".config/gcloud/application_default_credentials.json"
    credential = json.loads(credential_path.read_text())
    if credential.get("type") != "authorized_user" or not credential.get("refresh_token"):
        sys.exit("Google did not create a refreshable user credential. Nothing was sent to Vercel.")
    token = run(["gcloud", "auth", "application-default", "print-access-token"],
                capture_output=True, text=True).stdout.strip()
    request = urllib.request.Request(
        "https://earthengine.googleapis.com/v1/" + COLLECTION,
        headers={"Authorization": "Bearer " + token, "x-goog-user-project": PROJECT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status != 200:
                sys.exit("The Google account could not read WeatherNext. Nothing was sent to Vercel.")
    except urllib.error.HTTPError as error:
        sys.exit("Google denied the WeatherNext access check (HTTP " + str(error.code) +
                 "). Sign in with the approved account. Nothing was sent to Vercel.")
    print("Google WeatherNext access verified. Connecting the existing Vercel app.", flush=True)
    if subprocess.run(CLI + ["whoami"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
        run(CLI + ["login"])
    # The CLI sends secret values from stdin; they are never command-line arguments.
    values = {
        "GOOGLE_CREDENTIALS_JSON": json.dumps(credential),
        "GCP_PROJECT_ID": PROJECT,
        "WEATHERNEXT_ENABLED": "true",
        "WEATHERNEXT_ACCESS_MODE": "private",
    }
    for key, value in values.items():
        command = CLI + ["env", "add", key, "--environment", "production", "--yes", "--force",
                         "--project", VERCEL_PROJECT, "--scope", TEAM]
        command.append("--sensitive" if key == "GOOGLE_CREDENTIALS_JSON" else "--no-sensitive")
        # Suppress CLI output for the secret-bearing command, including unexpected error echoes.
        result = subprocess.run(command, input=value + "\n", text=True, capture_output=True)
        if result.returncode:
            sys.exit("Vercel could not save " + key + ". No secret has been printed. Check team access and rerun.")
    print("WeatherNext Google authorization saved directly in Vercel.", flush=True)
    if not args.no_redeploy:
        run(CLI + ["redeploy", "https://mountain-weather-window.vercel.app",
                   "--environment", "production", "--scope", TEAM])
        print("Open the Mountain Weather app and check the WeatherNext status and run time.")
    else:
        print("Redeploy production to load the new environment variables.")

if __name__ == "__main__":
    main()
