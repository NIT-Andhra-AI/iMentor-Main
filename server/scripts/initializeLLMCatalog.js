/**
 * Initialize LLM Catalog with SGLang Configuration
 * 
 * This script populates the LLMConfiguration collection with the default
 * SGLang models. Run this once after migrating from Ollama/VLLM to SGLang.
 * 
 * Usage: node scripts/initializeLLMCatalog.js
 */

const mongoose = require('mongoose');
const LLMConfiguration = require('../models/LLMConfiguration');
const log = require('../utils/logger');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27018/imentor';

// SGLang Model Configurations (PRIMARY - all chat uses SGLang)
const SGLANG_MODELS = [
  {
    modelId: 'QuantTrio/Qwen3.5-9B-AWQ',
    provider: 'sglang',
    displayName: 'SGLang Qwen 3.5 9B (AWQ)',
    description: 'Primary chat model - fast inference with AWQ quantization. Handles all chat, reasoning, tutor mode.',
    isDefault: true,
    strengths: ['chat', 'reasoning', 'general', 'speed', 'multilingual'],
  },
  {
    modelId: 'sglang/qwen2.5-14b-instruct-awq',
    provider: 'sglang',
    displayName: 'SGLang Qwen 2.5 14B (AWQ)',
    description: 'Larger model for complex reasoning and technical tasks. Better accuracy than 7B.',
    isDefault: false,
    strengths: ['reasoning', 'technical', 'code', 'math', 'logic', 'large_context'],
  },
  {
    modelId: 'sglang/qwen2.5-32b-instruct-awq',
    provider: 'sglang',
    displayName: 'SGLang Qwen 2.5 32B (AWQ)',
    description: 'Production-grade model for STN generation, night jobs, heavy reasoning, and complex tasks.',
    isDefault: false,
    strengths: ['reasoning', 'technical', 'code', 'math', 'logic', 'large_context', 'summarization'],
  }
];

// Legacy Gemini (fallback)
const GEMINI_MODELS = [
  {
    modelId: 'gemini-1.5-pro',
    provider: 'gemini',
    displayName: 'Gemini 1.5 Pro',
    description: 'Google Gemini API fallback for users with API keys. Large context window.',
    isDefault: false,
    strengths: ['reasoning', 'large_context', 'multilingual', 'multimodal', 'vision'],
  },
  {
    modelId: 'gemini-1.5-flash',
    provider: 'gemini',
    displayName: 'Gemini 1.5 Flash',
    description: 'Faster Gemini variant. Good for quick responses.',
    isDefault: false,
    strengths: ['speed', 'chat', 'general'],
  }
];

async function initializeCatalog() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    log.info('DB', 'MongoDB Connected');

    // Clear existing entries
    await LLMConfiguration.deleteMany({});
    log.info('DB', 'Cleared existing LLM configurations');

    // Insert all models
    const allModels = [...SGLANG_MODELS, ...GEMINI_MODELS];
    
    console.log(`\nInserting ${allModels.length} LLM configurations...`);
    
    for (const model of allModels) {
      await LLMConfiguration.create(model);
      console.log(`  ✓ ${model.displayName} (${model.provider})`);
    }

    log.info('DB', `LLM Catalog initialized with ${allModels.length} models`);
    
    console.log('\n✅ LLM Catalog initialized successfully!');
    console.log('\nModels configured:');
    console.log('  SGLang:');
    SGLANG_MODELS.forEach(m => console.log(`    - ${m.displayName}${m.isDefault ? ' (DEFAULT)' : ''}`));
    console.log('  Gemini (fallback):');
    GEMINI_MODELS.forEach(m => console.log(`    - ${m.displayName}`));

    console.log('\n📝 Note: SGLang models are now the primary LLM providers.');
    
  } catch (error) {
    log.error('DB', `LLM Catalog initialization failed: ${error.message}`);
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info('DB', 'MongoDB connection closed');
  }
}

// Run initialization
console.log('═══════════════════════════════════════════════════════════');
console.log('  iMentor LLM Catalog Initialization');
console.log('  Configuring SGLang as primary LLM provider');
console.log('═══════════════════════════════════════════════════════════\n');

initializeCatalog();
