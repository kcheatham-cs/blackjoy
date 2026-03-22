import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  doc, updateDoc, deleteDoc, serverTimestamp, increment,
  getDocs, query, orderBy                          // ← added query + orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
 
// ── Firebase config ──
const firebaseConfig = {
  apiKey: "AIzaSyARp3DHryrTKulE4AshTAISMmHmLGrLCRY",
  authDomain: "black-joy.firebaseapp.com",
  projectId: "black-joy",
  storageBucket: "black-joy.firebasestorage.app",
  messagingSenderId: "415223431441",
  appId: "1:415223431441:web:2d9cd50eecca45a44fccb0"
};
 
// ── Initialize Firebase ──
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);          // ← THIS WAS MISSING — nothing worked without it
const storage = getStorage(app);
 
// ── Grab HTML elements (IDs now match your HTML exactly) ──
const input       = document.getElementById("postInput");  // fixed: was "Input"
const feed        = document.getElementById("Feed");       // fixed: was "feed"
const imageInput  = document.getElementById("imageInput");
 
// ── Username: read from localStorage or default to Anonymous ──
function getUsername() {
  return localStorage.getItem("bjUsername") || "Anonymous";
}
 
// ── Mock posts: seed Firestore if it's empty ──
const mockPosts = [
  { user: "QueenNia",  message: "Just got into Howard Medical School 🖤 First in my family! #blackjoy #winning", likes: 12 },
  { user: "MarcusB",   message: "Black excellence is not the exception — it's the standard ✊ #blackpeoplewinning", likes: 9 },
  { user: "ZoeSpeaks", message: "Support Black creators every day, not just in February 🙌 #community #blackjoy", likes: 21 }
];
 
async function seedMockPostsIfEmpty() {
  const snapshot = await getDocs(collection(db, "posts"));
  if (!snapshot.empty) return;  // already has data, skip
 
  for (let post of mockPosts) {
    await addDoc(collection(db, "posts"), {
      user: post.user,
      message: post.message,
      likes: post.likes,
      image: "",
      time: serverTimestamp()
    });
  }
}
seedMockPostsIfEmpty();
 
// ── Add a new post ──
window.addPost = async function () {
  const text     = input.value.trim();
  const username = getUsername();
 
  // Need at least text or an image
  if (!text && (!imageInput || !imageInput.files[0])) {
    alert("Write something or add a photo first!");
    return;
  }
 
  let imageUrl = "";
 
  // Upload image to Firebase Storage if one was chosen
  if (imageInput && imageInput.files[0]) {
    const file     = imageInput.files[0];
    const imageRef = ref(storage, "images/" + Date.now() + "-" + file.name);
    await uploadBytes(imageRef, file);
    imageUrl = await getDownloadURL(imageRef);
  }
 
  // Save post to Firestore — onSnapshot below will pick it up instantly
  await addDoc(collection(db, "posts"), {
    message: text,
    user:    username,
    time:    serverTimestamp(),
    likes:   0,
    image:   imageUrl
  });
 
  // Clear the composer
  input.value = "";
  if (imageInput) imageInput.value = "";
  localStorage.removeItem("bjDraft");
};
 
// ── Like a post ──
window.likePost = async function (id) {
  await updateDoc(doc(db, "posts", id), { likes: increment(1) });
};
 
// ── Delete a post ──
window.deletePost = async function (id) {
  await deleteDoc(doc(db, "posts", id));
};
 
// ── Save draft to localStorage ──
window.saveDraft = function () {
  const text = input.value;
  if (!text) { alert("Nothing to save!"); return; }
  localStorage.setItem("bjDraft", text);
  alert("Draft saved!");
};
 
// ── Format hashtags → gold spans ──
function formatPost(text) {
  if (!text) return "";
  return text.split(" ").map(word =>
    word.startsWith("#")
      ? `<span class="post-tag">${word}</span>`
      : word
  ).join(" ");
}
 
// ── LIVE FEED: onSnapshot fires instantly whenever Firestore changes ──
// orderBy("time", "desc") = newest post at the top
const postsQuery = query(collection(db, "posts"), orderBy("time", "desc"));
 
onSnapshot(postsQuery, function (snapshot) {
  feed.innerHTML = "";  // clear old posts
 
  snapshot.forEach(function (docSnap) {
    const post = docSnap.data();
    const id   = docSnap.id;
 
    // ── Build post card to match your existing HTML structure ──
    const card = document.createElement("div");
    card.className = "post-card";
 
    // Hashtags pulled from message
    const tags = (post.message || "").split(" ").filter(w => w.startsWith("#"));
    if (tags.length) {
      const tagDiv = document.createElement("div");
      tagDiv.className = "post-tag";
      tagDiv.textContent = tags.join(" ").toUpperCase();
      card.appendChild(tagDiv);
    }
 
    // Message body
    const body = document.createElement("div");
    body.className = "post-body";
    body.innerHTML = formatPost(post.message);
    card.appendChild(body);
 
    // Image (if any)
    if (post.image) {
      const img = document.createElement("img");
      img.src = post.image;
      img.style.cssText = "width:100%;border-radius:8px;margin-top:8px;";
      card.appendChild(img);
    }
 
    // Meta: username + time
    const meta = document.createElement("div");
    meta.className = "post-meta";
 
    const timeText = post.time?.toDate
      ? timeSince(post.time.toDate())
      : "just now";
 
    meta.innerHTML = `<span>${post.user || "Anonymous"}</span><span>${timeText}</span>`;
    card.appendChild(meta);
 
    // Like button
    const likeBtn = document.createElement("button");
    likeBtn.textContent = `🖤 ${post.likes || 0}`;
    likeBtn.style.cssText = "margin-top:8px;cursor:pointer;background:none;border:1px solid #444;border-radius:6px;padding:4px 12px;color:inherit;";
    likeBtn.onclick = () => likePost(id);
    card.appendChild(likeBtn);
 
    // Delete button — only show on your own posts
    if (post.user === getUsername()) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.cssText = "margin-top:8px;margin-left:8px;cursor:pointer;background:none;border:1px solid #e05252;border-radius:6px;padding:4px 12px;color:#e05252;";
      delBtn.onclick = () => deletePost(id);
      card.appendChild(delBtn);
    }
 
    feed.appendChild(card);
  });
});
 
// ── Helper: "3m ago", "2h ago" etc. ──
function timeSince(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return date.toLocaleDateString();
}
