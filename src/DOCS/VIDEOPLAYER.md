# Video player to use with new Custom API video source

> We are going to use vidstack library to create a video player that can be used with the new Custom API video source.

To install Vistack:

    ```bash
    npm i @vidstack/react@next
    ```

To use the video player, import the necessary components from the vidstack library and set up your video source accordingly

Import styles:

    ```javascript
    // Base styles for media player and provider (~400B).
    import '@vidstack/react/player/styles/base.css';
    ```

Player Markup:

    ```jsx
    <MediaPlayer title="Sprite Fight" src="https://files.vidstack.io/sprite-fight/hls/stream.m3u8">
    <MediaProvider />
    </MediaPlayer>
    ```

## Architecture

### Source Selection

The source selection process determines which provider loader is active and consequently which provider to load and render. The selection process is as follows:

Detect src attr or prop change.
Normalize src into an array of Src objects ({src, type}). If a source object is provided (e.g., MediaStream or MediaSource), the type will default to video/object, otherwise unknown.
The sources-change event is fired.
Walk through each source at a time in given order and attempt to find a provider who can play it. The canPlay method on each provider loader will check if the media extension or type can be played. The first loader to return true will be promoted to active.
The source-change event is fired. The current source will be null if no provider was matched.
Start the provider loading process.

### Media Provider Loader

Media provider loaders are responsible for determining whether the underlying provider can play a given source, dynamically loading and initializing the provider, and rendering content inside the media provider component. Rendered output includes <audio>, <video>, and <iframe> elements.

When a loader becomes active via the source selection process, it will go through the following setup process:

Destroy the old provider if no longer active and fire the provider-change event with detail set to null.
The loader will attempt to preconnect any URLs for the current provider or source.
The provider-loader-change event is fired.
Wait for the new media provider loader to render so the underlying element (e.g., <video>) is ready.
The loader will dynamically import and initialize the provider instance.
The provider-change event is fired. This is the best time to configure the provider before it runs through setup.
Once the specified player loading strategy has resolved, the provider setup method is called. This step generally involves loading required libraries and attaching event listeners.
The provider-setup event is fired.
Finally, the loadSource method is called on the provider with the selected source.
If the provider has not changed during a source change, then the setup process will be skipped and only the new source will be loaded (step 9).

### Media Provider

In general, media provider’s are responsible for rendering the underlying media element or iframe, determining the media and view types, loading sources, managing tracks, setting properties, performing media requests, attaching event listeners, and notifying the MediaStateManager of state changes. In addition, each provider will implement the MediaProviderAdapter interface to ensure they have a consistent API.

### Media Context

The media context is a singleton object passed down from each player instance to all consumers. It contains important objects such as the player itself, remote control for dispatching requests, player delegate for notifying the state manager of updates, media store for UI to subscribe to state changes, and the current media provider.

### Media Store

The media store is a collection of signals which store and track individual pieces of state. The MediaStateManger is responsible for updating the store when the media provider notifies it of any changes. Player components will subscribe to media state via effects to handle rendering attributes, managing the DOM, and performing operations.

Signals are way for us to create reactive observables to store state, create computed properties, and subscribe to updates as its value changes via effects. We created our own signals library called Maverick Signals which handles the scoping and reactivity complexity. See the link for more information, and you can also read about the evolution of signals by Ryan Carniato if you’d like to dive deeper.

### UI Components

UI components are abstracted to avoid rewriting complex logic across Custom Elements and React. They’re built on top of our component library called Maverick. Thanks to Signals being our reactivie primitive of choice, we can adapt reactivity to work with any framework easily. The component lifecycle has been simplified down to onSetup (initial setup), onAttach (attached to a DOM or server element), onConnect (connected to the DOM), and onDestroy (end of life). These lifecycle hooks are pure as they can run more than once in React, and they can be individually disposed of.

The base component defines the general contract for the component across props, state, and events. They have no rendered UI out of the box and are responsible for: accessibility, setting data attributes and CSS variables for styling purposes, managing props and internal state, subscribing to media state via the media context, attaching DOM event listeners, dispatching DOM events, and exposing methods.

The mixin Host(Component, HTMLElement) is used to create a Custom Element and attach the base component to it, and createReactComponent(Component) is used to create a client/server React Component and attach to it.

### Media Remote Control

The MediaRemoteControl is a simple facade for dispatching media request events to the nearest player component in the DOM. It helps consumers avoid creating and dispatching an event such as el.dispatchEvent(new DOMEvent('media-play-request')), and instead just call remote.play().

### Media Request Manager

The MediaRequestManager routes media request events to the current media provider by calling the appropriate actions on it. In addition, it queues the request event so the MediaStateManager can satisfy it by attaching it to the correct media event. Important to note, the manager can speak with any provider because of the MediaProviderAdapter interface. The interface ensures each provider has the same API for performing operations such as play, pause, seek, etc.

### Media State Manager

The MediaStateManager is responsible for handling media state changes as they’re delegated from the media provider to it, satisfying media request events by attaching them as triggers on the respective success/failure media event and releasing them from the queue, dispatching media events, and updating the media store to ensure it’s in-sync with the currently playing media and provider.

## Core Concepts

Sizing
Section titled Sizing
By default, the browser will use the intrinsic size of the loaded media to set the dimensions of the provider. As media loads over the network, the element will jump from the default size to the intrinsic media size, triggering a layout shift which is a poor user experience indicator for both your users and search engines (i.e., Google).

Aspect Ratio

To avoid a layout shift, we recommend setting the aspect ratio like so:

