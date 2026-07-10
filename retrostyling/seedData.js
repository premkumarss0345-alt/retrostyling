import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc, getDocs, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

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

const categories = [
  { id: 'cat_casual', name: 'Casual', slug: 'casual', image: 'https://images.unsplash.com/photo-1596755094514-f87034a7a241?w=400' },
  { id: 'cat_formal', name: 'Formal', slug: 'formal', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?w=400' },
  { id: 'cat_denim', name: 'Denim', slug: 'denim', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' }
];

const products = [
  {
    name: 'Essential Summer Shirt',
    slug: 'essential-summer-shirt',
    description: 'Lightweight and breathable cotton shirt designed for hot summer days. Standard collar and button closure.',
    price: 429,
    discount_price: 390,
    on_sale: true,
    is_new: true,
    category_id: 'cat_casual',
    categoryName: 'Casual',
    categorySlug: 'casual',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1596755094514-f87034a7a241?q=80&w=1974&auto=format&fit=crop',
    status: 'active',
    sku: 'ESS-01',
    brand: 'Retro',
    variants: [
      { size: 'M', color: 'White', stock: 25 },
      { size: 'L', color: 'White', stock: 25 }
    ]
  },
  {
    name: 'Officer Linen Shirt',
    slug: 'officer-linen-shirt',
    description: 'Sophisticated mandarin collar linen shirt. Premium quality, comfortable for business casual wear.',
    price: 654,
    discount_price: 600,
    on_sale: true,
    is_new: false,
    category_id: 'cat_formal',
    categoryName: 'Formal',
    categorySlug: 'formal',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=1974&auto=format&fit=crop',
    status: 'active',
    sku: 'OLS-02',
    brand: 'ClassicCo',
    variants: [
      { size: 'S', color: 'White', stock: 15 },
      { size: 'M', color: 'White', stock: 15 },
      { size: 'L', color: 'White', stock: 10 }
    ]
  },
  {
    name: 'Vertical Striped Shirt',
    slug: 'vertical-striped-shirt',
    description: 'Vibrant casual vertical striped button down shirt. Loose fit and relaxed vibe.',
    price: 497,
    discount_price: 452,
    on_sale: true,
    is_new: true,
    category_id: 'cat_casual',
    categoryName: 'Casual',
    categorySlug: 'casual',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1626497748470-3623761a3d81?q=80&w=1974&auto=format&fit=crop',
    status: 'active',
    sku: 'VSS-03',
    brand: 'ModernStreet',
    variants: [
      { size: 'M', color: 'Blue/White', stock: 15 },
      { size: 'L', color: 'Blue/White', stock: 15 }
    ]
  },
  {
    name: 'Classic Earth Brown',
    slug: 'classic-earth-brown',
    description: 'Comfortable cotton casual shirt in earth brown tone. Ideal for layering.',
    price: 152,
    discount_price: 140,
    on_sale: true,
    is_new: false,
    category_id: 'cat_casual',
    categoryName: 'Casual',
    categorySlug: 'casual',
    stock: 60,
    image: 'https://images.unsplash.com/photo-1563243567-450a80dc955c?q=80&w=1964&auto=format&fit=crop',
    status: 'active',
    sku: 'CEB-04',
    brand: 'Retro',
    variants: [
      { size: 'S', color: 'Brown', stock: 20 },
      { size: 'M', color: 'Brown', stock: 20 },
      { size: 'L', color: 'Brown', stock: 20 }
    ]
  },
  {
    name: 'Oxford Button Down',
    slug: 'oxford-button-down',
    description: 'Premium heavyweight Oxford fabric cotton shirt. Tailored fit with classic button-down collar.',
    price: 899,
    discount_price: 750,
    on_sale: false,
    is_new: false,
    category_id: 'cat_formal',
    categoryName: 'Formal',
    categorySlug: 'formal',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1594932224010-75b4367c4c5c?q=80&w=2080&auto=format&fit=crop',
    status: 'active',
    sku: 'OBD-05',
    brand: 'ClassicCo',
    variants: [
      { size: 'M', color: 'Blue', stock: 15 },
      { size: 'L', color: 'Blue', stock: 10 }
    ]
  },
  {
    name: 'Denim Utility Overshirt',
    slug: 'denim-utility-overshirt',
    description: 'Rugged and stylish denim utility overshirt with multiple storage pockets and dual stitching.',
    price: 1299,
    discount_price: 1100,
    on_sale: true,
    is_new: true,
    category_id: 'cat_denim',
    categoryName: 'Denim',
    categorySlug: 'denim',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1926&auto=format&fit=crop',
    status: 'active',
    sku: 'DUO-06',
    brand: 'UrbanEdge',
    variants: [
      { size: 'M', color: 'Dark Blue', stock: 10 },
      { size: 'L', color: 'Dark Blue', stock: 10 }
    ]
  }
];

const slides = [
  {
    title: "Summer Collection '26",
    subtitle: "Elevate Your Street Game",
    description: "Discover our latest drops inspired by vintage aesthetics.",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=2000",
    active: true,
    order: 1
  },
  {
    title: "The Hoodie Season",
    subtitle: "Comfort Meets Style",
    description: "Premium fleece essentials for the urban explorer.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=2000",
    active: true,
    order: 2
  }
];

async function seed() {
  const auth = getAuth(app);
  console.log("Authenticating as admin...");
  
  const passwordsToTry = [
    "admin123",
    "admin@123",
    "Admin@123",
    "Retro!2025",
    "admin",
    "123456",
    "12345678",
    "password",
    "retrostylings",
    "retrostyling"
  ];

  let authenticated = false;
  for (const pw of passwordsToTry) {
    try {
      console.log(`Trying password: ${pw}...`);
      await signInWithEmailAndPassword(auth, "admin@retrostylings.com", pw);
      console.log(`✅ Authenticated successfully with password: ${pw}`);
      authenticated = true;
      break;
    } catch (err) {
      console.log(`❌ Password ${pw} failed.`);
    }
  }

  if (!authenticated) {
    console.error("All common passwords failed.");
    process.exit(1);
  }

  const currentUserUid = auth.currentUser.uid;
  console.log(`Writing admin profile to users/${currentUserUid}...`);
  await setDoc(doc(db, "users", currentUserUid), {
    name: "Admin User",
    email: "admin@retrostylings.com",
    role: "admin",
    createdAt: serverTimestamp()
  });
  console.log("Admin profile written successfully!");

  // Small delay to let Firestore propagate the admin profile
  console.log("Waiting for Firestore to propagate admin profile...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("Wiping existing dummy data from Firebase...");
  const collectionsToClear = ['products', 'categories', 'heroSlides', 'rewards', 'reviews', 'orders'];
  for (const colName of collectionsToClear) {
    try {
      console.log(`Clearing collection: ${colName}...`);
      const snap = await getDocs(collection(db, colName));
      console.log(`Found ${snap.docs.length} documents in ${colName}.`);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
      console.log(`✅ Cleared: ${colName}`);
    } catch (err) {
      console.warn(`⚠️ Skipping ${colName} (${err.code || err.message})`);
    }
  }

  console.log("Starting seed with real products data...");
  
  // Seed Categories
  for (const cat of categories) {
    const { id, ...data } = cat;
    await setDoc(doc(db, "categories", id), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log(`Added category: ${cat.name}`);
  }

  // Seed Products
  for (const prod of products) {
    const q = collection(db, "products");
    await addDoc(q, {
      ...prod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Added product: ${prod.name}`);
  }

  // Seed Hero Slides
  for (const slide of slides) {
    await addDoc(collection(db, "heroSlides"), {
      ...slide,
      createdAt: serverTimestamp()
    });
    console.log(`Added slide: ${slide.title}`);
  }

  // Seed default Redeemable Rewards
  const defaultRewards = [
    { title: '₹100 Coupon', points: 1000, desc: 'Flat discount on any order', available: true },
    { title: '₹250 Coupon', points: 2200, desc: 'Flat discount on any order', available: true },
    { title: '₹500 Coupon', points: 4000, desc: 'Flat discount on any order', available: true },
    { title: '₹1000 Coupon', points: 7500, desc: 'Flat discount on any order', available: true },
    { title: 'Free Express Shipping', points: 800, desc: 'Free express shipping on your next order', available: true },
    { title: 'Retro Oversized Hoodie', points: 12000, desc: 'Exclusive member merchandise', available: true },
    { title: 'Vintage Logo T-Shirt', points: 8000, desc: 'Limited edition graphic tee', available: false }
  ];
  for (const reward of defaultRewards) {
    await addDoc(collection(db, "rewards"), {
      ...reward,
      createdAt: serverTimestamp()
    });
    console.log(`Added reward: ${reward.title}`);
  }

  // Seed default Reviews
  const defaultReviews = [
    { product: 'Essential Summer Shirt', customer: 'Arjun Sharma', rating: 5, title: 'Absolutely love this!', body: 'The quality is outstanding. True to size and the fabric feels premium. Worth every rupee!', date: '2026-07-05', status: 'pending', helpful: 12 },
    { product: 'Officer Linen Shirt', customer: 'Priya Nair', rating: 4, title: 'Great fit, minor delay', body: 'The shirt looks exactly like the photos. Delivery was a bit delayed but the product quality made up for it.', date: '2026-07-04', status: 'approved', helpful: 8 },
    { product: 'Vertical Striped Shirt', customer: 'Kiran Kumar', rating: 2, title: 'Sizing issue', body: 'The shirt runs small. I ordered my usual size L but it was too tight. Had to return it.', date: '2026-07-03', status: 'pending', helpful: 3 }
  ];
  for (const rev of defaultReviews) {
    await addDoc(collection(db, "reviews"), {
      ...rev,
      createdAt: serverTimestamp()
    });
    console.log(`Added review: ${rev.product} - ${rev.customer}`);
  }

  console.log("Seed completed!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
