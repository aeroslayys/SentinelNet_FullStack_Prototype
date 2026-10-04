import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  postId: { type: String, required: true, unique: true, index: true },
  handle: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  cluster: { type: String, default: null },
  evidence: { type: Boolean, default: false },
  source: { type: String, default: 'unknown' },
  order: { type: Number, default: 9999, index: true },
  analysis: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: true,
  versionKey: false
});

export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