tsx
<MediaPlayer aspectRatio="16/9">
Ideally the ratio set should match the ratio of the media content itself (i.e., intrinsic aspect ratio) otherwise you’ll end up with a letterbox template (empty black bars on the left/right of the media).

Specify Dimensions

If you’d like to be more specific for any reason, you can specify the width and height of the player simply using CSS like so:

.player {
  width: 600px;
  height: 338px;
  aspect-ratio: unset;
}
Load Strategies
Section titled Load Strategies
A loading strategy specifies when media or the poster image should begin loading. Loading media too early can effectively slow down your entire application, so choose wisely.

The following media loading strategies are available:

eager: Load media immediately - use when media needs to be interactive as soon as possible.
idle: Load media once the page has loaded and the requestIdleCallback is fired - use when media is lower priority and doesn’t need to be interactive immediately.
visible: Load media once it has entered the visual viewport - use when media is below the fold and you prefer delaying loading until it’s required.
play: Load the provider and media on play - use when you want to delay loading until interaction.
custom: Load media when the startLoading()/startLoadingPoster() method is called or the media-start-loading/media-start-loading-poster event is dispatched - use when you need fine control of when media should begin loading.
<MediaPlayer load="visible" posterLoad="visible">
INFO
The poster load strategy specifies when the poster should begin loading. Poster loading is separate from media loading so you can display an image before media is ready for playback. This generally works well in combination with load="play" to create thumbnails.

Custom Strategy
Section titled Custom Strategy
A custom load strategy lets you control when media or the poster image should begin loading:

import { useEffect, useRef } from 'react';

import { MediaPlayer, type MediaPlayerInstance } from '@vidstack/react';

function Player() {
  const player = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    // Call whenever you like - also available on `useMediaRemote`.
    player.current!.startLoading();

    // Call when poster should start loading.
    player.current!.startLoadingPoster();
  }, []);

  return (
    <MediaPlayer load="custom" posterLoad="custom" ref={player}>
      {/*...*/}
    </MediaPlayer>
  );
}
View Type
Section titled View Type
The view type suggests what type of media layout will be displayed. It can be either audio or video. This is mostly to inform layouts, whether your own or the defaults, how to appropriately display the controls and general UI. By default, the view type is inferred from the provider and media type. You can specify the desired type like so:

<MediaPlayer viewType="audio">
Stream Type
Section titled Stream Type
The stream type refers to the mode in which content is delivered through the video player. The player will use the type to determine how to manage state/internals such as duration updates, seeking, and how to appropriately present UI components and layouts. The stream type can be one of the following values:

on-demand: Video on Demand (VOD) content is pre-recorded and can be accessed and played at any time. VOD streams allow viewers to control playback, pause, rewind, and fast forward.
live: Live streaming delivers real-time content as it happens. Viewers join the stream and watch the content as it’s being broadcast, with limited control over playback.
live:dvr: Live DVR (Live Digital Video Recording) combines the features of both live and VOD. Viewers can join a live stream and simultaneously pause, rewind, and fast forward, offering more flexibility in watching live events.
ll-live: A live streaming mode optimized for reduced latency, providing a near-real-time viewing experience with minimal delay between the live event and the viewer.
ll-live:dvr: Similar to low-latency live, this mode enables viewers to experience live content with minimal delay while enjoying the benefits of DVR features (same as live:dvr).
If the value is not set, it will be inferred by the player which can be less accurate (e.g., at identifying DVR support). When possible, prefer specifying it like so:

<MediaPlayer streamType="live">
Duration
Section titled Duration
By default, the duration is inferred from the provider and media. It’s always best to provide the duration when known to avoid any inaccuracies such as rounding errors, and to ensure UI is set to the correct state without waiting on metadata to load. You can specify the exact duration like so:

// 5 minutes.
<MediaPlayer duration={300}>
Clipping
Section titled Clipping
Clipping allows shortening the media by specifying the time at which playback should start and end.

