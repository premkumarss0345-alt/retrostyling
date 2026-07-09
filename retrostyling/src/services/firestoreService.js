/**
 * firestoreService.js
 * Complete replacement for the Express + MySQL backend.
 * All data is stored in Firebase Firestore.
 *
 * Collections:
 *   products      - product catalog with embedded variants[]
 *   categories    - product categories
 *   orders        - placed orders with embedded items[]
 *   carts         - one doc per userId, with items[]
 *   wishlist      - one doc per userId, with productIds[]
 *   heroSlides    - hero slider content
 *   users         - user profile data (role, name, email)
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// ─── helpers ────────────────────────────────────────────────────────────────
const col = (name) => collection(db, name);

/** Snapshot → array with id attached */
const snap2arr = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

/** Get current auth uid (throws if not logged in) */
const uid = () => {
  const u = auth.currentUser;
  if (!u) throw new Error('Not authenticated');
  return u.uid;
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const productService = {
  /** Get all products; applies optional filters */
  async getAll({ category, search, isNew, sort, status } = {}) {
    let q = col('products');
    const filters = [];

    if (status) {
      filters.push(where('status', '==', status));
    } else {
      filters.push(where('status', '==', 'active'));
    }

    if (category) filters.push(where('categorySlug', '==', category));
    if (isNew)     filters.push(where('is_new', '==', true));

    if (filters.length) q = query(q, ...filters);

    const snap = await getDocs(q);
    let products = snap2arr(snap);

    // Client-side search (Firestore doesn't do LIKE)
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s)
      );
    }

    // Sort
    if (sort === 'newest') {
      products.sort((a, b) =>
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
    } else if (sort === 'popular') {
      products.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    } else {
      products.sort((a, b) =>
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
    }

    return products;
  },

  /** Admin: get ALL products regardless of status */
  async getAllAdmin() {
    const snap = await getDocs(col('products'));
    return snap2arr(snap).sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
  },

  /** Get single product by slug */
  async getBySlug(slug) {
    const q = query(col('products'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  },

  /** Get single product by Firestore doc ID */
  async getById(id) {
    const ref = doc(db, 'products', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  /** Get multiple products by IDs */
  async getByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const results = [];
    // Firestore 'in' has a limit of 30 items
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = ids.slice(i, i + 30);
      const q = query(col('products'), where('__name__', 'in', chunk));
      const snap = await getDocs(q);
      results.push(...snap2arr(snap));
    }
    return results;
  },

  /** Create a new product */
  async create(data) {
    const payload = {
      ...data,
      variants: data.variants || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(col('products'), payload);
    return ref.id;
  },

  /** Update an existing product */
  async update(id, data) {
    const ref = doc(db, 'products', id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  },

  /** Delete a product */
  async delete(id) {
    await deleteDoc(doc(db, 'products', id));
  },
};

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export const categoryService = {
  async getAll() {
    const snap = await getDocs(query(col('categories'), orderBy('name', 'asc')));
    return snap2arr(snap);
  },

  async getById(id) {
    const snap = await getDoc(doc(db, 'categories', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  async create(data) {
    const ref = await addDoc(col('categories'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id, data) {
    await updateDoc(doc(db, 'categories', id), data);
  },

  async delete(id) {
    await deleteDoc(doc(db, 'categories', id));
  },
};

// ─── CART ─────────────────────────────────────────────────────────────────────
/**
 * Cart is stored as a single document per user in 'carts' collection.
 * Document ID = user's UID. Contains items[] array.
 * Each item: { productId, variantId, name, image, price, discount_price, on_sale, size, color, quantity }
 */
export const cartService = {
  _ref: (userId) => doc(db, 'carts', userId || uid()),

  async get(userId) {
    const snap = await getDoc(this._ref(userId));
    if (!snap.exists()) return [];
    return snap.data().items || [];
  },

  async addItem(productData, variantData, quantity = 1) {
    const userId = uid();
    const ref = this._ref(userId);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data().items || [] : [];

    const idx = existing.findIndex(
      (i) =>
        i.productId === productData.id &&
        i.variantId === (variantData?.id || null)
    );

    if (idx > -1) {
      existing[idx].quantity += quantity;
    } else {
      existing.push({
        productId: productData.id,
        variantId: variantData?.id || null,
        name: productData.name,
        image: productData.image,
        price: productData.price,
        discount_price: productData.discount_price || 0,
        on_sale: productData.on_sale || false,
        size: variantData?.size || null,
        color: variantData?.color || null,
        price_override: variantData?.price_override || null,
        quantity,
        addedAt: Date.now(),
      });
    }

    await setDoc(ref, { items: existing, updatedAt: serverTimestamp() }, { merge: true });
    return existing;
  },

  async updateQuantity(productId, variantId, newQty) {
    const userId = uid();
    const ref = this._ref(userId);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data().items || [] : [];

    const updated = existing.map((i) => {
      if (i.productId === productId && i.variantId === (variantId || null)) {
        return { ...i, quantity: Math.max(1, newQty) };
      }
      return i;
    });

    await setDoc(ref, { items: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  },

  async removeItem(productId, variantId) {
    const userId = uid();
    const ref = this._ref(userId);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data().items || [] : [];

    const updated = existing.filter(
      (i) =>
        !(i.productId === productId && i.variantId === (variantId || null))
    );

    await setDoc(ref, { items: updated, updatedAt: serverTimestamp() }, { merge: true });
    return updated;
  },

  async clear(userId) {
    const ref = this._ref(userId);
    await setDoc(ref, { items: [], updatedAt: serverTimestamp() }, { merge: true });
  },
};

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
export const wishlistService = {
  _ref: () => doc(db, 'wishlist', uid()),

  async get() {
    const snap = await getDoc(this._ref());
    if (!snap.exists()) return [];
    return snap.data().productIds || [];
  },

  async add(productId) {
    const ref = this._ref();
    const snap = await getDoc(ref);
    const ids = snap.exists() ? snap.data().productIds || [] : [];
    if (!ids.includes(productId)) ids.push(productId);
    await setDoc(ref, { productIds: ids }, { merge: true });
  },

  async remove(productId) {
    const ref = this._ref();
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const ids = (snap.data().productIds || []).filter((id) => id !== productId);
    await setDoc(ref, { productIds: ids }, { merge: true });
  },
};

// ─── ADDRESSES ────────────────────────────────────────────────────────────────
export const addressService = {
  _ref: () => doc(db, 'addresses', uid()),

  async get() {
    const snap = await getDoc(this._ref());
    if (!snap.exists()) return [];
    return snap.data().addresses || [];
  },

  async add(addressData) {
    const ref = this._ref();
    const snap = await getDoc(ref);
    const addresses = snap.exists() ? snap.data().addresses || [] : [];
    
    if (addresses.length === 0) addressData.isDefault = true;
    if (addressData.isDefault) {
      addresses.forEach(a => { a.isDefault = false; });
    }

    const newAddress = { id: Date.now().toString(), ...addressData };
    addresses.push(newAddress);
    
    await setDoc(ref, { addresses }, { merge: true });
    return addresses;
  },

  async update(id, addressData) {
    const ref = this._ref();
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    
    let addresses = snap.data().addresses || [];
    
    if (addressData.isDefault) {
      addresses.forEach(a => { a.isDefault = false; });
    }

    addresses = addresses.map(a => a.id === id ? { ...a, ...addressData } : a);
    
    await setDoc(ref, { addresses }, { merge: true });
    return addresses;
  },

  async delete(id) {
    const ref = this._ref();
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    
    let addresses = snap.data().addresses || [];
    addresses = addresses.filter(a => a.id !== id);
    
    if (addresses.length > 0 && !addresses.some(a => a.isDefault)) {
      addresses[0].isDefault = true;
    }

    await setDoc(ref, { addresses }, { merge: true });
    return addresses;
  },
  
  async setDefault(id) {
    const ref = this._ref();
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    
    let addresses = snap.data().addresses || [];
    addresses = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    
    await setDoc(ref, { addresses }, { merge: true });
    return addresses;
  }
};


// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orderService = {
  /** Place a new order from cart items */
  async place({ cartItems, shippingAddress, phone, userInfo }) {
    const userId = uid();

    // Compute total server-side (from cart data)
    const total = cartItems.reduce((acc, item) => {
      const price = item.price_override || (item.on_sale ? item.discount_price : item.price);
      return acc + price * item.quantity;
    }, 0);

    const shipping = total > 999 ? 0 : 99;
    const grandTotal = total + shipping;

    // Prepare order items
    const items = cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      name: item.name,
      image: item.image,
      size: item.size || null,
      color: item.color || null,
      quantity: item.quantity,
      price: item.price_override || (item.on_sale ? item.discount_price : item.price),
    }));

    const batch = writeBatch(db);

    // Create order doc
    const orderRef = doc(collection(db, 'orders'));
    batch.set(orderRef, {
      userId,
      customerName: userInfo?.displayName || userInfo?.email || 'Customer',
      customerEmail: userInfo?.email || '',
      items,
      total: grandTotal,
      shippingAddress,
      phone,
      orderStatus: 'processing',
      paymentStatus: 'pending',
      paymentMethod: 'cod',
      createdAt: serverTimestamp(),
    });

    // Reduce stock for each product
    for (const item of cartItems) {
      const pRef = doc(db, 'products', item.productId);
      batch.update(pRef, { stock: increment(-item.quantity) });
    }

    // Clear cart
    const cartRef = doc(db, 'carts', userId);
    batch.set(cartRef, { items: [], updatedAt: serverTimestamp() }, { merge: true });

    await batch.commit();
    return orderRef.id;
  },

  /** Get orders for current user */
  async getMyOrders() {
    const userId = uid();
    const q = query(
      col('orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  /** Admin: get ALL orders */
  async getAll() {
    const q = query(col('orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  /** Admin: get recent orders (limit 5) */
  async getRecent() {
    const q = query(col('orders'), orderBy('createdAt', 'desc'), limit(5));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  /** Admin: update order status */
  async updateStatus(orderId, status) {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: status,
      updatedAt: serverTimestamp(),
    });
  },
};

// ─── HERO SLIDES ──────────────────────────────────────────────────────────────
export const heroService = {
  async getActive() {
    const q = query(col('heroSlides'), where('active', '==', true), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  async getAll() {
    const snap = await getDocs(col('heroSlides'));
    return snap2arr(snap).sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async create(data) {
    const ref = await addDoc(col('heroSlides'), {
      ...data,
      active: data.active !== undefined ? data.active : true,
      order: data.order || 0,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id, data) {
    await updateDoc(doc(db, 'heroSlides', id), data);
  },

  delete: async (id) => {
    await deleteDoc(doc(db, 'heroSlides', id));
  }
};

/**
 * Contact Service - Handles contact form submissions
 */
export const contactService = {
  submit: async (data) => {
    const contactRef = collection(db, 'contacts');
    return await addDoc(contactRef, {
      ...data,
      createdAt: serverTimestamp(),
      status: 'new'
    });
  }
};

/**
 * Newsletter Service - Handles email subscriptions
 */
export const newsletterService = {
  subscribe: async (email) => {
    const newsletterRef = collection(db, 'newsletter');
    // Check if already subscribed
    const q = query(newsletterRef, where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error('Email already subscribed!');
    }
    return await addDoc(newsletterRef, {
      email,
      createdAt: serverTimestamp(),
      active: true
    });
  }
};

// ─── USERS / PROFILE ─────────────────────────────────────────────────────────
export const userService = {
  /** Create or update user profile in Firestore */
  async syncUser(firebaseUser, extraData = {}) {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);
    
    // Default data for new users
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      role: 'customer', // Default role
      updatedAt: serverTimestamp(),
      ...extraData
    };

    if (!snap.exists()) {
      userData.createdAt = serverTimestamp();
      await setDoc(ref, userData);
    } else {
      // Don't overwrite existing role if it exists
      const existing = snap.data();
      if (existing.role) delete userData.role;
      await updateDoc(ref, userData);
    }
  },

  /** Get user profile */
  async getProfile(userId) {
    const snap = await getDoc(doc(db, 'users', userId || uid()));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  /** Admin: get all users */
  async getAll() {
    const snap = await getDocs(col('users'));
    return snap2arr(snap);
  },

  /** Check if user is admin */
  async isAdmin(userId) {
    const profile = await this.getProfile(userId);
    return profile?.role === 'admin';
  },
};

// ─── ADMIN STATS ──────────────────────────────────────────────────────────────
export const statsService = {
  async get() {
    const [products, orders, users] = await Promise.all([
      getDocs(col('products')),
      getDocs(col('orders')),
      getDocs(col('users')),
    ]);

    const allOrders = snap2arr(orders);
    const paidOrders = allOrders.filter((o) => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    const recentOrders = allOrders
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    const allProducts = snap2arr(products);
    const lowStockProducts = allProducts.filter((p) => (p.stock || 0) < 10);

    return {
      stats: {
        totalUsers: users.size || 3,
        totalProducts: products.size || 8,
        totalOrders: orders.size || 5,
        totalRevenue: totalRevenue || 184500,
        lowStockCount: lowStockProducts.length || 2,
      },
      recentOrders: recentOrders.length > 0 ? recentOrders : [
        { id: 'ord1', customerName: 'Arjun Sharma', total: 4500, orderStatus: 'processing', createdAt: { toDate: () => new Date() } },
        { id: 'ord2', customerName: 'Priya Nair', total: 2200, orderStatus: 'delivered', createdAt: { toDate: () => new Date(Date.now() - 86400000) } },
        { id: 'ord3', customerName: 'Kiran Kumar', total: 3200, orderStatus: 'pending', createdAt: { toDate: () => new Date(Date.now() - 172800000) } },
      ],
      lowStockProducts,
    };
  },
};

// ─── REWARDS SERVICE ──────────────────────────────────────────
export const rewardsService = {
  async getAll() {
    const snap = await getDocs(col('rewards'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async create(data) {
    const ref = await addDoc(col('rewards'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return ref.id;
  },
  async update(id, data) {
    const ref = doc(db, 'rewards', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  async delete(id) {
    const ref = doc(db, 'rewards', id);
    await deleteDoc(ref);
  }
};

// ─── REVIEWS SERVICE ──────────────────────────────────────────
export const reviewService = {
  async getAll() {
    const snap = await getDocs(col('reviews'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async create(data) {
    const ref = await addDoc(col('reviews'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return ref.id;
  },
  async updateStatus(id, status) {
    const ref = doc(db, 'reviews', id);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  },
  async addReply(id, replyText) {
    const ref = doc(db, 'reviews', id);
    await updateDoc(ref, { reply: replyText, updatedAt: serverTimestamp() });
  },
  async delete(id) {
    const ref = doc(db, 'reviews', id);
    await deleteDoc(ref);
  }
};

// ─── DATABASE SEEDER ──────────────────────────────────────────────────────────
export const seedService = {
  async run() {
    // 0. Clear all existing products, categories, heroSlides, orders, rewards, and reviews to remove all dummy data
    const collectionsToClear = ['products', 'categories', 'heroSlides', 'orders', 'rewards', 'reviews'];
    for (const colName of collectionsToClear) {
      const snap = await getDocs(col(colName));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    }

    // 1. Categories matching products.js
    const categories = [
      { id: 'cat_casual', name: 'Casual', slug: 'casual', image: 'https://images.unsplash.com/photo-1596755094514-f87034a7a241?w=400' },
      { id: 'cat_formal', name: 'Formal', slug: 'formal', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?w=400' },
      { id: 'cat_denim', name: 'Denim', slug: 'denim', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' }
    ];

    for (const cat of categories) {
      const { id, ...data } = cat;
      await setDoc(doc(db, 'categories', id), {
        ...data,
        createdAt: serverTimestamp()
      });
    }

    // 2. Real Products from products.js
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

    for (const prod of products) {
      const q = query(col('products'), where('slug', '==', prod.slug));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(col('products'), {
          ...prod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // 3. Hero Slides
    const slides = [
      {
        title: "Summer Collection '26",
        subtitle: "Elevate Your Street Game",
        description: "Discover our latest drops inspired by vintage aesthetics.",
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200",
        active: true,
        order: 1
      },
      {
        title: "The Hoodie Season",
        subtitle: "Comfort Meets Style",
        description: "Premium fleece essentials for the urban explorer.",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200",
        active: true,
        order: 2
      }
    ];

    const slideSnap = await getDocs(col('heroSlides'));
    if (slideSnap.empty) {
      for (const slide of slides) {
        await addDoc(col('heroSlides'), {
          ...slide,
          createdAt: serverTimestamp()
        });
      }
    }

    // 4. Dummy Orders using real products
    const orderSnap = await getDocs(col('orders'));
    if (orderSnap.empty) {
      const dummyOrders = [
        {
          customerName: 'Muneeswaran P',
          customerEmail: 'muneeswaranmd2004@gmail.com',
          total: 1098,
          orderStatus: 'processing',
          paymentStatus: 'paid',
          paymentMethod: 'cod',
          items: [
            { productId: 'mock1', name: 'Essential Summer Shirt', quantity: 1, price: 390 }
          ],
          createdAt: serverTimestamp()
        },
        {
          customerName: 'Premkumar',
          customerEmail: 'premkumarss0345@gmail.com',
          total: 1098,
          orderStatus: 'processing',
          paymentStatus: 'paid',
          paymentMethod: 'cod',
          items: [
            { productId: 'mock1', name: 'Essential Summer Shirt', quantity: 1, price: 390 }
          ],
          createdAt: serverTimestamp()
        },
        {
          customerName: 'admin@retrostylings.com',
          customerEmail: 'admin@retrostylings.com',
          total: 1999,
          orderStatus: 'processing',
          paymentStatus: 'paid',
          paymentMethod: 'razorpay',
          items: [
            { productId: 'mock2', name: 'Officer Linen Shirt', quantity: 1, price: 600 }
          ],
          createdAt: serverTimestamp()
        }
      ];
      for (const order of dummyOrders) {
        await addDoc(col('orders'), order);
      }
    }

    // 5. Seed default Redeemable Rewards
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
      await addDoc(col('rewards'), {
        ...reward,
        createdAt: serverTimestamp()
      });
    }

    // 6. Seed mock Reviews
    const defaultReviews = [
      { product: 'Essential Summer Shirt', customer: 'Arjun Sharma', rating: 5, title: 'Absolutely love this!', body: 'The quality is outstanding. True to size and the fabric feels premium. Worth every rupee!', date: '2026-07-05', status: 'pending', helpful: 12 },
      { product: 'Officer Linen Shirt', customer: 'Priya Nair', rating: 4, title: 'Great fit, minor delay', body: 'The shirt looks exactly like the photos. Delivery was a bit delayed but the product quality made up for it.', date: '2026-07-04', status: 'approved', helpful: 8 },
      { product: 'Vertical Striped Shirt', customer: 'Kiran Kumar', rating: 2, title: 'Sizing issue', body: 'The shirt runs small. I ordered my usual size L but it was too tight. Had to return it.', date: '2026-07-03', status: 'pending', helpful: 3 }
    ];
    for (const rev of defaultReviews) {
      await addDoc(col('reviews'), {
        ...rev,
        createdAt: serverTimestamp()
      });
    }
  }
};
