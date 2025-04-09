/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-d4260423'], (function (workbox) { 'use strict';

  workbox.enable();
  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "3ca0b8505b4bec776b69afdba2768812"
  }, {
    "url": "index.html",
    "revision": "0.qfv5h66dmb"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    allowlist: [/^\/$/]
  }));
  workbox.registerRoute(({
    request
  }) => request.mode === "navigate", new workbox.NetworkFirst({
    "cacheName": "pages-cache-v0.0.0",
    "networkTimeoutSeconds": 3,
    plugins: [{
      requestWillFetch: async ({
        event
      }) => {
        try {
          if (event.preloadResponse) {
            const preloadResponse = await event.preloadResponse;
            if (preloadResponse) {
              return preloadResponse;
            }
          }
          return event.request;
        } catch (error) {
          console.error("Error handling preload response:", error);
          return event.request;
        }
      },
      handlerDidError: async ({
        request
      }) => {
        try {
          const cache = await self.caches.open(CACHE_NAMES.pages);
          const response = await cache.match("/offline.html");
          if (response) return response;
          const offlineResponse = await fetch("/offline.html");
          if (offlineResponse.ok) {
            await cache.put("/offline.html", offlineResponse.clone());
            return offlineResponse;
          }
          return void 0;
        } catch (error) {
          console.error("Error serving offline page:", error);
          return void 0;
        }
      }
    }]
  }), 'GET');
  workbox.registerRoute(/\.(css|js|woff2|ttf)$/i, new workbox.CacheFirst({
    "cacheName": "static-assets-v0.0.0",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp)$/i, new workbox.CacheFirst({
    "cacheName": "images-v0.0.0",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 500,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    }), {
      handlerDidError: async ({
        request
      }) => {
        const cache = await self.caches.open(CACHE_NAMES.static);
        return cache.match("/placeholder.svg");
      }
    }]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/api\.themoviedb\.org\/3\/.*/i, new workbox.NetworkFirst({
    "cacheName": "tmdb-api-v0.0.0",
    "networkTimeoutSeconds": 3,
    plugins: [{
      cacheWillUpdate: async ({
        response
      }) => {
        if (response && response.status === 200) {
          try {
            const clonedResponse = response.clone();
            const data = await clonedResponse.json();
            if (data && !data.error) {
              return response;
            }
          } catch (error) {
            console.error("Error parsing TMDB response:", error);
          }
        }
        return null;
      }
    }, new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 3600
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/image\.tmdb\.org\/t\/p\/.*/i, new workbox.CacheFirst({
    "cacheName": "tmdb-images-v0.0.0",
    "matchOptions": {
      "ignoreVary": true
    },
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 500,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    }), {
      handlerDidError: async () => {
        const cache = await self.caches.open(CACHE_NAMES.static);
        return cache.match("/placeholder.svg");
      }
    }]
  }), 'GET');
  workbox.registerRoute(({
    url
  }) => {
    return url.hostname.includes("firestore.googleapis.com") || url.hostname.includes("firebase.googleapis.com") || url.hostname.includes("firebaseio.com");
  }, new workbox.NetworkFirst({
    "cacheName": "firebase-data-v0.0.0",
    "networkTimeoutSeconds": 3,
    "matchOptions": {
      "ignoreVary": true,
      "ignoreSearch": false
    },
    plugins: [{
      cacheWillUpdate: async ({
        response
      }) => {
        return response && response.status === 200 ? response : null;
      },
      cacheDidUpdate: async ({
        cacheName,
        request,
        oldResponse,
        newResponse
      }) => {
        try {
          if (oldResponse) {
            const cache = await self.caches.open(cacheName);
            const keys = await cache.keys();
            const oldKeys = keys.filter(key => key.url.includes(request.url) && key !== request);
            await Promise.all(oldKeys.map(key => cache.delete(key)));
          }
        } catch (error) {
          console.error("Error cleaning up Firebase cache:", error);
        }
      }
    }, new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 3600
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/(apis\.google\.com|www\.googleapis\.com)\/.*/i, new workbox.NetworkFirst({
    "cacheName": "google-apis-v0.0.0",
    "networkTimeoutSeconds": 3,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 3600
    }), {
      handlerDidError: async ({
        request
      }) => {
        console.error("Google API request failed:", request.url);
        return void 0;
      }
    }]
  }), 'GET');
  workbox.initialize({
    parameterOverrides: {
      cd1: 'offline'
    }
  });

}));