<MediaPlayer clipStartTime={10} clipEndTime={30}>
You can set a clip start time or just an end time, both are not required.
The media duration and chapter durations will be updated to match the clipped length.
Any media resources such as text tracks and thumbnails should use the full duration.
Seeking to a new time is based on the clipped duration. For example, if a 1 minute video is clipped to 30 seconds, seeking to 30s will be the end of the video.
Media URI Fragments are set internally to efficiently load audio and video files between the clipped start and end times (e.g., /video.mp4#t=30,60).
Media Session
Section titled Media Session
The Media Session API is automatically set using the provided title, artist, and artwork (poster is used as fallback) player properties.

Storage
Section titled Storage
Storage enables saving player and media settings so that the user can resume where they left off. This includes saving and initializing on load settings such as language, volume, muted, captions visibility, and playback time.

Local Storage
Section titled Local Storage
Local Storage enables saving data locally on the user’s browser. This is a simple and fast option for remembering player settings, but it won’t persist across domains, devices, or browsers.

Provide a storage key prefix for turning local storage on like so:

<MediaPlayer storage="storage-key">
Extending Local Storage

Optionally, you can extend and customize local storage behaviour like so:

import { LocalMediaStorage } from '@vidstack/react';

class CustomLocalMediaStorage extends LocalMediaStorage {
  // override methods here...
}

// Provide storage to player.
<MediaPlayer storage={CustomLocalMediaStorage}>
Remote Storage
Section titled Remote Storage
Remote Storage enables asynchronously saving and loading data from anywhere. This is great as settings willl persist across user sessions even if the domain, device, or browser changes. Generally, you will save player/media settings to a remote database based on the currently authenticated user.

Implement the MediaStorage interface and provide it to the player like so:

ts
Copy
import { type MediaStorage } from '@vidstack/react';

class MediaDatabaseStorage implements MediaStorage {
  async getVolume() {}
  async setVolume(volume: number) {}

  async getMuted() {}
  async setMuted(isMuted: boolean) {}

  async getTime() {}
  async setTime(time: number) {}

  async getLang() {}
  async setLang(lang: string | null) {}

  async getCaptions() {}
  async setCaptions(isOn: boolean) {}

  async onLoad() {}

  onChange(src, mediaId, playerId) {}

  onDestroy() {}
}
const storage = useMemo(() => new MediaDatabaseStorage(), []);

<MediaPlayer storage={storage}>
Sources
Section titled Sources
The player can accept one or more media sources which can be a string URL of the media resource to load, or any of the following objects: MediaStream, MediaSource, Blob, or File.

Single Source

<MediaPlayer src="https://files.vidstack.io/sprite-fight/720p.mp4" />
Multiple Source Types

The list of supported media formats varies from one browser to the other. You should either provide your source in a single format that all relevant browsers support, or provide multiple sources in enough different formats that all the browsers you need to support are covered.

<MediaPlayer
  src={[
    // Audio
    { src: 'https://files.vidstack.io/agent-327/audio.mp3', type: 'audio/mpeg' },
    { src: 'https://files.vidstack.io/agent-327/audio.ogg', type: 'audio/ogg' },
    // Video
    { src: 'https://files.vidstack.io/agent-327/720p.ogv', type: 'video/ogg' },
    { src: 'https://files.vidstack.io/agent-327/720p.avi', type: 'video/avi' },
    { src: 'https://files.vidstack.io/agent-327/720p.mp4', type: 'video/mp4' },
  ]}
/>
Source Objects
Section titled Source Objects
The player accepts both audio and video source objects. This includes MediaStream, MediaSource, Blob, and File.

import { useEffect, useState } from 'react';

import { MediaPlayer, MediaProvider, type MediaSrc } from '@vidstack/react';

function Player() {
  const [src, setSrc] = useState<MediaSrc>();

  useEffect(() => {
    async function getMediaStream() {
      // Example 1: Audio
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setSrc({ src: audioStream, type: 'audio/object' });

      // Example 2: Video
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setSrc({ src: videoStream, type: 'video/object' });
    }

    getMediaStream();
  }, []);

  return (
    <MediaPlayer src={src}>
      <MediaProvider />
    </MediaPlayer>
  );
}
Changing Source
Section titled Changing Source
The player supports changing the source dynamically. Simply update the src property when you want to load new media. You can also set it to an empty string "" to unload media.

import { useState } from 'react';

import { MediaPlayer, type MediaSrc } from '@vidstack/react';

const sources = ['/video-a.mp4', '/video-b.mp4', './video-c.mp4'];

function Player() {
  const [src, setSrc] = useState(0);

  function prevVideo() {
    setSrc((n) => Math.max(0, n - 1));
  }

  function nextVideo() {
    setSrc((n) => Math.min(sources.length - 1, n + 1));
  }

  return (
    <MediaPlayer src={sources[src]}>
      {/*... */}
      {/* Playlist controls*/}
      <button onClick={prevVideo}>Previous Video</button>
      <button onClick={nextVideo}>Next Video</button>
    </MediaPlayer>
  );
}
Source Types
Section titled Source Types
The player source selection process relies on file extensions, object types, and type hints to determine which provider to load and how to play a given source. The following is a table of supported media file extensions and types for each provider:

Media Extensions Types
Audio m4a, m4b, mp4a, mpga, mp2, mp2a, mp3, m2a, m3a, wav, weba, aac, oga, spx audio/mpeg, audio/ogg, audio/3gp, audio/mp4, audio/webm, audio/flac, audio/object
Video mp4, ogg, ogv, webm, mov, m4v video/mp4, video/webm, video/3gp, video/ogg, video/avi, video/mpeg
HLS m3u8 application/vnd.apple.mpegurl, audio/mpegurl, audio/x-mpegurl, application/x-mpegurl, video/x-mpegurl, video/mpegurl, application/mpegurl
DASH mpd application/dash+xml
The following are valid as they have a file extension (e.g, video.mp4) or type hint (e.g., video/mp4):

src="<https://example.com/video.mp4>"
src="<https://example.com/hls.m3u8>"
src="<https://example.com/dash.mpd>"
src = { src: "<https://example.com/video>", type: "video/mp4" }
src = { src: "<https://example.com/hls>", type: "application/x-mpegurl" }
src = { src: "<https://example.com/dash>", type: "application/dash+xml" }
The following are invalid as they are missing a file extension and type hint:

src="<https://example.com/video>"
src="<https://example.com/hls>"
src="<https://example.com/dash>"
Source Sizes
Section titled Source Sizes
You can provide video qualities/resolutions using multiple video files with different sizes (e.g, 1080p, 720p, 480p) like so:

<MediaPlayer
  src={[
    {
      src: 'https://files.vidstack.io/sprite-fight/1080p.mp4',
      type: 'video/mp4',
      width: 1920,
      height: 1080,
    },
    {
      src: 'https://files.vidstack.io/sprite-fight/720p.mp4',
      type: 'video/mp4',
      width: 1280,
      height: 720,
    },
    {
      src: 'https://files.vidstack.io/sprite-fight/480p.mp4',
      type: 'video/mp4',
      width: 853,
      height: 480,
    },
  ]}
/>
NOTE
We strongly recommend using adaptive streaming protocols such as HLS over providing multiple static media files, see the Video Qualities section for more information.

Supported Codecs
Section titled Supported Codecs
Vidstack Player relies on the native browser runtime to handle media playback, hence it’s important you review what containers and codecs are supported by them.

While there are a vast number of media container formats, the ones listed below are the ones you are most likely to encounter. Some support only audio while others support both audio and video. The most commonly used containers for media on the web are probably MPEG-4 (MP4), Web Media File (WEBM), and MPEG Audio Layer III (MP3).

It’s important that both the media container and codecs are supported by the native runtime. Please review the following links for what’s supported and where:

Media Containers
Audio Codecs
Video Codecs
Providers
Section titled Providers
Providers are auto-selected during the source selection process and dynamically loaded via a provider loader (e.g., VideoProviderLoader). The following providers are supported at this time:

Audio
Video
HLS
DASH
YouTube
Vimeo
Remotion
Google Cast
INFO
See source types for how to ensure the correct media provider is loaded.

Provider Events
Section titled Provider Events
The following events will fire as providers change or setup:

import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  type MediaProviderAdapter,
} from '@vidstack/react';

