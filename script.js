// ====== PASTE YOUR FIREBASE CONFIG OBJECT HERE ======
// Replace the object below with the one from your Firebase web app settings.
const firebaseConfig = {
 apiKey: "AIzaSyASSaCcT6gK2Fn2awLJoyTYjYI-eYGOWjg",
  authDomain: "bytecode-ad6e7.firebaseapp.com",
  projectId: "bytecode-ad6e7",
  storageBucket: "bytecode-ad6e7.firebasestorage.app",
  messagingSenderId: "728517154808",
  appId: "1:728517154808:web:4ca2258140bd936f11280d",
  measurementId: "G-BZJ3L4EDMR"
}
// ====================================================

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// UI elements
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const coursesList = document.getElementById('coursesList');
const adminSection = document.getElementById('admin-section');
const dashboardSection = document.getElementById('dashboard-section');
const enrollmentsList = document.getElementById('enrollmentsList');
const adminCourses = document.getElementById('adminCourses');
const courseForm = document.getElementById('courseForm');

const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnAdmin = document.getElementById('btn-admin');
const btnDashboard = document.getElementById('btn-dashboard');
const btnHome = document.getElementById('btn-home');

let currentUser = null;
let isAdmin = false;

/* ---------- Navigation handlers ---------- */
btnLogin.onclick = ()=> { authSection.style.display = 'block'; adminSection.style.display='none'; dashboardSection.style.display='none'; };
btnHome.onclick = ()=> { authSection.style.display = 'none'; adminSection.style.display='none'; dashboardSection.style.display='none'; };
btnAdmin.onclick = ()=> { adminSection.style.display = isAdmin ? 'block' : 'none'; authSection.style.display='none'; dashboardSection.style.display='none'; loadAdminCourses(); };
btnDashboard.onclick = ()=> { dashboardSection.style.display = 'block'; authSection.style.display='none'; adminSection.style.display='none'; loadEnrollments(); };

/* ---------- Auth ---------- */
registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  const res = await auth.createUserWithEmailAndPassword(email, pass);
  await res.user.updateProfile({ displayName: name });
  // create user doc
  await db.collection('users').doc(res.user.uid).set({
    name, email, role: 'student', createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  registerForm.reset();
  alert('Registered & logged in');
});

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  await auth.signInWithEmailAndPassword(email, pass);
  loginForm.reset();
});

/* ---------- Auth state listener ---------- */
auth.onAuthStateChanged(async user => {
  currentUser = user;
  if (user) {
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    btnDashboard.style.display = 'inline-block';
    // check admin status: read admins collection for doc with id = uid
    const adminDoc = await db.collection('admins').doc(user.uid).get();
    isAdmin = adminDoc.exists && adminDoc.data().role === 'admin';
    if (isAdmin) {
      btnAdmin.style.display = 'inline-block';
    } else {
      btnAdmin.style.display = 'none';
      adminSection.style.display = 'none';
    }
    authSection.style.display = 'none';
  } else {
    currentUser = null;
    isAdmin = false;
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    btnAdmin.style.display = 'none';
    btnDashboard.style.display = 'none';
  }
});

/* ---------- Logout ---------- */
btnLogout.addEventListener('click', async () => {
  await auth.signOut();
  window.location.reload();
});

/* ---------- Load courses (realtime) ---------- */
function renderCourseCard(doc) {
  const d = doc.data();
  const div = document.createElement('div');
  div.className = 'courseCard';
  div.innerHTML = `
    <h4>${escapeHtml(d.title || 'No title')}</h4>
    <div class="small">${escapeHtml(d.category || '')} • ₹${d.price ?? '0'}</div>
    <p class="small">${escapeHtml(d.description || '')}</p>
    <div class="actionRow">
      <button class="enrollBtn">Enroll</button>
      <button class="viewBtn">View</button>
    </div>
  `;
  // enroll handler
  div.querySelector('.enrollBtn').onclick = () => enrollCourse(doc.id, d);
  div.querySelector('.viewBtn').onclick = () => alert('Course: ' + (d.title||''));
  return div;
}

