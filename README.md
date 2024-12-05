# Ballerz Graph API

Simple Graph API in 2 files.


## worker
[src/index.ts](https://github.com/benyarb/ballerz-graph/blob/main/src/index.ts)

a cloudflare worker in TS that takes a url `https://ballerz.cloud/graphql` and returns data about ballerz that match a query from a [KV store](https://developers.cloudflare.com/kv/)

## data
[data/ballerz.json](https://github.com/benyarb/ballerz-graph/blob/main/data/ballerz.json)

- metadata for all ~10k Ballerz
- normalized from onchain/gaia/rayvin/community sheets
- formatted into a single KV pair to upsert to cloudflare KV store

## run 
`npm run put` to upsert the KV data

## deploy
`wrangler deploy`

## url
URL: [http://ballerz.cloud/graphql](http://ballerz.cloud/graphql)

## example queries

1. Fetch a Single Baller
```graphql
query {
  getBaller(id: 2185) {
    id
    team
    overall
    role
  }
}
```

2. Search with Filters and Pagination
```graphql
query {
  searchBallers(filters: { team: "Flow", overallMin: 75 }, limit: 10, offset: 0) {
    id
    team
    overall
    role
  }
}
```


## example curl

1. Fetch a Single Baller
```bash
curl -X POST https://ballerz.cloud/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getBaller(id: 2185) { id team overall role } }"
  }'
```

2. Search with Filters
```bash
curl -X POST https://ballerz.cloud/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { searchBallers(filters: { team: \"Flow\", overallMin: 75 }, limit: 10, offset: 0) { id team overall role } }"
  }'
```