function Player() {
  // This is where you should configure providers.
  function onProviderChange(provider: MediaProviderAdapter | null) {
    if (isHLSProvider(provider)) {
      provider.config = {};
      provider.onInstance((hls) => {
        // ...
      });
    }
  }

  // Provider is rendered, attached event listeners, and ready to load source.
  function onProviderSetup(provider: MediaProviderAdapter) {
    if (isHLSProvider(provider)) {
      // ...
    }
  }

  return (
    <MediaPlayer onProviderChange={onProviderChange} onProviderSetup={onProviderSetup}>
      <MediaProvider />
    </MediaPlayer>
  );
}
Provider Types
Section titled Provider Types
The following utilities can be useful for narrowing the type of a media provider:

import {
  isAudioProvider,
  isDASHProvider,
  isGoogleCastProvider,
  isHLSProvider,
  isVideoProvider,
  isVimeoProvider,
  isYouTubeProvider,
  MediaPlayer,
  MediaProvider,
  type AudioProvider,
  type DASHProvider,
  type GoogleCastProvider,
  type HLSProvider,
  type MediaProviderAdapter,
  type VideoProvider,
  type VimeoProvider,
  type YouTubeProvider,
} from '@vidstack/react';
import { isRemotionProvider, type RemotionProvider } from '@vidstack/react/player/remotion';

function Player() {
  function onProviderChange(provider: MediaProviderAdapter | null) {
    if (isAudioProvider(provider)) {
      const audioElement = provider.audio;
    }

    if (isVideoProvider(provider)) {
      const videoElement = provider.video;
    }

    if (isHLSProvider(provider)) {
      provider.config = { lowLatencyMode: true };
      provider.onInstance((hls) => {
        // ...
      });
    }

    if (isDASHProvider(provider)) {
      provider.config = {};
      provider.onInstance((dash) => {
        // ...
      });
    }

    if (isYouTubeProvider(provider)) {
      provider.cookies = true;
      // ...
    }

    if (isVimeoProvider(provider)) {
      provider.cookies = true;
      // ...
    }

    if (isRemotionProvider(provider)) {
      // ...
    }

    if (isGoogleCastProvider(provider)) {
      // ...
    }
  }

  return (
    <MediaPlayer onProviderChange={onProviderChange}>
      <MediaProvider />
      {/*...*/}
    </MediaPlayer>
  );
}
Audio Tracks
Section titled Audio Tracks
Audio tracks are loaded from your HLS playlist. You can not manually add audio tracks to the player at this time. See the Audio Tracks API guide for how to interact with audio track programmatically.

Text Tracks
Section titled Text Tracks
Text tracks allow you to provide text-based information or content associated with video or audio. These text tracks can be used to enhance the accessibility and user experience of media content in various ways. You can provide multiple text tracks dynamically like so:

import { MediaPlayer, MediaProvider, Track } from '@vidstack/react';

<MediaPlayer>
  <MediaProvider>
    {/* Dynamically add/remove tracks as needed. */}
    <Track src="/subs/english.vtt" kind="subtitles" label="English" lang="en-US" default />
    <Track src="/subs/spanish.vtt" kind="subtitles" label="Spanish" lang="es-ES" />
  </MediaProvider>
</MediaPlayer>
INFO
See the Text Tracks API guide for how to interact with text tracks programmatically.

Text Track Default
Section titled Text Track Default
When default is set on a text track it will set the mode of that track to showing immediately. In other words, this track is immediately active. Only one default is allowed per track kind.

// One default per kind is allowed.
<Track ... kind="captions" default />
<Track ... kind="chapters" default />
<Track ... kind="descriptions" default />
Text Track Formats
Section titled Text Track Formats
The vidstack/media-captions library handles loading, parsing, and rendering captions inside of the player. The following caption formats are supported:

VTT
SRT
SSA/ASS
JSON
See the links provided for more information and any limitations. Do note, all caption formats are mapped to VTT which is extended to support custom styles. In addition, browsers or providers may also support loading additional text tracks. For example, Safari and the HLS provider will load captions embedded in HLS playlists.

You can specify the desired text track format like so:

<Track ... type="srt" />
Text Track Kinds
Section titled Text Track Kinds
The following text track kinds are supported:

