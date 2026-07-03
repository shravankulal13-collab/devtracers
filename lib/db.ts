import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

// Pure JS/TS Cosine Similarity TF-IDF vectorizer
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate simple term vectors based on common vocabulary across the files
const VOCABULARY = [
  'payment', 'gateway', 'mutation', 'checkout', 'button', 'order',
  'controller', 'auth', 'middleware', 'verify', 'token', 'database',
  'commit', 'amount', 'currency', 'user', 'profile'
];

export function getEmbedding(text: string): number[] {
  const normalized = text.toLowerCase();
  // Simple bag of words/TF representation normalized to form a unit vector
  const vector = VOCABULARY.map(word => {
    const matches = normalized.split(word).length - 1;
    return matches;
  });
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(process.cwd(), 'devtracers.sqlite');
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE,
      content TEXT,
      language TEXT
    );

    CREATE TABLE IF NOT EXISTS file_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER,
      vector TEXT,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage TEXT,
      source_file TEXT,
      target_file TEXT,
      type TEXT,
      animated INTEGER
    );
  `);

  // Check if we need to seed
  const count = await dbInstance.get('SELECT COUNT(*) as count FROM files');
  if (count && count.count === 0) {
    // Seed initial files
    const seedFiles = [
      {
        filename: 'services/payment-gateway.ts',
        language: 'TypeScript',
        content: `// Location: services/payment-gateway.ts
export const processMutation = async (payload: Payload) => {
  const securityContext = verifyToken(payload.auth);
  if (!securityContext.valid) throw new AuthError();
  
  // CRITICAL STRUCTURAL TRANSFORMATION
  return database.payments.commit({
    transactionId: payload.id,
    amountInCents: payload.total * 100,
    currencyCode: "INR"
  });
};`
      },
      {
        filename: 'components/CheckoutButton.tsx',
        language: 'TypeScript',
        content: `// Location: components/CheckoutButton.tsx
import { processMutation } from '../services/payment-gateway';

export function CheckoutButton({ orderId, total }) {
  const handleCheckout = async () => {
    const result = await processMutation({ id: orderId, total, auth: 'token' });
    console.log("Payment processed: ", result.currencyCode);
  };
  return <button onClick={handleCheckout}>Pay Now</button>;
}`
      },
      {
        filename: 'controllers/order-controller.js',
        language: 'JavaScript',
        content: `// Location: controllers/order-controller.js
const { processMutation } = require('../services/payment-gateway');

exports.createOrder = async (req, res) => {
  const order = { id: req.body.id, total: req.body.total };
  const payment = await processMutation(order);
  res.json({ success: true, payment });
};`
      },
      {
        filename: 'middleware/auth-middleware.ts',
        language: 'TypeScript',
        content: `// Location: middleware/auth-middleware.ts
export const verifyToken = (token: string) => {
  return { valid: token === 'token', user: 'admin' };
};`
      },
      {
        filename: 'components/UserProfile.jsx',
        language: 'JavaScript',
        content: `// Location: components/UserProfile.jsx
export function UserProfile({ user }) {
  return <div>Welcome, {user.name}</div>;
}`
      }
    ];

    for (const file of seedFiles) {
      const result = await dbInstance.run(
        'INSERT INTO files (filename, content, language) VALUES (?, ?, ?)',
        [file.filename, file.content, file.language]
      );
      const fileId = result.lastID;
      const vector = getEmbedding(file.content);
      await dbInstance.run(
        'INSERT INTO file_embeddings (file_id, vector) VALUES (?, ?)',
        [fileId, JSON.stringify(vector)]
      );
    }

    // Seed dependencies across stages
    const deps = [
      // Hours 3-5 stage dependencies
      { stage: 'hours35', source_file: 'services/payment-gateway.ts', target_file: 'controllers/order-controller.js', type: 'animated', animated: 1 },
      { stage: 'hours35', source_file: 'services/payment-gateway.ts', target_file: 'components/CheckoutButton.tsx', type: 'animated', animated: 1 },
      
      // Hours 6-7 stage dependencies
      { stage: 'hours67', source_file: 'services/payment-gateway.ts', target_file: 'controllers/order-controller.js', type: 'animated', animated: 1 },
      { stage: 'hours67', source_file: 'services/payment-gateway.ts', target_file: 'components/CheckoutButton.tsx', type: 'animated', animated: 1 },
      { stage: 'hours67', source_file: 'middleware/auth-middleware.ts', target_file: 'components/UserProfile.jsx', type: 'default', animated: 0 },
      { stage: 'hours67', source_file: 'controllers/order-controller.js', target_file: 'components/CheckoutButton.tsx', type: 'default', animated: 0 }
    ];

    for (const dep of deps) {
      await dbInstance.run(
        'INSERT INTO dependencies (stage, source_file, target_file, type, animated) VALUES (?, ?, ?, ?, ?)',
        [dep.stage, dep.source_file, dep.target_file, dep.type, dep.animated]
      );
    }
  }

  return dbInstance;
}
