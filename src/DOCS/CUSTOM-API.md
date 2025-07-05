# Custom streaming API Documentation

## This document describes the custom streaming API to be used for the custom streaming service source in the app

## The API is designed to be simple and easy to use, with a focus on providing a consistent and reliable experience for users

BASE_URL = "<https://tmdb-embed-api.vercel.app/>"

### Endpoints

The API provides the following endpoints:

- `/movie/2embed/{id}`: Get movie details by ID.
- `/tv/2embed/{id}?s={season}&e={episode}`: Get TV show details by ID.

## Example Usage

> Example for movie: <https://tmdb-embed-api.vercel.app/movie/2embed/696506>

Response:

```json
[
{
"source": {
"provider": "2Embed/Swish",
"files": [
{
"file": "https://tcnciokxad.cdn-centaurus.com/hls2/01/09400/oqg4gbqelm38_n/index-v1-a1.m3u8?t=0AZdP4SqG8aEWpHSxZoFBsmFPMViq2hkpOPimlddPxo&s=1744589874&e=129600&f=47022173&srv=kvh8fa28Sb&i=0.4&sp=500&p1=kvh8fa28Sb&p2=kvh8fa28Sb&asn=14618%22,%22hls4%22:%22/stream/EfuMwHpoKi8w8lxXiytCPQ/kjhhiuahiuhgihdf/1744633074/47004712/master.m3u8",
"type": "hls",
"quality": "720p",
"lang": "en"
}
],
"subtitles": [],
"headers": {
"Referer": "https://uqloads.xyz",
"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
"Origin": "https://uqloads.xyz"
}
}
}
]

```json

> Example for TV show: <https://tmdb-embed-api.vercel.app/tv/2embed/123456?s=1&e=1>

Response:
  
  ```json
  [
{
"source": {
"provider": "2Embed/Player4u",
"files": [
{
"file": "https://62lcxnbxr456.premilkyway.com/hls2/01/01441/jdjl8ekm5v7o_x/index-v1-a1.m3u8?t=QTwOzsDme7CdH8Y3ZTlMW7N-o33OmV3quzUPEjjBGLg&s=1744809910&e=129600&f=7208931&srv=jgy4rdrj5btf&i=0.4&sp=500&p1=jgy4rdrj5btf&p2=jgy4rdrj5btf&asn=14618",
"type": "hls",
"quality": "1072p",
"lang": "en"
}
],
"subtitles": [],
"headers": {
"Referer": "https://uqloads.xyz",
"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
"Origin": "https://uqloads.xyz"
}
}
}
]
```json

> We are going to use the above API to get the streaming links for movies and TV shows.
> The API returns a JSON response with the streaming links and other details.
> The response contains the following fields:
> - `file`: The URL of the streaming link.
> - `type`: The type of the streaming link.
> - `quality`: The quality of the streaming link.
> - `lang`: The language of the streaming link.
> - `provider`: The source of the streaming link. 


