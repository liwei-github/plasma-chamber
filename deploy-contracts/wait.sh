#!/usr/bin/env bash

set -e

#npm i zmq

echo "Waiting for ganache-cli started."
until curl -s -H "Content-Type: application/json" -X POST --data \
    '{"id":1337,"jsonrpc":"2.0","method":"evm_snapshot","params":[]}' \
    http://docker.for.mac.host.internal:8545 1> /dev/null;
do
    >&2 echo -n "."
    sleep 1
done

echo "ganache-cli is up."

cd packages/contracts && truffle migrate --network ${DEPLOYMENT_TARGET}
#truffle migrate --network $DEPLOYMENT_TARGET
echo "contract has been deployed."