subtitles: Provides a written version of the audio for non-native speakers.
captions: Includes dialog and descriptions of important audio elements, like music or sound effects.
chapters: Contains information (e.g, title and start times) about the different chapters or sections of the media file.
descriptions: Provides information about the visual content to assist individuals who are blind or visually impaired.
metadata: Additional information or descriptive data within a media file. This metadata can be used for various purposes, like providing descriptions, comments, or annotations related to the media content. It is not displayed as subtitles or captions but serves as background information that can be used for various purposes, including search engine optimization, accessibility enhancements, or supplementary details for the audience.
<Track ... kind="subtitles" />
JSON Tracks
Section titled JSON Tracks
JSON content can be provided directly to text tracks or loaded from a remote location like so:

import { type VTTContent } from '@vidstack/react';

const content: VTTContent = {
  cues: [
    { startTime: 0, endTime: 5, text: '...' },
    { startTime: 5, endTime: 10, text: '...' },
  ],
};

// Option 1. Provide JSON directly.
<Track content={content} label="English" kind="captions" lang="en-US" type="json" />;

// Option 2. Load from a remote location.
<Track src="/subs/english.json" ...  type="json" />
Example JSON text tracks:

[
  {
    "label": "English",
    "kind": "captions",
    "lang": "en-US",
    "type": "json",
    "content": { "regions": [], "cues": [] },
    "default": true
  },
  ...
]
<MediaPlayer>
  <MediaProvider>
    {tracks.map((track) => (
      <Track {...track} key={track.content} />
    ))}
  </MediaProvider>
</MediaPlayer>
Example JSON cues:

cues.json
[
  { "startTime": 0, "endTime": 5, "text": "Cue One!" },
  { "startTime": 5, "endTime": 10, "text": "Cue Two!" }
]
Example JSON regions and cues:

regions.json
{
  "regions": [{ "id": "0", "lines": 3, "scroll": "up" }],
  "cues": [{ "region": { "id": "0" }, "startTime": 0, "endTime": 5, "text": "Hello!" }]
}
LibASS
Section titled LibASS
We provide a direct integration for a WASM port of libass if you’d like to use advanced ASS features that are not supported.

npm i jassub

Copy the node_modules/jassub/dist directory to your public directory (e.g, public/jassub)

Add the LibASSTextRenderer to the player like so:

tsx
Copy
import { useEffect, useRef } from 'react';

import {
  LibASSTextRenderer,
  MediaPlayer,
  MediaProvider,
  Track,
  type MediaPlayerInstance,
} from '@vidstack/react';

function Player() {
  const player = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    const renderer = new LibASSTextRenderer(() => import('jassub'), {
      workerUrl: '/jassub/jassub-worker.js',
      legacyWorkerUrl: '/jassub/jassub-worker-legacy.js',
    });

    player.current!.textRenderers.add(renderer);
  }, []);

  return (
    <MediaPlayer ref={player}>
      <MediaProvider>
        <Track
          src="/english.ass"
          kind="subtitles"
          type="ass"
          label="English"
          lang="en-US"
          default
        />
      </MediaProvider>
      {/*...*/}
    </MediaPlayer>
  );
}
INFO
See the JASSUB options for how to further configure the LibASS renderer.

Thumbnails
Section titled Thumbnails
Thumbnails are small, static images or frames extracted from the video or audio content. These images serve as a visual preview or representation of the media content, allowing users to quickly identify and navigate to specific points within the video or audio. Thumbnails are often displayed in the time slider or chapters menu; enabling users to visually browse and select the part of the content they want to play.

Usage
Section titled Usage
Thumbnails can be loaded using the Thumbnail component or useThumbnails hook. They’re also supported out the box by the Default Layout.

// 1. Layouts.

<DefaultVideoLayout thumbnails="/thumbnails.vtt" />

// 2. Thumbnail component.
<Thumbnail.Root src="/thumbnails.vtt">
  <Thumbnail.Img />
</Thumbnail.Root>

// 3. Hook.
const thumbnails = useThumbnails('/thumbnails.vtt');
VTT
Section titled VTT
Thumbnails are generally provided in the Web Video Text Tracks (WebVTT) format. The WebVTT file specifies the time ranges of when to display images, with the respective image URL and coordinates (only required if using a sprite). You can refer to our thumbnails example to get a better idea of how this file looks.

Sprite

Sprites are large storyboard images that contain multiple small tiled thumbnails. They’re preferred over loading multiple images because:

Sprites reduce total file size due to compression.
Avoid loading delays for each thumbnail.
Reduce the number of server requests.
The WebVTT file must append the coordinates of each thumbnail like so:

WEBVTT

00:00:00.000 --> 00:00:04.629
storyboard.jpg#xywh=0,0,284,160

00:00:04.629 --> 00:00:09.258
storyboard.jpg#xywh=284,0,284,160

...
Multiple Images

Sprites should generally be preferred but in the case you only have multiple individual thumbnail images, they can be specified like so:

WEBVTT

00:00:00.000 --> 00:00:04.629
/media/thumbnail-1.jpg

00:00:04.629 --> 00:00:09.258
/media/thumbnail-2.jpg

...
JSON
Section titled JSON
Thumbnails can be loaded as a JSON file. Ensure the Content-Type header is set to application/json on the response. The returned JSON can be VTT cues, an array of images, or a storyboard.

import { Thumbnail } from '@vidstack/react';

<Thumbnail.Root src="/thumbnails.json">
  <Thumbnail.Img />
</Thumbnail.Root>
Mux storyboards are supported out of the box:

<DefaultVideoLayout src="https://image.mux.com/{PLAYBACK_ID}/storyboard.json">
Example JSON VTT:

