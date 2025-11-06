#!/usr/bin/env bash
# upload_secret.sh
# Usage: upload_secret.sh -k <pem key file> -h <hostname> -s <service> -e <unsplash_key>
# This writes a small secret.json into services/<service>/secret.json on the remote host
# and sets safe file permissions. It does NOT change deployService.sh.

while getopts k:h:s:e: flag
do
    case "${flag}" in
        k) keyfile=${OPTARG};;
        h) hostname=${OPTARG};;
        s) service=${OPTARG};;
        e) unsplash=${OPTARG};;
    esac
done

if [[ -z "$keyfile" || -z "$hostname" || -z "$service" || -z "$unsplash" ]]; then
    echo "Missing required parameter."
    echo "syntax: upload_secret.sh -k <pem key file> -h <hostname> -s <service> -e <UNSPLASH_KEY>"
    exit 1
fi

echo "Uploading secret to $hostname for service $service"

ssh -i "$keyfile" ubuntu@$hostname "mkdir -p services/${service} && cat > services/${service}/secret.json << 'EOF'
{ "UNSPLASH_KEY": "${unsplash}" }
EOF
chmod 600 services/${service}/secret.json || true
"

echo "Done. You may need to restart the service on the server (pm2 restart or via your deploy flow)."
