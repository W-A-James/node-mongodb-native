#!/bin/bash
set -o errexit  # Exit the script with error if any of the commands fail
set -o xtrace   # Write all commands first to stderr

ENVIRONMENT=${ENVIRONMENT:-"aws"}
PROJECT_DIRECTORY=${PROJECT_DIRECTORY:-"."}
source "${PROJECT_DIRECTORY}/.evergreen/init-node-and-npm-env.sh"

if [ "$ENVIRONMENT" = "azure" ]; then
  export UTIL_CLIENT_USER=$OIDC_ADMIN_USER
  export UTIL_CLIENT_PASSWORD=$OIDC_ADMIN_PWD
elif [ "$ENVIRONMENT" = "gcp" ]; then
  export UTIL_CLIENT_USER=$OIDC_ADMIN_USER
  export UTIL_CLIENT_PASSWORD=$OIDC_ADMIN_PWD
else
  export OIDC_TOKEN_DIR=${OIDC_TOKEN_DIR}
  export UTIL_CLIENT_USER="bob"
  export UTIL_CLIENT_PASSWORD="pwd123"
fi

npm run check:oidc-auth