#!/usr/bin/env bash

set -e
cmd="$@"

echo "Waiting for contract deployed to ganache-cli."
until curl -s -H "Content-Type: application/json" -X POST --data \
    '{"id":1338,"jsonrpc":"2.0","method":"eth_getCode","params":["0xeec918d74c746167564401103096d45bbd494b74", "latest"]}' \
    http://docker.for.mac.host.internal:8545 1> /dev/null;
do
    >&2 echo -n "."
    sleep 1
done

echo "contract has been deployed, operater is started."

exec $cmd