//* script.js - module style (works in modern browsers)
   Paste your Firebase config into firebaseConfig below.
   Uses Firebase JS SDK (modular). */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* --------- REPLACE with your Firebase config from the console --------- */
const firebaseConfig = {
 apiKey: "AIzaSyDnV77fTs7K1UgF9BoQMG4R8278lOC6rao",
  authDomain: "bytecodee-3ca77.firebaseapp.com",
  projectId: "bytecodee-3ca77",
  storageBucket: "bytecodee-3ca77.firebasestorage.app",
  messagingSenderId: "318680597639",
  appId: "1:318680597639:web:ba8dc795ea53e6f863e422",
  measurementId: "G-MBJ5JCZ5F8"
};
/* --------------------------------------------------------------------- */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* DOM elements */
const courseList = document.getElementById("course-list");
const adminPanel = document.getElementById("admin-panel");
const loginForm = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const authStatus = document.getElementById("auth-status");
const addToggle = document.getElementById("add-course-toggle");
const addForm = document.getElementById("add-course-form");
const createCourseBtn = document.getElementById("create-course-btn");

/* Keeps track whether the signed-in user is admin (based on /admins/{uid} doc) */
let currentIsAdmin = false;

/* 1) Real-time listener for courses collection - displays and auto-updates */
const coursesCol = collection(db, "courses");
onSnapshot(coursesCol, snapshot => {
  courseList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;
    const el = document.createElement("div");
    el.className = "course";
    el.innerHTML = `
      <div>
        <strong>${data.name || "(no name)"}</strong><br>
        Fee: ₹<span class="fee" data-id="${id}">${data.fee ?? "0"}</span>
      </div>
      <div class="admin-controls" data-id="${id}">
        <!-- admin buttons inserted here if admin -->
      </div>
    `;
    courseList.appendChild(el);

    // If admin, add edit UI
    if (currentIsAdmin) {
      const controls = el.querySelector(".admin-controls");
      const input = document.createElement("input");
      input.type = "number";
      input.placeholder = "new fee";
      input.style.width = "110px";
      const btn = document.createElement("button");
      btn.textContent = "Update fee";
      btn.addEventListener("click", async () => {
        const val = Number(input.value);
        if (isNaN(val)) return alert("Enter a number");
        try {
          await updateDoc(doc(db, "courses", id), { fee: val });
          input.value = "";
        } catch (e) {
          console.error(e);
          alert("Update failed: " + e.message);
        }
      });

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete (console only)";
      delBtn.title = "Delete course via Firebase console (recommended)";

      controls.appendChild(input);
      controls.appendChild(btn);
      // (optional) add delete UI if you want to implement it later
    }
  });
});

/* 2) Auth form: login/logout */
loginForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle UI changes
  } catch (err) {
    alert("Login error: " + err.message);
    console.error(err);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

/* 3) Toggle add-course form */
addToggle.addEventListener("click", () => {
  addForm.style.display = addForm.style.display === "none" ? "block" : "none";
});

/* 4) Create new course (admin only) */
createCourseBtn.addEventListener("click", async () => {
  const name = document.getElementById("new-course-name").value.trim();
  const fee = Number(document.getElementById("new-course-fee").value);
  if (!name || isNaN(fee)) return alert("Enter valid name and fee");
  try {
    await addDoc(collection(db, "courses"), { name, fee });
    document.getElementById("new-course-name").value = "";
    document.getElementById("new-course-fee").value = "";
    addForm.style.display = "none";
  } catch (e) {
    console.error(e);
    alert("Create failed: " + e.message);
  }
});

/* 5) onAuthStateChanged: check admin status and show/hide admin UI */
onAuthStateChanged(auth, async user => {
  if (user) {
    authStatus.textContent = `Signed in: ${user.email}`;
    logoutBtn.style.display = "inline-block";
    loginBtn.style.display = "none";
    // check admins collection for this user's UID
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      currentIsAdmin = adminDoc.exists() && adminDoc.data().isAdmin === true;
      if (currentIsAdmin) {
        adminPanel.style.display = "block";
      } else {
        adminPanel.style.display = "none";
      }
    } catch (e) {
      console.error("Admin check failed", e);
      currentIsAdmin = false;
      adminPanel.style.display = "none";
    }
  } else {
    authStatus.textContent = "";
    logoutBtn.style.display = "none";
    loginBtn.style.display = "inline-block";
    adminPanel.style.display = "none";
    currentIsAdmin = false;
  }
});
