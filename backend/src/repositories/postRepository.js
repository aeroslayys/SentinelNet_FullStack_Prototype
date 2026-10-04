import { dataSource, connectDatabase } from '../config/database.js';
import { Post } from '../models/Post.js';
import { seedPosts } from '../data/seedPosts.js';

let memoryPosts = seedPosts.map((post) => ({ ...post, analysis: null }));

function usingMongo() {
  return dataSource() === 'mongodb';
}

function clone(value) {
  return structuredClone(value);
}

export function toClientPost(post) {
  const raw = post?.toObject ? post.toObject() : post;
  const analysis = raw.analysis || null;

  return {
    id: raw.postId || raw.id,
    handle: raw.handle,
    text: raw.text,
    timestamp: raw.timestamp,
    cluster: analysis?.networkCluster || raw.cluster || 'C-SOLO',
    evidence: Boolean(raw.evidence),
    source: raw.source,
    language: analysis?.language || 'PENDING',
    sentiment: analysis?.emotion?.label || analysis?.sentiment?.label || 'Pending',
    risk: Number.isFinite(analysis?.risk) ? analysis.risk : 0,
    category: analysis?.category || 'Pending Analysis',
    narrative: analysis?.narrative || 'Pending Analysis',
    analysisStatus: analysis ? 'complete' : 'pending',
    analysisEngine: analysis?.engine || null,
    riskBreakdown: analysis?.riskBreakdown || null,
    analyzedAt: analysis?.analyzedAt || null
  };
}

export async function initializePostRepository() {
  if (!usingMongo()) {
    memoryPosts = seedPosts.map((post) => ({ ...post, analysis: null }));
    console.log('SentinelNet data source: in-memory development store');
    return;
  }

  await connectDatabase();

  if (String(process.env.AUTO_SEED || 'true').toLowerCase() === 'true') {
    const count = await Post.countDocuments();
    if (count === 0) {
      await Post.insertMany(seedPosts.map((post) => ({
        postId: post.id,
        handle: post.handle,
        text: post.text,
        timestamp: post.timestamp,
        cluster: post.cluster,
        evidence: post.evidence,
        source: post.source,
        order: post.order,
        analysis: null
      })));
      console.log(`Seeded ${seedPosts.length} raw demo posts into MongoDB.`);
    }
  }
}

export async function getAllPosts() {
  if (!usingMongo()) return clone(memoryPosts);

  const docs = await Post.find({}).sort({ order: 1, createdAt: 1 }).lean();
  return docs.map((doc) => ({ ...doc, id: doc.postId }));
}

export async function findPostById(postId) {
  if (!usingMongo()) {
    const post = memoryPosts.find((item) => item.id === postId);
    return post ? clone(post) : null;
  }

  const doc = await Post.findOne({ postId }).lean();
  return doc ? { ...doc, id: doc.postId } : null;
}

export async function saveAnalysis(postId, analysis) {
  if (!usingMongo()) {
    const index = memoryPosts.findIndex((item) => item.id === postId);
    if (index === -1) return null;
    memoryPosts[index] = { ...memoryPosts[index], analysis: clone(analysis) };
    return clone(memoryPosts[index]);
  }

  const doc = await Post.findOneAndUpdate(
    { postId },
    { $set: { analysis } },
    { new: true }
  ).lean();

  return doc ? { ...doc, id: doc.postId } : null;
}

export async function insertPost(post) {
  if (!usingMongo()) {
    if (memoryPosts.some((item) => item.id === post.id)) return { created: false, post: clone(memoryPosts.find((item) => item.id === post.id)) };
    memoryPosts.unshift({ ...post, analysis: null });
    return { created: true, post: clone(memoryPosts[0]) };
  }

  const existing = await Post.findOne({ postId: post.id }).lean();
  if (existing) return { created: false, post: { ...existing, id: existing.postId } };

  const doc = await Post.create({
    postId: post.id,
    handle: post.handle,
    text: post.text,
    timestamp: post.timestamp,
    cluster: post.cluster || null,
    evidence: Boolean(post.evidence),
    source: post.source || 'manual',
    order: post.order ?? 0,
    analysis: null
  });

  const raw = doc.toObject();
  return { created: true, post: { ...raw, id: raw.postId } };
}

export async function resetMemoryStoreForTests() {
  if (!usingMongo()) memoryPosts = seedPosts.map((post) => ({ ...post, analysis: null }));
}
