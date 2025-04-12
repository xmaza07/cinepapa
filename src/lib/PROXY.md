# Proxy for new CUSTOM API video source

## This proxy is designed to facilitate requests to the custom streaming API, ensuring a seamless experience for users using m3u8 videos

> PROXY_URL = "<https://m3u8proxy.chintanr21.workers.dev/>"

### Usage

#### Example

```javascript
const m3u8url = "https://vz-cea98c59-23c.b-cdn.net/c309129c-27b6-4e43-8254-62a15c77c5ee/842x480/video.m3u8";
const proxyUrl = "https://m3u8proxy.chintanr21.workers.dev/v2";

const proxiedUrl = `${proxyUrl}/v2?url=${encodeURIComponent(m3u8url)}`;

// Alternative Method using URLSearchParams
const searchParams = new URLSearchParams();
searchParams.set("url", m3u8url);

const proxiedUrl2 = `${proxyUrl}/v2?${searchParams.toString()}`;

// Setting headers
searchParams.set("headers", JSON.stringify({
  Range: "bytes=0-500"
}));
```
