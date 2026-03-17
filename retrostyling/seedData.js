import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";

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
  { id: 'cat1', name: 'T-Shirts', slug: 't-shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=2000' },
  { id: 'cat2', name: 'Hoodies', slug: 'hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=2000' },
  { id: 'cat3', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=2000' }
];

const products = [
  {
    name: 'Vintage Oversized Tee',
    slug: 'vintage-oversized-tee',
    description: 'A premium quality oversized t-shirt with a vintage wash. Perfect for casual streetwear looks.',
    price: 1299,
    discount_price: 999,
    on_sale: true,
    is_new: true,
    category_id: 'cat1',
    categoryName: 'T-Shirts',
    categorySlug: 't-shirts',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=1000',
    status: 'active',
    variants: [
      { size: 'S', color: 'Black', stock: 10 },
      { size: 'M', color: 'Black', stock: 20 },
      { size: 'L', color: 'Black', stock: 20 }
    ]
  },
  {
    name: 'Retro Logo Hoodie',
    slug: 'retro-logo-hoodie',
    description: 'Cozy fleece-lined hoodie with our signature retro logo embroidery.',
    price: 2499,
    discount_price: 1999,
    on_sale: true,
    is_new: false,
    category_id: 'cat2',
    categoryName: 'Hoodies',
    categorySlug: 'hoodies',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1000',
    status: 'active',
    variants: [
      { size: 'M', color: 'Grey', stock: 15 },
      { size: 'L', color: 'Grey', stock: 15 }
    ]
  },
  {
    name: 'Streetwear Cargo Pants',
    slug: 'streetwear-cargo-pants',
    description: 'Functional and stylish cargo pants with multi-pockets and adjustable ankle straps.',
    price: 2999,
    discount_price: 0,
    on_sale: false,
    is_new: true,
    category_id: 'cat1',
    categoryName: 'T-Shirts', // Putting it in t-shirts for now if I don't have a pants cat
    categorySlug: 't-shirts',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=1000',
    status: 'active',
    variants: []
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
  console.log("Starting seed...");
  
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
    await addDoc(collection(db, "products"), {
      ...prod,
      createdAt: serverTimestamp()
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

  console.log("Seed completed!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
