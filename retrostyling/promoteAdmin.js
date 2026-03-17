import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwTGEf-VCbekJm6nb5FSs2cXyrL0TrsZE",
  authDomain: "etro-bf494.firebaseapp.com",
  projectId: "etro-bf494",
  storageBucket: "etro-bf494.firebasestorage.app",
  messagingSenderId: "209654975466",
  appId: "1:209654975466:web:dc33eb27b7a3dbf0954093",
  measurementId: "G-58PFM4YYYG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeAdmin() {
  const email = "admin@retrostylings.com";
  console.log(`Searching for user with email: ${email}`);
  
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("No user found with that email. Please make sure the user has signed up first.");
    process.exit(1);
  }

  const userDoc = querySnapshot.docs[0];
  await updateDoc(doc(db, "users", userDoc.id), {
    role: "admin"
  });

  console.log(`Success! User ${email} (UID: ${userDoc.id}) is now an Admin.`);
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error("Failed to update user role:", err);
  process.exit(1);
});
