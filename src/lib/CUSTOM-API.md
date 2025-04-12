# Custom streaming API Documentation

## This document describes the custom streaming API to be used for the custom streaming service source in the app

## The API is designed to be simple and easy to use, with a focus on providing a consistent and reliable experience for users

BASE_URL = "<https://tmdb-embed-api.vercel.app/>"

### Provider

This API is designed to be used with the TMDB Embed API, which provides a simple and reliable way to access movie and TV show data. The API is designed to be used with the following provider:

PROVIDER are "embedsu" "2embed" "autoembed" "vidsrcsu"

### Endpoints

The API provides the following endpoints:

- `/movie/{id}`: Get movie details by ID.
- `/tv/{id}?s={season}&e={episode}`: Get TV show details by ID.

### Example Usage

<https://tmdb-embed-api.vercel.app/movie/{id}> - Get movie details by ID

Example FOR MOVIE: <https://tmdb-embed-api.vercel.app/movie/696506>

> response:

```json
[
  {
    "source": {
      "provider": "2Embed/Swish",
      "files": [
        {
          "file": "https://tcnciokxad.cdn-centaurus.com/hls2/01/09400/oqg4gbqelm38_n/index-v1-a1.m3u8?t=WQaJuctlAqJ3hsxKLg4YotORZy3aa9sNPB1XhlNhuGI&s=1744411652&e=129600&f=47022173&srv=hptg5oweej5s&i=0.4&sp=500&p1=hptg5oweej5s&p2=hptg5oweej5s&asn=14618%22,%22hls4%22:%22/stream/H_EwQoQ6KpnfozP4L9dA6w/kjhhiuahiuhgihdf/1744454852/47004712/master.m3u8",
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
  },
  {
    "sources": [
      {
        "provider": "EmbedSU",
        "ERROR": [
          {
            "error": "ERROR",
            "what_happened": "Failed to fetch initial page: HTTP 403",
            "report_issue": "https://github.com/Inside4ndroid/vidsrc-api-js/issues"
          }
        ]
      }
    ]
  },
  {
    "provider": "AutoEmbed",
    "ERROR": [
      {
        "error": "ERROR",
        "what_happened": "HTTP error! Status: 403",
        "report_issue": "https://github.com/Inside4ndroid/vidsrc-api-js/issues"
      }
    ]
  },
  {
    "provider": "EmbedSU",
    "ERROR": [
      {
        "error": "ERROR",
        "what_happened": "Unexpected error: HTTP error! status: 403",
        "report_issue": "https://github.com/Inside4ndroid/vidsrc-api-js/issues"
      }
    ]
  }
]
```

<https://tmdb-embed-api.vercel.app/tv/{id}?s={season}&e={episode}> - Get TV show details by ID

Example FOR TV: <https://tmdb-embed-api.vercel.app/tv/1418>?s=1&e=1> - Get TV show details by ID

> Response:

```json
[
    {
        "sources": {
            "provider": "2Embed",
            "ERROR": [
                {
                    "error": "ERROR",
                    "what_happened": "Could not resolve stream URL for swish ID: 0",
                    "report_issue": "https://github.com/Inside4ndroid/vidsrc-api-js/issues"
                }
            ]
        }
    },
    {
        "sources": [
            {
                "provider": "EmbedSU",
                "ERROR": [
                    {
                        "error": "ERROR",
                        "what_happened": "Failed to fetch initial page: HTTP 403",
                        "report_issue": "https://github.com/Inside4ndroid/vidsrc-api-js/issues"
                    }
                ]
            }
        ]
    },
    {
        "provider": "AutoEmbed",
        "ERROR": [
            {
                "error": "ERROR",
                "what_happened": "HTTP error! Status: 403",
                "report_issue": "https://github.com/Inside4ndroid/vidsrc-api-js/issues"
            }
        ]
    },
    {
        "provider": "EmbedSU",
        "ERROR": [
            {
                "error": "ERROR",
                "what_happened": "Unexpected error: HTTP error! status: 403",
                "report_issue": "https://github.com/Inside4ndroid/vidsrc-api-js/issues"
            }
        ]
    }
]
```