function loadCourses() {
  coursesList.innerHTML = '';
  db.collection('courses').orderBy('createdAt','desc').onSnapshot(snapshot => {
    coursesList.innerHTML = '';
    snapshot.forEach(doc => {
      coursesList.appendChild(renderCourseCard(doc));
    });
  });
}
loadCourses();

/* ---------- Enroll (MVP: creates enrollment record) ---------- */
async function enrollCourse(courseId, courseData) {
  if (!currentUser) { alert('Please login to enroll'); return; }
  // For payment: integrate Stripe Checkout from Functions (next step).
  await db.collection('enrollments').add({
    userId: currentUser.uid,
    courseId,
    courseTitle: courseData.title || '',
    pricePaid: courseData.price || 0,
    status: 'active', // or 'pending' if using payment integration
    enrolledAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert('You are enrolled! Check your dashboard.');
  loadEnrollments();
}

/* ---------- Student dashboard: show enrollments ---------- */
async function loadEnrollments() {
  enrollmentsList.innerHTML = '';
  if (!currentUser) { enrollmentsList.innerHTML = '<div class="small">Login to see enrollments.</div>'; return; }
  const q = db.collection('enrollments').where('userId','==', currentUser.uid).orderBy('enrolledAt','desc');
  const snap = await q.get();
  if (snap.empty) { enrollmentsList.innerHTML = '<div class="small">No enrollments yet.</div>'; return; }
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement('div');
    div.className = 'courseCard';
    div.innerHTML = `<strong>${escapeHtml(d.courseTitle)}</strong><div class="small">Status: ${d.status}</div>`;
    enrollmentsList.appendChild(div);
  });
}

/* ---------- Admin: add/edit courses ---------- */
courseForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isAdmin) { alert('Admin only'); return; }
  const id = document.getElementById('courseId').value;
  const title = document.getElementById('courseTitle').value.trim();
  const category = document.getElementById('courseCategory').value.trim();
  const desc = document.getElementById('courseDesc').value.trim();
  const price = parseFloat(document.getElementById('coursePrice').value) || 0;
  if (!title) { alert('Title required'); return; }

  if (id) {
    await db.collection('courses').doc(id).update({ title, category, description: desc, price, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert('Course updated');
  } else {
    await db.collection('courses').add({ title, category, description: desc, price, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert('Course created');
  }
  courseForm.reset();
  document.getElementById('cancelEdit').style.display = 'none';
});

document.getElementById('cancelEdit').addEventListener('click', () => {
  courseForm.reset();
  document.getElementById('cancelEdit').style.display = 'none';
});

async function loadAdminCourses() {
  adminCourses.innerHTML = '';
  const snap = await db.collection('courses').orderBy('createdAt','desc').get();
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement('div');
    div.className = 'courseCard';
    div.innerHTML = `<h4>${escapeHtml(d.title)}</h4><div class="small">₹${d.price}</div><div class="actionRow"></div>`;
    const actionRow = div.querySelector('.actionRow');
    const editBtn = document.createElement('button'); editBtn.textContent = 'Edit';
    const delBtn = document.createElement('button'); delBtn.textContent = 'Delete';
    editBtn.onclick = () => {
      document.getElementById('courseId').value = doc.id;
      document.getElementById('courseTitle').value = d.title || '';
      document.getElementById('courseCategory').value = d.category || '';
      document.getElementById('courseDesc').value = d.description || '';
      document.getElementById('coursePrice').value = d.price || 0;
      document.getElementById('cancelEdit').style.display = 'inline-block';
      window.scrollTo(0,0);
    };
    delBtn.onclick = async () => {
      if (confirm('Delete this course?')) {
        await db.collection('courses').doc(doc.id).delete();
        loadAdminCourses();
      }
    };
    actionRow.appendChild(editBtn); actionRow.appendChild(delBtn);
    adminCourses.appendChild(div);
  });
}

/* ---------- Utility: escapeHtml ---------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ---------- INITIAL NOTES ----------
- PASTE firebaseConfig at top.
- To make a user an admin: in Firestore add collection "admins" and create document with id = that user's UID and field: { role: "admin" }.
  Then sign in as that user; admin buttons will appear.
- Payments: currently enroll creates an enrollment record with status 'active'.
  To add Stripe, you'll create a Cloud Function that returns a Checkout Session and a webhook to update status.
-------------------------------------- */
