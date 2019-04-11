#!/usr/bin/env bash

set -e
cmd="$@"

# not deployed -> result 0x
# deployed -> result 0x........
echo "Waiting for contract deployed to ganache-cli."
while true; do
    res=`curl -s -H "Content-Type: application/json" -X POST --data \
    '{"id":1338,"jsonrpc":"2.0","method":"eth_getCode","params":["0xeec918d74c746167564401103096d45bbd494b74", "latest"]}' \
    ${ROOTCHAIN_ENDPOINT} | jq .result -r | wc -m`
    echo $res
    # length larger than 0x0
    [[ $res -gt 3 ]] && break
    sleep 1
done

echo "contract has been deployed, operater is started."
echo $cmd
$cmd