vtt.json
[
  { "startTime": 0, "endTime": 5, "text": "/media/thumbnail-1.jpg" },
  { "startTime": 5, "endTime": 10, "text": "/media/thumbnail-2.jpg" }
]
Example JSON images:

images.json
[
  { "startTime": 0, "endTime": 5, "url": "/media/thumbnail-1.jpg" },
  { "startTime": 5, "endTime": 10, "url": "/media/thumbnail-2.jpg" }
]
Example JSON storyboard:

storyboard.json
{
  "url": "<https://example.com/storyboard.jpg>",
  "tileWidth": 256,
  "tileHeight": 160,
  "tiles": [
    { "startTime": 0, "x": 0, "y": 0 },
    { "startTime": 50, "x": 256, "y": 0 }
  ]
}
Object
Section titled Object
Example object with multiple images:

import { type ThumbnailImageInit } from '@vidstack/react';

const thumbnails: ThumbnailImageInit[] = [
  { startTime: 0, url: '/media/thumbnail-1.jpg' },
  { startTime: 5, url: '/media/thumbnail-2.jpg' },
  // ...
];
Example storyboard object:

import { type ThumbnailStoryboard } from '@vidstack/react';

const storyboard: ThumbnailStoryboard = {
  url: '<https://example.com/storyboard.jpg>',
  tileWidth: 256,
  tileHeight: 160,
  tiles: [
    { startTime: 0, x: 0, y: 0 },
    { startTime: 50, x: 256, y: 0 },
  ],
};
Provide objects directly like so:

// 1. Layouts.

<DefaultVideoLayout thumbnails={storyboard} />

// 2. Thumbnail component.
<Thumbnail.Root src={storyboard}>...</Thumbnail.Root>

// 3. Hook
const thumbnails = useThumbnails(storyboard);
Video Qualities
Section titled Video Qualities
Adaptive streaming protocols like HLS and DASH not only enable streaming media in chunks, but also have the ability to adapt playback quality based on the device size, network conditions, and other information. Adaptive qualities is important for speeding up initial delivery and to avoid loading excessive amounts of data which cause painful buffering delays.

Video streaming platforms such as Cloudflare Stream and Mux will take an input video file (e.g., awesome-video.mp4) and create multiple renditions out of the box for you, with multiple resolutions (width/height) and bit rates:

HLS manifest with multiple child resolution manifests.
By default, the best quality is automatically selected by the streaming engine. You’ll usually see this as an “Auto” option in the player quality menu. It can also be manually set if the engine is not making optimal decisions, as they’re generally more conservative to avoid excessive bandwidth usage.

Once you have your HLS or DASH playlist by either creating it yourself using FFMPEG or using a streaming provider, you can pass it to the player like so:

{/*Example with Cloudflare Stream.*/}
<MediaPlayer src="https://customer-<CODE>.cloudflarestream.com/<UID>/manifest/video.m3u8">

{/*Example with Mux.*/}
<MediaPlayer src="https://stream.mux.com/<PLAYBACK_ID>.m3u8">

## Events

Media Events
Section titled Media Events
You can find a complete list of media events fired in the Player API Reference. The player smoothes out any unexpected behavior across browsers, attaches additional metadata to the event detail, and rich information such as the request event that triggered it or the origin event that kicked it off.

import { MediaPlayer, MediaProvider, type MediaLoadedMetadataEvent } from '@vidstack/react';

function Player() {
  function onLoadedMetadata(nativeEvent: MediaLoadedMetadataEvent) {
    // original media event (`loadedmetadata`) is still available.
    const originalMediaEvent = nativeEvent.trigger;
  }

  return (
    <MediaPlayer onLoadedMetadata={onLoadedMetadata}>
      <MediaProvider />
      {/*...*/}
    </MediaPlayer>
  );
}
Media Request Events
Section titled Media Request Events
Vidstack Player is built upon a request and response model for updating media state. Requests are dispatched as events to the player component. The player attempts to satisfy requests by performing operations on the provider based on the given request, and then attaching it to the corresponding media event.

For example, the media-play-request event is a request to begin/resume playback, and as a consequence it’ll trigger a play() call on the provider. The provider will respond with a play or play-fail event to confirm the request was satisfied. You can find a complete list of media request events fired in the Player API Reference.

import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayEvent,
  type MediaPlayFailEvent,
  type MediaPlayRequestEvent,
} from '@vidstack/react';

function Player() {
  // 1. request was made
  function onPlayRequest(nativeEvent: MediaPlayRequestEvent) {
    // ...
  }

  // 2. request succeeded
  function onPlay(nativeEvent: MediaPlayEvent) {
    // request events are attached to media events
    const playRequestEvent = nativeEvent.request; // MediaPlayRequestEvent
  }

  // 2. request failed
  function onPlayFail(error: Error, nativeEvent: MediaPlayFailEvent) {
    // ...
  }

  return (
    <MediaPlayer onPlay={onPlay} onPlayFail={onPlayFail} onMediaPlayRequest={onPlayRequest}>
      <MediaProvider />
      {/*...*/}
    </MediaPlayer>
  );
}
When are request events fired?

Media request events are fired by Vidstack components generally in response to user actions. Most actions are a direct consequence to UI events such as pressing a button or dragging a slider. However, some actions may be indirect such as scrolling the player out of view, switching browser tabs, or the device going to sleep.

How are request events fired?

