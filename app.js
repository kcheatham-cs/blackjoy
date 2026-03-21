import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from "firebase/auth";

// Black Joy Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyARp3DHryrTKulE4AshTAISMmHmLGrLCRY",
  authDomain: "black-joy.firebaseapp.com",
  projectId: "black-joy",
  storageBucket: "black-joy.firebasestorage.app",
  messagingSenderId: "415223431441",
  appId: "1:415223431441:web:2d9cd50eecca45a44fccb0",
  measurementId: "G-8XS97N87QE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// create auth
const auth = getAuth(app);

// app data
const HASHTAGS = [
    { id: 'Black Achievements', label: '#BLACKPEOPLEWINNING'},
    { id: 'All Facts Black', label: '#WEDIDDAT'},
    { id: 'Black Politics', label: '#BLACKPEOPLEWITHPOWER'},
    { id: 'Louisiana Food Related', label: '#WHEREWEFINNAEATAT?'},
    { id: 'Helpful Tips & Tricks', label: '#HELPABROTHAOUT'},
    { id: 'Resources', label: '#NEEDDAT'},
    { id: 'Sports', label: '#THEGAMEON?'},
    { id: 'Entertainment', label: '#WELITTTTT'},

];
// control what users sees + tab switch
let activeTab = 'Black Achievements';

function switchTab(tabName) {
    activeTab = tabName;
    renderContent();
    // updates & displays what user sees

    //Highlights the user contents
    const buttons = document.querySelectorAll( 'tabContainer button');
    buttons.forEach(btn => {
        if (btn.textContent ===tabName) {
            btn.style.backgroundColor = "FFD700";
        } else {
            btn.style.backgroundColor = ""; 
        }
    });
 }

function renderContent() {
    const content = document.getElementById("content");
    const tab = HASHTAGS.find(t => t.id === activeTab);

    if (tab) { 
        content.innerHTML = `<h2>${tab.label}</h2>`;
    }
 }
 
// Tracking if user passed verification
let verified = false;

//Page loads
function checkVerification(){
    //if already passed the quiz, it'll be skipped
    if (localStorage.getItem("verified") === "true") {
        verified = true;
        showSignupPage();
    } else { 
        askInitialQuestion();
    }
}

//Question #1
function askInitialQuestion() { 
    const answer = prompt("What does this mean WWGITSDTNDLANDAFN?"); 
    const validAnswers = ["when we go in this store don't touch nothing don't look at nothing don't ask for nothing"];
    if (validAnswers.includes(answer.toLowerCase())) {
        verified = true;
        localStorage.setItem("verified", true);
        showSignUpPage();
    } else { 
        askRedemptionQuestion();
    }
}

// Redemption question
function askRedemptionQuestion() {
    const answer = prompt("Who is your mom not?");
    const validAnswers = ["your lil friend", "booboo the fool"];
    if (validAnswers.includes(answer.toLowerCase())) {
        verified = true;
        localStorage.setItem("verified", true); 
        showSignupPage();
    } else {
        alert("Black Card Revoked!!!!!");
    }
}
// 

function onLoginComplete() {
    document.getElementById("login").style.display = "none"; // hide login
    document.getElementById("signupPage").style.display = "none"; // hide signup if needed
    document.getElementById("tabContainer").style.display = "block"; // show tabs
    document.getElementById("categoriesSection").style.display = "block"; // show categories
}

function showSignupPage() {
    document.getElementById("signupForm").style.display = "block";
}

//User Signup after verification
 function signUp(){
    if (!verified){
        alert("AYYYEEE You got in!!");
        return;
    }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => alert("User created!"))
        .catch(e => alert(e.message));

} 
 // User login
function login() {
    const email = document.getElementById('logUser').value;
    const password = document.getElementById('logPass').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .then(() => alert("Logged in!"))
        .catch(e => alert(e.message)); 
}
// User logout 
function logOut(){
    signOut(auth)
        .then(() => alert("Logged out!"))
        .catch(e => alert(e.message));
}





