// Firestore service layer for user data management
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  deleteDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '@/store/user-store';

// User Profile Operations
export async function createUserProfile(uid: string, profile: Omit<UserProfile, 'uid'>) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...profile,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore is offline, profile creation will be retried when online');
      return;
    }
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    // If offline or connection error, return null instead of throwing
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore is offline, returning null profile');
      return null;
    }
    throw error;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore is offline, profile update will be retried when online');
      return;
    }
    throw error;
  }
}

// AI Chat Conversations
export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export async function saveConversation(userId: string, conversation: Omit<ChatConversation, 'id' | 'userId'>) {
  const conversationsRef = collection(db, 'conversations');
  const docRef = await addDoc(conversationsRef, {
    ...conversation,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserConversations(userId: string, limitCount = 50): Promise<ChatConversation[]> {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as ChatConversation[];
}

export async function updateConversation(conversationId: string, updates: Partial<ChatConversation>) {
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteConversation(conversationId: string) {
  const conversationRef = doc(db, 'conversations', conversationId);
  await deleteDoc(conversationRef);
}

// Notes Operations
export interface UserNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function saveNote(userId: string, note: Omit<UserNote, 'id' | 'userId'>) {
  const notesRef = collection(db, 'notes');
  const docRef = await addDoc(notesRef, {
    ...note,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserNotes(userId: string): Promise<UserNote[]> {
  const notesRef = collection(db, 'notes');
  const q = query(
    notesRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as UserNote[];
}

export async function updateNote(noteId: string, updates: Partial<UserNote>) {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(noteId: string) {
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
}

// Progress/Tasks Operations
export interface UserTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: Date;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export async function saveTask(userId: string, task: Omit<UserTask, 'id' | 'userId'>) {
  const tasksRef = collection(db, 'tasks');
  const docRef = await addDoc(tasksRef, {
    ...task,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserTasks(userId: string): Promise<UserTask[]> {
  const tasksRef = collection(db, 'tasks');
  const q = query(
    tasksRef,
    where('userId', '==', userId),
    orderBy('dueDate', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dueDate: doc.data().dueDate?.toDate() || new Date(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as UserTask[];
}

export async function updateTask(taskId: string, updates: Partial<UserTask>) {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(taskId: string) {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

// GCCR Favorites
export interface UserFavorite {
  id: string;
  userId: string;
  fileId: string;
  fileName: string;
  fileType: 'file' | 'folder';
  filePath: string;
  createdAt: Date;
}

export async function addFavorite(userId: string, favorite: Omit<UserFavorite, 'id' | 'userId'>) {
  const favoritesRef = collection(db, 'favorites');
  const docRef = await addDoc(favoritesRef, {
    ...favorite,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserFavorites(userId: string): Promise<UserFavorite[]> {
  const favoritesRef = collection(db, 'favorites');
  const q = query(
    favoritesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as UserFavorite[];
}

export async function removeFavorite(favoriteId: string) {
  const favoriteRef = doc(db, 'favorites', favoriteId);
  await deleteDoc(favoriteRef);
}

// Real-time subscription helpers
export function subscribeToUserConversations(
  userId: string, 
  callback: (conversations: ChatConversation[]) => void
) {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ChatConversation[];
    callback(conversations);
  });
}

export function subscribeToUserNotes(
  userId: string, 
  callback: (notes: UserNote[]) => void
) {
  const notesRef = collection(db, 'notes');
  const q = query(
    notesRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as UserNote[];
    callback(notes);
  });
}