Request events are standard DOM events which can be dispatched like any other, however, they’re generally dispatched by using the MediaRemoteControl as it’s simpler. A good practice is to always attach event triggers to ensure requests can be traced back to their origin. This is the same way all Vidstack components dispatch requests internally.

Cancelling Requests
Section titled Cancelling Requests
Meida request events can be cancelled by listening for them on the player or the component dispatching it and preventing the default behavior:

import { type MediaSeekRequestEvent } from '@vidstack/react';

function onSeekRequest(time: number, nativeEvent: MediaSeekRequestEvent) {
  nativeEvent.preventDefault();
}

// Option 1. Cancel requests on the player.
<MediaPlayer onMediaSeekRequest={onSeekRequest} />;

// Option 2. Cancel requests on the component dispatching it.
<TimeSlider.Root onMediaSeekRequest={onSeekRequest} />
Event Triggers
Section titled Event Triggers
All events in the library keep a history of trigger events which are stored as a chain. Each event points to the event that came before it all the way up to the origin event. The following is an example of a chain that is created when the play button is clicked and media begins playing:

Media playing event chain diagram
import { MediaPlayer, MediaProvider, type MediaPlayingEvent } from '@vidstack/react';

function Player() {
  function onPlaying(nativeEvent: MediaPlayingEvent) {
    // the event that triggered the media play request
    const origin = nativeEvent.originEvent; // e.g., PointerEvent

    // was this triggered by an actual person?
    const userPlayed = nativeEvent.isOriginTrusted;

    // equivalent to above
    const isTrusted = nativeEvent.originEvent?.isTrusted;
  }

  return (
    <MediaPlayer onPlaying={onPlaying}>
      <MediaProvider />
      {/*...*/}
    </MediaPlayer>
  );
}
INFO
See event trigger helpers for how you can inspect and walk event trigger chains.

Event Types
Section titled Event Types
All event types are named using PascalCase and suffixed with the word Event (e.g., SliderDragStartEvent). Furthermore, media events are all prefixed with the word Media as seen in the examples below. Refer to each component’s docs page to see what events are fired.

import {
  type MediaCanPlayEvent,
  type MediaPlayEvent,
  type MediaPlayRequestEvent,
  type MediaStartedEvent,
  type MediaTimeUpdateEvent,
} from '@vidstack/react';

## State Management

Reading
Section titled Reading
The useMediaState and useMediaStore hooks enable you to subscribe directly to specific media state changes, rather than listening to potentially multiple DOM events and binding it yourself.

Tracking media state via events is error prone and tedious:

import { useState } from 'react';

import { MediaPlayer } from '@vidstack/react';

function Player() {
  const [paused, setPaused] = useState(true);

  return (
    <MediaPlayer onPlay={() => setPaused(false)} onPause={() => setPaused(true)}>
      {/*...*/}
    </MediaPlayer>
  );
}
Tracking media state via hooks:

import { useRef } from 'react';

import {
  MediaPlayer,
  useMediaState,
  useMediaStore,
  type MediaPlayerInstance,
} from '@vidstack/react';

function Player() {
  const player = useRef<MediaPlayerInstance>(null);

  // ~~ Option 1
  // - This hook is simpler when accessing a single piece of state.
  // - This hook is much cheaper/faster than `useMediaStore`.
  const paused = useMediaState('paused', player);

  // ~~ Option 2
  // - This hook creates a live subscription to the media paused state.
  // - All state subscriptions are lazily created on prop access.
  // - This hook makes it easy to access all media state.
  const { paused } = useMediaStore(player);

  return <MediaPlayer ref={player}>{/*...*/}</MediaPlayer>;
}
You can omit the ref if you’re calling the hooks inside a player child component as the media context is available:

import { useMediaStore } from '@vidstack/react';

// This component is a child of `<MediaPlayer>`
function PlayerChildComponent() {
  // No ref required.
  const { paused } = useMediaStore();
}
INFO
You can find a complete list of all media states available in the Player State Reference.

Avoiding Renders
Section titled Avoiding Renders
The useMediaState and useMediaStore hook will trigger re-renders. For some media state this may be too expensive or unnecessary. You can subscribe to state updates directly on the player instance to avoid triggering renders:

import { useEffect, useRef } from 'react';

import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from '@vidstack/react';

function Player() {
  const player = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    // Access snapshot of player state.
    const { paused } = player.current!.state;

    // Subscribe for updates without triggering renders.
    return player.current!.subscribe(({ currentTime }) => {
      // ...
    });
  }, []);

  return (
    <MediaPlayer ref={player}>
      <MediaProvider />
      {/*...*/}
    </MediaPlayer>
  );
}
When inside a player child component you can get a player instance reference with useMediaPlayer:

import { useEffect } from 'react';

import { useMediaPlayer } from '@vidstack/react';

// This component is a child of `<MediaPlayer>`
function PlayerChildComponent() {
  const player = useMediaPlayer();

  useEffect(() => {
    if (!player) return;
    // Same as example above here.
  }, [player]);
}
Updating
Section titled Updating
The useMediaRemote hook creates and returns a MediaRemoteControl object. The returned class provides a simple facade for dispatching media request events. This can be used to request media playback to play/pause, change the current volume level, seek to a different time position, and other actions that change media state.

import { type PointerEvent } from 'react';

import { useMediaRemote } from '@vidstack/react';

function PlayerChildComponent() {
  const remote = useMediaRemote();

  function onClick({ nativeEvent }: PointerEvent) {
    // Attaching trigger here to trace this play call back to this event.
    remote.play(nativeEvent);
  }

  return <button onPointerUp={onClick}>{/*...*/}</button>;
}
The example above shows that event triggers can be provided to all methods on the MediaRemoteControl class. Trigger events enable connecting media events back to their origin event. This can be useful when trying to understand how a media event was triggered, or when analyzing data such as the time difference between the request and when it was performed.

