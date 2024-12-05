# Ballerz Graph API

Simple Graph API in 2 files.


## worker
[src/index.ts](https://github.com/benyarb/ballerz-graph/blob/main/src/index.ts)

a cloudflare worker in TS that takes a url `https://ballerz.cloud/baller/<id>` and returns data about ballerz `<id>` from a [KV store](https://developers.cloudflare.com/kv/)

## data
[data/ballerz.json](https://github.com/benyarb/ballerz-graph/blob/main/data/ballerz.json)

- metadata for all ~10k Ballerz
- normalized from onchain/gaia/rayvin/community sheets
- formatted into a single KV pair to upsert to cloudflare KV store

## run 
`npm run put` to upsert the KV data
https://github.com/benyarb/ballerz-graph/blob/5208e09c4ab2308be00d02c8e69aa986da6f9e8c/package.json#L6

## deploy
`wrangler deploy`
