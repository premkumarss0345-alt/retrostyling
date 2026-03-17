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
        totalUsers: users.size,
        totalProducts: products.size,
        totalOrders: orders.size,
        totalRevenue,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders,
      lowStockProducts,
    };
  },
};
