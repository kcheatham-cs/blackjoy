// ============================================================
// STEP 1: IMPORT FIREBASE TOOLS WE NEED
// Think of imports like grabbing tools from a toolbox.
// We load them directly from Firebase's website (CDN) so we
// don't need to install anything.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,   // connects us to the Firestore database
  collection,     // points to a group of posts in the database
  addDoc,         // adds a new post to the database
  onSnapshot,     // listens for live changes (new posts appear instantly)
  doc,            // points to one specific post
  updateDoc,      // updates a post (e.g. adding a like)
  deleteDoc,      // deletes a post
  serverTimestamp,// gets the current time from Firebase's server
  increment,      // increases a number by 1 (used for likes)
  getDocs,        // reads posts once (used to check if database is empty)
  query,          // lets us ask the database a question
  orderBy         // sorts posts newest first
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage,     // connects us to Firebase Storage (for images)
  ref,            // creates a file path in storage
  uploadBytes,    // uploads the image file
  getDownloadURL  // gets the public URL of the uploaded image
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


// ============================================================
// STEP 2: CONNECT TO YOUR FIREBASE PROJECT
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyARp3DHryrTKulE4AshTAISMmHmLGrLCRY",
  authDomain: "black-joy.firebaseapp.com",
  projectId: "black-joy",
  storageBucket: "black-joy.firebasestorage.app",
  messagingSenderId: "415223431441",
  appId: "1:415223431441:web:2d9cd50eecca45a44fccb0"
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);  // connects to the database
const storage = getStorage(app);    // connects to image storage


// ============================================================
// STEP 3: FIND THE HTML ELEMENTS WE NEED
// document.getElementById looks for an element by its id="" in HTML
// ============================================================

const input      = document.getElementById("postInput");  // the text box
const feed       = document.getElementById("Feed");       // the list of posts
const imageInput = document.getElementById("imageInput"); // the hidden file picker


// ============================================================
// STEP 4: STARTER POSTS
// If the database is empty, add these so the feed isn't blank.
// ============================================================

const starterPosts = [
  { user: "QueenNia",  message: "Just got into Howard Medical School 🖤 First in my family! #blackjoy #winning", likes: 12 },
  { user: "MarcusB",   message: "Black excellence is not the exception — it's the standard ✊ #blackpeoplewinning", likes: 9 },
  { user: "ZoeSpeaks", message: "Support Black creators every day, not just in February 🙌 #community #blackjoy", likes: 21 }
];

async function addStarterPostsIfEmpty() {
  const existingPosts = await getDocs(collection(db, "posts"));
  if (!existingPosts.empty) return; // already has posts, stop here

  for (let post of starterPosts) {
    await addDoc(collection(db, "posts"), {
      user:    post.user,
      message: post.message,
      likes:   post.likes,
      image:   "",
      time:    serverTimestamp()
    });
  }
}
addStarterPostsIfEmpty();


// ============================================================
// STEP 5: ADD A NEW POST
// Runs when the user clicks the "Post" button.
// window.addPost makes it accessible to onclick= in HTML.
// ============================================================

window.addPost = async function () {
  const text = input.value.trim();

  if (!text && (!imageInput || !imageInput.files[0])) {
    alert("Write something or add a photo first!");
    return;
  }

  let imageUrl = "";

  // If the user picked an image, upload it to Firebase Storage
  if (imageInput && imageInput.files[0]) {
    const file     = imageInput.files[0];
    const imageRef = ref(storage, "images/" + Date.now() + "-" + file.name);
    await uploadBytes(imageRef, file);          // upload the file
    imageUrl = await getDownloadURL(imageRef);  // get its public URL
  }

  // Save the post to Firestore — onSnapshot below shows it instantly
  await addDoc(collection(db, "posts"), {
    message: text,
    user:    "Anonymous",
    time:    serverTimestamp(),
    likes:   0,
    image:   imageUrl
  });

  // Clear the composer
  input.value = "";
  if (imageInput) imageInput.value = "";
};


// ============================================================
// STEP 6: LIKE A POST — adds 1 to the likes count
// ============================================================

window.likePost = async function (id) {
  const postRef = doc(db, "posts", id);
  await updateDoc(postRef, { likes: increment(1) });
};


// ============================================================
// STEP 7: DELETE A POST — removes it from Firestore
// ============================================================

window.deletePost = async function (id) {
  const postRef = doc(db, "posts", id);
  await deleteDoc(postRef);
};


// ============================================================
// STEP 8: FORMAT HASHTAGS
// Wraps any word starting with # in a styled <span>
// ============================================================

function formatPost(text) {
  if (!text) return "";
  return text.split(" ").map(function (word) {
    if (word.startsWith("#")) {
      return '<span class="post-tag">' + word + "</span>";
    }
    return word;
  }).join(" ");
}


// ============================================================
// STEP 9: TIME DISPLAY — "just now", "5m ago", "2h ago"
// ============================================================

function timeSince(date) {
  const secondsAgo = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secondsAgo < 60)    return "just now";
  if (secondsAgo < 3600)  return Math.floor(secondsAgo / 60) + "m ago";
  if (secondsAgo < 86400) return Math.floor(secondsAgo / 3600) + "h ago";
  return date.toLocaleDateString();
}


// ============================================================
// STEP 10: LIVE FEED
// onSnapshot watches Firestore and reruns every time a post
// is added, deleted, or changed — no page refresh needed!
// ============================================================

const postsQuery = query(
  collection(db, "posts"),
  orderBy("time", "desc") // newest posts at the top
);

onSnapshot(postsQuery, function (snapshot) {
  feed.innerHTML = ""; // clear the feed before redrawing

  snapshot.forEach(function (docSnap) {
    const post = docSnap.data(); // the post's data
    const id   = docSnap.id;    // the post's unique Firestore ID

    // Create the card
    const card = document.createElement("div");
    card.className = "post-card";

    // Hashtag line
    const tags = (post.message || "").split(" ").filter(w => w.startsWith("#"));
    if (tags.length > 0) {
      const tagDiv = document.createElement("div");
      tagDiv.className = "post-tag";
      tagDiv.textContent = tags.join(" ").toUpperCase();
      card.appendChild(tagDiv);
    }

    // Message
    const body = document.createElement("div");
    body.className = "post-body";
    body.innerHTML = formatPost(post.message);
    card.appendChild(body);

    // Image
    if (post.image) {
      const img = document.createElement("img");
      img.src = post.image;
      img.style.cssText = "width:100%; border-radius:8px; margin-top:8px;";
      card.appendChild(img);
    }

    // Username + time
    const meta = document.createElement("div");
    meta.className = "post-meta";
    const timeText = post.time && post.time.toDate ? timeSince(post.time.toDate()) : "just now";
    meta.innerHTML = "<span>" + (post.user || "Anonymous") + "</span><span>" + timeText + "</span>";
    card.appendChild(meta);

    // Like button
    const likeBtn = document.createElement("button");
    likeBtn.textContent = "🖤 " + (post.likes || 0);
    likeBtn.onclick = function () { likePost(id); };
    card.appendChild(likeBtn);

    // Delete button (shown on Anonymous posts)
    if (post.user === "Anonymous") {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.color = "red";
      delBtn.style.marginLeft = "8px";
      delBtn.onclick = function () { deletePost(id); };
      card.appendChild(delBtn);
    }

    feed.appendChild(card);
  });
});