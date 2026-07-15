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

    const computedVariantId = variantData
      ? variantData.id || `${variantData.size}_${variantData.color}`
      : null;

    const idx = existing.findIndex(
      (i) =>
        i.productId === productData.id &&
        i.variantId === computedVariantId
    );

    if (idx > -1) {
      existing[idx].quantity += quantity;
    } else {
      existing.push({
        productId: productData.id,
        variantId: computedVariantId,
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

  async getIds() {
    return this.get();
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

    // Get user document to fetch current points for addition
    const userRef = doc(db, 'users', userId);
    let currentPoints = 0;
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        currentPoints = userSnap.data().points || 0;
      }
    } catch (_) {}

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

    // Update user reward points (1 point per 10 rupees spent)
    const pointsEarned = Math.floor(grandTotal / 10);
    const newPoints = currentPoints + pointsEarned;
    batch.update(userRef, { points: newPoints, updatedAt: serverTimestamp() });

    // Add reward history transaction log
    const logRef = doc(collection(db, 'rewardHistory'));
    batch.set(logRef, {
      userId,
      points: `+${pointsEarned}`,
      reason: `Purchase Reward (Order #${orderRef.id.slice(-8).toUpperCase()})`,
      status: 'Credited',
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

  /** Admin: update order status with timestamp history */
  async updateStatus(orderId, status) {
    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    const existing = snap.exists() ? snap.data() : {};
    const history = existing.statusHistory || [];
    history.push({ status, timestamp: new Date().toISOString() });
    await updateDoc(orderRef, {
      orderStatus: status,
      statusHistory: history,
      updatedAt: serverTimestamp(),
    });
  },

  /** Admin: update tracking details */
  async updateTracking(orderId, { trackingNumber, courierPartner, estimatedDelivery }) {
    await updateDoc(doc(db, 'orders', orderId), {
      trackingNumber,
      courierPartner,
      estimatedDelivery,
      updatedAt: serverTimestamp(),
    });
  },

  /** Admin: update order / invoice details */
  async update(orderId, updateData) {
    await updateDoc(doc(db, 'orders', orderId), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  },

  /** Public: get order by ID and email or phone for tracking */
  async getByIdAndContact(orderId, contact) {
    const c = contact.toLowerCase().trim();
    const searchId = orderId.toLowerCase().trim().replace('#', '');
    
    // 1. Query by customerEmail
    const qEmail = query(col('orders'), where('customerEmail', '==', c));
    const snapEmail = await getDocs(qEmail);
    let matchedOrders = snap2arr(snapEmail);
    
    // 2. Query by phone if email match returns nothing
    if (matchedOrders.length === 0) {
      const qPhone = query(col('orders'), where('phone', '==', contact.trim()));
      const snapPhone = await getDocs(qPhone);
      matchedOrders = snap2arr(snapPhone);
    }
    
    // 3. Fallback: query all orders if it's a small local dataset or try direct ID lookup
    if (matchedOrders.length === 0) {
      try {
        const snapDirect = await getDoc(doc(db, 'orders', orderId));
        if (snapDirect.exists()) {
          const ord = { id: snapDirect.id, ...snapDirect.data() };
          if (
            ord.customerEmail?.toLowerCase() === c ||
            ord.phone?.replace(/\s/g, '') === c.replace(/\s/g, '')
          ) {
            return ord;
          }
        }
      } catch (_) {}

      // Fallback: Fetch recent orders to find a match (covers case where email/phone has formatting differences)
      try {
        const snapAll = await getDocs(col('orders'));
        matchedOrders = snap2arr(snapAll);
      } catch (_) {}
    }
    
    // Find the order that matches the searchId (either full ID or ends with it)
    const found = matchedOrders.find(o => {
      const oid = o.id.toLowerCase();
      const emailMatch = o.customerEmail?.toLowerCase() === c;
      const phoneMatch = o.phone?.replace(/\s/g, '') === c.replace(/\s/g, '');
      const idMatch = oid === searchId || oid.endsWith(searchId);
      return idMatch && (emailMatch || phoneMatch);
    });
    
    return found || null;
  },
};

// ─── RETURNS ──────────────────────────────────────────────────────────────────
export const returnService = {
  /** Customer: submit return request */
  async create({ orderId, productId, productName, productImage, reason, description, images, customerId, customerName, customerEmail }) {
    const ref = await addDoc(col('returns'), {
      orderId,
      productId,
      productName,
      productImage: productImage || '',
      reason,
      description,
      images: images || [],
      customerId,
      customerName,
      customerEmail,
      status: 'pending',        // pending | approved | rejected | pickup_scheduled | received | refund_initiated | refund_completed
      refundStatus: 'none',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Customer: get my returns */
  async getMyReturns() {
    const userId = uid();
    const q = query(col('returns'), where('customerId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  /** Check if a return already exists for this order+product */
  async getByOrderProduct(orderId, productId) {
    const userId = uid();
    const q = query(
      col('returns'),
      where('orderId', '==', orderId),
      where('productId', '==', productId),
      where('customerId', '==', userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  /** Admin: get all returns */
  async getAll() {
    const q = query(col('returns'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  /** Admin: get returns filtered by status */
  async getByStatus(status) {
    const q = query(col('returns'), where('status', '==', status), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  /** Admin: update return status */
  async updateStatus(returnId, status) {
    const updates = { status, updatedAt: serverTimestamp() };
    if (status === 'refund_initiated') updates.refundStatus = 'initiated';
    if (status === 'refund_completed') updates.refundStatus = 'completed';
    await updateDoc(doc(db, 'returns', returnId), updates);
  },
};

// ─── INVOICE TEMPLATE SETTINGS ────────────────────────────────────────────────
export const invoiceTemplateService = {
  _ref: () => doc(db, 'settings', 'invoiceTemplate'),

  async get() {
    const snap = await getDoc(this._ref());
    if (!snap.exists()) {
      return {
        brandName: 'RetroStylings',
        tagline: 'Standard Retro-Street Tech',
        billingStreet: '12/A, Tech Hub Area',
        billingCity: 'Chennai, Tamil Nadu',
        billingZip: '600001',
        taxPercentage: 18,
        footerNote: 'Thank you for shopping with RetroStylings! For any support or returns, visit retrostylings.com/support',
        invoicePrefix: 'RS'
      };
    }
    return snap.data();
  },

  async update(data) {
    await setDoc(this._ref(), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};

// ─── SHIPPING SETTINGS ────────────────────────────────────────────────────────
export const shippingSettingsService = {
  _ref: () => doc(db, 'shippingSettings', 'config'),

  async get() {
    const snap = await getDoc(this._ref());
    if (!snap.exists()) return null;
    return snap.data();
  },

  async update(data) {
    await setDoc(this._ref(), { ...data, updatedAt: serverTimestamp() }, { merge: true });
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
  },

  getAll: async () => {
    const snap = await getDocs(query(col('contacts'), orderBy('createdAt', 'desc')));
    return snap2arr(snap);
  },

  respond: async (id, responseText) => {
    const ref = doc(db, 'contacts', id);
    await updateDoc(ref, {
      response: responseText,
      status: 'responded',
      respondedAt: serverTimestamp()
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
      
      // Check if there is an invited/pre-created profile with this email
      try {
        const qUsers = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
        const emailSnap = await getDocs(qUsers);
        if (!emailSnap.empty) {
          const pendingDoc = emailSnap.docs[0];
          const pendingData = pendingDoc.data();
          if (pendingDoc.id !== firebaseUser.uid) {
            await deleteDoc(pendingDoc.ref);
          }
          // Merge pending invited details
          userData.role = pendingData.role || 'customer';
          userData.status = pendingData.status || 'active';
          userData.displayName = pendingData.displayName || pendingData.name || userData.displayName;
        }
      } catch (err) {
        console.error("Error looking up pending invite profile by email:", err);
      }
      
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

  /** Admin: get all administrative users */
  async getAdmins() {
    const q = query(col('users'), where('role', 'in', ['superadmin', 'admin', 'staff']));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  /** Check if user is admin */
  async isAdmin(userId) {
    const profile = await this.getProfile(userId);
    return ['superadmin', 'admin', 'staff'].includes(profile?.role);
  },

  /** Admin: update user role */
  async updateRole(userId, role) {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { role, updatedAt: serverTimestamp() });
  },

  /** Admin: update user status (active/inactive) */
  async updateStatus(userId, status) {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  },

  /** Admin: delete user profile */
  async deleteUser(userId) {
    const ref = doc(db, 'users', userId);
    await deleteDoc(ref);
  },

  /** Admin: pre-invite/pre-create admin user profile by email */
  async preInviteAdmin(data) {
    const usersCol = col('users');
    const q = query(usersCol, where('email', '==', data.email));
    const snap = await getDocs(q);
    
    const payload = {
      displayName: data.name,
      email: data.email,
      role: data.role || 'admin',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (snap.empty) {
      await addDoc(usersCol, payload);
    } else {
      const existingDoc = snap.docs[0];
      await updateDoc(existingDoc.ref, {
        role: data.role,
        displayName: data.name,
        updatedAt: serverTimestamp()
      });
    }
  }
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

    // Calculate today's revenue (local time)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = paidOrders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return orderDate >= todayStart;
    });
    const todayRevenue = todayOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    // Calculate pending orders count
    const pendingOrdersCount = allOrders.filter(
      (o) => o.orderStatus === 'pending'
    ).length;

    // Calculate returns count
    const returnsCount = allOrders.filter(
      (o) => o.orderStatus === 'returned' || o.orderStatus === 'refunded'
    ).length;

    // Generate monthly sales data for the last 7 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const name = monthNames[month];
      
      const monthOrders = allOrders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return orderDate.getFullYear() === year && orderDate.getMonth() === month;
      });
      
      const paidMonthOrders = monthOrders.filter(o => o.paymentStatus === 'paid');
      const revenue = paidMonthOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      
      salesData.push({
        name,
        revenue,
        orders: monthOrders.length
      });
    }

    // Weekly sales (Mon-Sun of current week, or last 7 days ending today)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const name = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayOrders = paidOrders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        const orderDay = new Date(orderDate);
        orderDay.setHours(0, 0, 0, 0);
        return orderDay.getTime() === d.getTime();
      });
      
      const sales = dayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      weeklyData.push({
        name,
        sales
      });
    }

    // Category Sales (revenue contribution percentage)
    const categoryTotals = {};
    let totalSales = 0;
    const productMap = {};
    allProducts.forEach(p => {
      productMap[p.id] = p;
    });
    
    paidOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const prod = productMap[item.productId];
          const categoryName = prod?.categoryName || 'Others';
          const itemRevenue = (item.price || 0) * (item.quantity || 1);
          categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + itemRevenue;
          totalSales += itemRevenue;
        });
      }
    });
    
    const colors = ['#DFFF1B', '#8B5CF6', '#00F5FF', '#F59E0B', '#EF4444', '#10B981'];
    const categoryData = Object.entries(categoryTotals).map(([name, val], idx) => {
      const percentage = totalSales > 0 ? Math.round((val / totalSales) * 100) : 0;
      return {
        name,
        value: percentage,
        color: colors[idx % colors.length]
      };
    });

    // Customer Growth (new registrations vs returning customers by month)
    const customerGrowth = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const name = monthNames[month];
      
      const newUsersCount = users.docs.filter(uDoc => {
        const u = uDoc.data();
        if (!u.createdAt) return false;
        const uDate = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt.seconds * 1000 || u.createdAt);
        return uDate.getFullYear() === year && uDate.getMonth() === month;
      }).length;
      
      const returningUsersCount = allOrders.filter(o => {
        if (!o.createdAt) return false;
        const oDate = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return oDate.getFullYear() === year && oDate.getMonth() === month;
      }).reduce((acc, o) => {
        if (o.userId && !acc.includes(o.userId)) {
          acc.push(o.userId);
        }
        return acc;
      }, []).length;
      
      customerGrowth.push({
        name,
        new: newUsersCount,
        returning: returningUsersCount
      });
    }

    // Order Status Distribution
    const statuses = [
      { status: 'Pending', key: 'pending', color: '#F59E0B' },
      { status: 'Processing', key: 'processing', color: '#3B82F6' },
      { status: 'Shipped', key: 'shipped', color: '#00F5FF' },
      { status: 'Delivered', key: 'delivered', color: '#22C55E' },
      { status: 'Cancelled', key: 'cancelled', color: '#FF4D4D' },
    ];
    const orderStatusData = statuses.map(s => {
      const count = allOrders.filter(o => o.orderStatus === s.key).length;
      return {
        status: s.status,
        count,
        color: s.color
      };
    });

    // Top Selling Products
    const productStats = {};
    paidOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const pid = item.productId;
          const qty = item.quantity || 1;
          const price = item.price || 0;
          const revenue = price * qty;
          
          if (!productStats[pid]) {
            productStats[pid] = {
              name: item.name,
              sales: 0,
              revenue: 0
            };
          }
          productStats[pid].sales += qty;
          productStats[pid].revenue += revenue;
        });
      }
    });
    const topProducts = Object.entries(productStats).map(([pid, stat]) => {
      const prod = productMap[pid];
      return {
        name: stat.name,
        sales: stat.sales,
        revenue: `₹${stat.revenue.toLocaleString('en-IN')}`,
        stock: prod?.stock !== undefined ? prod.stock : 0,
        trend: 'up'
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

    return {
      stats: {
        totalUsers: users.size,
        totalProducts: products.size,
        totalOrders: orders.size,
        totalRevenue: totalRevenue,
        lowStockCount: lowStockProducts.length,
        todayRevenue: todayRevenue,
        pendingOrders: pendingOrdersCount,
        returns: returnsCount,
      },
      recentOrders,
      lowStockProducts,
      salesData,
      weeklyData,
      categoryData,
      customerGrowth,
      orderStatusData,
      topProducts,
      allOrders,
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
  },

  // Get customer's points and level details
  async getCustomerPoints() {
    const profile = await userService.getProfile();
    if (!profile) return { points: 0, tier: 'Bronze', vipId: 'N/A', memberSince: new Date().getFullYear() };
    
    const points = profile.points || 0;
    // Calculate tier based on points
    let tier = 'Bronze';
    if (points >= 5000) tier = 'Platinum';
    else if (points >= 2500) tier = 'Gold';
    else if (points >= 1000) tier = 'Silver';
    
    // Auto-generate VIP ID if missing
    let vipId = profile.vipId;
    if (!vipId) {
      vipId = `#RS-${Math.floor(100000 + Math.random() * 900000)}`;
      await updateDoc(doc(db, 'users', uid()), { vipId });
    }
    
    const memberSince = profile.memberSince || new Date().getFullYear();
    
    return { points, tier, vipId, memberSince };
  },

  // Get customer's reward history logs
  async getHistory() {
    const userId = uid();
    const q = query(col('rewardHistory'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      // Format timestamp for render
      let dateStr = 'Just Now';
      if (data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return { id: d.id, ...data, date: dateStr };
    });
  },

  // Add points to customer
  async addPoints(amount, reason) {
    const userId = uid();
    const profile = await userService.getProfile(userId);
    const currentPoints = profile?.points || 0;
    const newPoints = currentPoints + amount;
    
    const batch = writeBatch(db);
    // Update user points
    batch.update(doc(db, 'users', userId), { points: newPoints, updatedAt: serverTimestamp() });
    // Add history log
    const logRef = doc(collection(db, 'rewardHistory'));
    batch.set(logRef, {
      userId,
      points: amount > 0 ? `+${amount}` : `${amount}`,
      reason,
      status: amount > 0 ? 'Credited' : 'Debited',
      createdAt: serverTimestamp(),
    });
    
    await batch.commit();
    return newPoints;
  },

  // Redeem a reward option
  async redeem(optionId, pointsCost, title) {
    const userId = uid();
    const profile = await userService.getProfile(userId);
    const currentPoints = profile?.points || 0;
    if (currentPoints < pointsCost) {
      throw new Error('Insufficient points balance!');
    }
    
    const newPoints = currentPoints - pointsCost;
    const batch = writeBatch(db);
    // Deduct user points
    batch.update(doc(db, 'users', userId), { points: newPoints, updatedAt: serverTimestamp() });
    // Add history log
    const logRef = doc(collection(db, 'rewardHistory'));
    batch.set(logRef, {
      userId,
      points: `-${pointsCost}`,
      reason: `Redeemed: ${title}`,
      status: 'Debited',
      createdAt: serverTimestamp(),
    });
    
    await batch.commit();
    return newPoints;
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

// ─── BRANDS SERVICE ───────────────────────────────────────────
export const brandService = {
  async getAll() {
    const snap = await getDocs(col('brands'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async create(data) {
    const ref = await addDoc(col('brands'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return ref.id;
  },
  async update(id, data) {
    const ref = doc(db, 'brands', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  async delete(id) {
    const ref = doc(db, 'brands', id);
    await deleteDoc(ref);
  }
};

// ─── DATABASE SEEDER ──────────────────────────────────────────────────────────
export const seedService = {
  async run() {
    // 0. Clear all existing products, categories, heroSlides, orders, rewards, reviews, brands, roles, and activityLogs to remove all dummy data
    const collectionsToClear = ['products', 'categories', 'heroSlides', 'orders', 'rewards', 'reviews', 'brands', 'roles', 'activityLogs'];
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

    // 7. Seed default Roles
    const defaultRoles = [
      { id: 'superadmin', name: 'Super Admin', slug: 'superadmin', permissions: ['all'], color: '#FF4D4D' },
      { id: 'admin', name: 'Admin', slug: 'admin', permissions: ['products', 'orders', 'customers', 'coupons', 'reports'], color: '#8B5CF6' },
      { id: 'staff', name: 'Staff', slug: 'staff', permissions: ['orders', 'inventory'], color: '#3B82F6' }
    ];
    for (const r of defaultRoles) {
      const { id, ...data } = r;
      await setDoc(doc(db, 'roles', id), {
        ...data,
        createdAt: serverTimestamp()
      });
    }

    // 8. Seed initial Activity Logs
    const initialLogs = [
      { user: 'Muneeswaran', action: 'Updated product: Leather Jacket', module: 'Products', createdAt: serverTimestamp(), ip: '192.168.1.1' },
      { user: 'Priya Admin', action: 'Approved review #R-1024', module: 'Reviews', createdAt: serverTimestamp(), ip: '192.168.1.2' },
      { user: 'Muneeswaran', action: 'Created coupon: SUMMER30', module: 'Coupons', createdAt: serverTimestamp(), ip: '192.168.1.1' },
      { user: 'Kiran Staff', action: 'Updated order #ORD-2841 status to Shipped', module: 'Orders', createdAt: serverTimestamp(), ip: '192.168.1.3' },
      { user: 'Muneeswaran', action: 'Deleted product: Old Model Sneakers', module: 'Products', createdAt: serverTimestamp(), ip: '192.168.1.1' },
      { user: 'Priya Admin', action: 'Created banner: Flash Sale', module: 'Banners', createdAt: serverTimestamp(), ip: '192.168.1.2' }
    ];
    for (const log of initialLogs) {
      await addDoc(col('activityLogs'), log);
    }
  }
};

// ─── FLASH SALES SERVICE ──────────────────────────────────────────
export const flashSaleService = {
  async getAll() {
    const snap = await getDocs(col('flashSales'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async getActive() {
    const q = query(col('flashSales'), where('active', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
  async create(data) {
    if (data.active) {
      const snap = await getDocs(query(col('flashSales'), where('active', '==', true)));
      const batch = writeBatch(db);
      snap.docs.forEach(doc => {
        batch.update(doc.ref, { active: false });
      });
      await batch.commit();
    }
    const ref = await addDoc(col('flashSales'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return ref.id;
  },
  async update(id, data) {
    if (data.active) {
      const snap = await getDocs(query(col('flashSales'), where('active', '==', true)));
      const batch = writeBatch(db);
      snap.docs.forEach(doc => {
        if (doc.id !== id) {
          batch.update(doc.ref, { active: false });
        }
      });
      await batch.commit();
    }
    const ref = doc(db, 'flashSales', id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  async delete(id) {
    const ref = doc(db, 'flashSales', id);
    await deleteDoc(ref);
  },
  async toggleActive(id, currentStatus) {
    if (!currentStatus) {
      const snap = await getDocs(query(col('flashSales'), where('active', '==', true)));
      const batch = writeBatch(db);
      snap.docs.forEach(doc => {
        batch.update(doc.ref, { active: false });
      });
      await batch.commit();
    }
    const ref = doc(db, 'flashSales', id);
    await updateDoc(ref, { active: !currentStatus, updatedAt: serverTimestamp() });
  }
};

// ─── ACTIVITY AUDIT LOGGING SERVICE ──────────────────────────────────────────
export const activityLogService = {
  async getAll() {
    const q = query(col('activityLogs'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap2arr(snap);
  },

  async log(action, module, ip = '192.168.1.1') {
    try {
      const u = auth.currentUser;
      let userName = 'Unknown Admin';
      let userId = 'system';
      
      if (u) {
        userId = u.uid;
        // Fetch display name from users collection or use email
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = userSnap.data();
          userName = profile.displayName || profile.name || u.email;
        } else {
          userName = u.displayName || u.email;
        }
      }

      await addDoc(col('activityLogs'), {
        user: userName,
        userId: userId,
        action,
        module,
        createdAt: serverTimestamp(),
        ip
      });
    } catch (err) {
      console.error('Error logging audit activity:', err);
    }
  }
};

// ─── ROLES & PERMISSIONS SERVICE ─────────────────────────────────────────────
export const rolesService = {
  async getAll() {
    const snap = await getDocs(col('roles'));
    if (snap.empty) {
      // Seed roles if none exist
      await this.seedDefaultRoles();
      const newSnap = await getDocs(col('roles'));
      return snap2arr(newSnap);
    }
    return snap2arr(snap);
  },

  async updatePermissions(roleSlug, permissions) {
    const ref = doc(db, 'roles', roleSlug);
    await updateDoc(ref, { permissions, updatedAt: serverTimestamp() });
    await activityLogService.log(`Updated permissions for "${roleSlug}" role`, 'Roles');
  },

  async seedDefaultRoles() {
    const defaultRoles = [
      { id: 'superadmin', name: 'Super Admin', slug: 'superadmin', permissions: ['all'], color: '#FF4D4D' },
      { id: 'admin', name: 'Admin', slug: 'admin', permissions: ['products', 'orders', 'customers', 'coupons', 'reports'], color: '#8B5CF6' },
      { id: 'staff', name: 'Staff', slug: 'staff', permissions: ['orders', 'inventory'], color: '#3B82F6' }
    ];
    for (const r of defaultRoles) {
      const { id, ...data } = r;
      await setDoc(doc(db, 'roles', id), {
        ...data,
        createdAt: serverTimestamp()
      });
    }
  }
};

