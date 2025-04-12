### Use firebase firestore rules to manage access to the database. The rules are divided into two sections: the original user-centric rules and the new collection-centric rules. The new rules are designed to be more flexible and allow for easier management of user data.

> To apply this configuration, copy the code below and paste it into your Firebase console under Firestore Database > Rules.



```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions from new config
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Original user-centric rules (old config)
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    match /users/{userId}/watchlist/{document=**} {
      allow read, write: if isOwner(userId);
    }
    
    match /users/{userId}/history/{document=**} {
      allow read, write: if isOwner(userId);
    }

    // New collection-centric rules (new config)
    match /userPreferences/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    match /watchHistory/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
    
    match /favorites/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }
      match /watchlist/{documentId} {
      allow read: if isAuthenticated() && resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.user_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.user_id == request.auth.uid;
    }    // No more caching in Firestore

    // Default deny for all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```