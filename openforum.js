import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";



const firebaseConfig = {
  apiKey: "AIzaSyARp3DHryrTKulE4AshTAISMmHmLGrLCRY",
  authDomain: "black-joy.firebaseapp.com",
  projectId: "black-joy",
  storageBucket: "black-joy.firebasestorage.app",
  messagingSenderId: "415223431441",
  appId: "1:415223431441:web:2d9cd50eecca45a44fccb0",
  measurementId: "G-8XS97N87QE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const input = document.getElementById("Input");
const feed = document.getElementById("Feed");

window.addPost = async function (){
  let text = input.value;

  if (text ===""){
    alert("Cat gotcha tongue? Type Something!");
    return;

  }
await addDoc(collection(db,"posts"),{
  message: text,
  time: serverTimestamp(),
  likes: 0,
});
  input.value = "";

};
window.likePost = async function (id,currentLikes){
  let postRef = doc(db,"posts", id);
  await updateDoc (postRef, {likes: currentLikes + 1});
};
onSnapshot(collection(db,"posts"), function(snapshot){
  feed.innerHTML = "";
  snapshot.forEach(function(docSnap){
    let post = docSnap.data();
    let id = docSnap.id;

    let div = document.createElement("div");
    div.style.border = "1px solid black";
    div.style.padding = "10px";
    div.style.margin = "10px";
  div.className = "post";
  div.innerHTML=
    "<p>" + post.message + "</p>" +
      "<p onclick=\"likePost('" + id + "', " + (post.likes || 0) + ")\">" +
      (post.likes || 0) + " like</p>" +
      "<small>" +
      (post.time?.toDate()?.toLocaleString() || "") +
      "</small>";
    feed.appendChild(div);

});
});