## Styling

Tailwind CSS
A guide on installing and using the Tailwind CSS plugin.

If you’re a fan of Tailwind CSS like we are, then you really don’t want to be forced to create a .css file to handle random outlier cases. It not only slows you down and breaks your flow, but it also goes against all the advantages of using utility classes. Our Tailwind plugin provides you with media variants such as media-paused:opacity-0 to help you easily style elements based on media state.

Installation
Section titled Installation
You can register the plugin by adding the following to tailwind.config.js:

tailwind.config.js
Copy
module.exports = {
  plugins: [require('@vidstack/react/tailwind.cjs')],
};
The following options are available:

require('@vidstack/react/tailwind.cjs')({
  // Optimize output by specifying player selector.
  selector: '.media-player',
  // Change the media variants prefix.
  prefix: 'media',
});
Usage
Section titled Usage
The Tailwind plugin provides media variants which can be used to prefix utilities so they’re applied when a given media state is active (or not). Here are some examples:

function Example() {
  return (
    <MediaPlayer>
      {/*show when paused*/}
      <div className="media-paused:opacity-100 opacity-0"></div>

      {/* hide when paused  */}
      <div className="media-paused:opacity-0"></div>

      {/* hide when _not_ playing  */}
      <div className="not-media-playing:opacity-0"></div>
    </MediaPlayer>
  );
}
Media Variants
Section titled Media Variants
// Example
<div className="media-paused:opacity-0" />
Playback
Section titled Playback
Variant Description
media-autoplay-error Autoplay has failed to start.
media-autoplay Autoplay has successfully started.
media-buffering Not ready for playback or waiting for more data.
media-can-fullscreen Fullscreen is available.
media-can-load Media can begin loading.
media-can-load-poster Poster can begin loading.
media-can-pip Picture-in-Picture is available.
media-can-play Media is ready to be played.
media-can-seek Whether seeking is permitted for live stream.
media-captions Caption or subtitle text track is showing.
media-controls Controls are visible.
media-ios-controls Native iOS controls are visible.
media-ended Playback has reached the end.
media-error Issue with media loading/playback.
media-fullscreen Media is in fullscreen mode.
media-live-edge Current time is at the live edge.
media-live Media is a live stream.
media-loop Media is set to loop back to start on end.
media-muted Media is muted.
media-paused Playback is in a paused state.
media-pip Media is in picture-in-picture mode.
media-playing Playback has started or resumed.
media-playsinline Media should play inline by default (iOS Safari).
media-preview Time slider preview is visible.
media-seeking Media or user is seeking to new playback position.
media-started Media playback has started.
media-waiting Media is waiting for more data (i.e., buffering).
View Type
Section titled View Type
Variant Description
media-audio Whether media type is of audio.
media-video Whether media type is of video.
media-view-audio Whether view type is of audio.
media-view-video Whether view type is of video.
Stream Type
Section titled Stream Type
Variant Description
media-stream-unknown Whether stream type is unknown.
media-stream-demand Whether stream type is on-demand.
media-stream-live Whether stream type is live.
media-stream-dvr Whether stream type is live DVR.
media-stream-ll Whether stream type is low-latency live.
media-stream-ll-dvr Whether stream type is low-latency live DVR.
Remote Playback
Section titled Remote Playback
Variant Description
media-can-air Whether AirPlay is available.
media-air Whether AirPlay has connected.
media-air-connecting Whether AirPlay is connecting.
media-air-disconnected Whether AirPlay has disconnected.
media-can-cast Whether Google Cast is available.
media-cast Whether Google Cast has connected.
media-cast-connecting Whether Google Cast is connecting.
media-cast-disconnected Whether Google Cast has disconnected.
media-remote-connected Whether remote playback has connected.
media-remote-connecting Whether remote playback is connecting.
media-remote-disconnected Whether remote playback has disconnected.
Not Variants
Section titled Not Variants
All media variants can be prefixed with not- to negate the selector. Classes with this prefix will be transformed into media-player:not([state]) selectors.

// Example
<div className="not-media-paused:opacity-0" />
Few more examples:

not-media-paused: Media is in the play state (not paused).
not-media-playing: Media playback is not active (not playing).
not-media-can-play: Media is not ready for playback (not can play).
Data Attributes
Section titled Data Attributes
Data attributes are applied to components throughout the library to expose internal state for styling purposes. Tailwind supports data attributes out of the box to apply styles conditionally.

<Controls.Root className="data-[visible]:opacity-100 opacity-0 transition-opacity">
  {/*...*/}
</Controls.Root>
INFO
All component API references include the exposed data attributes. See the player data attributes as an example.

Focus
Section titled Focus
The data-focus attribute is applied to all components when focused via keyboard. This attribute can be used to apply focus styling like so:

// Example - available on all interactable components.
<PlayButton className="outline-none data-[focus]:ring-4 data-[focus]:ring-blue-400">
  {/*...*/}
</PlayButton>
Hocus
Section titled Hocus
The data-hocus attribute is applied to components when they’re being keyboard focused or hovered on by a pointer device. This attribute is applied to help keep class lists concise and can be used like so:

// Example - available on all interactable components.
<PlayButton className="outline-none data-[hocus]:ring-4 data-[hocus]:ring-blue-400">
  {/*...*/}
</PlayButton>
