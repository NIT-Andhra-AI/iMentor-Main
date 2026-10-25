'use strict';

const mongoose = require('mongoose');

const CampusDeploymentLeadSchema = new mongoose.Schema({
    bundleId:             { type: String, required: true, index: true },
    collegeName:          { type: String, required: true, trim: true, maxlength: 180 },
    coordinatorName:      { type: String, default: '', trim: true, maxlength: 120 },
    officialEmail:        { type: String, default: '', trim: true, lowercase: true, maxlength: 160, index: true },
    phone:                { type: String, default: '', trim: true, maxlength: 40 },
    studentCountEstimate: { type: String, default: '100-500', trim: true },
    campusDomain:         { type: String, default: 'imentor.campus.local', trim: true, maxlength: 140 },

    // Selected Enterprise Hardware & OS Matrix
    osTarget: {
        type: String,
        enum: ['ubuntu_linux', 'windows_wsl2', 'windows_native'],
        required: true
    },
    accelerator: {
        type: String,
        enum: ['nvidia_gpu', 'amd_gpu', 'cpu_only', 'lab_pc_pool'],
        required: true
    },
    memoryTier: {
        type: String,
        enum: ['8_12gb', '16_24gb', '32_64gb', '64gb_plus'],
        required: true
    },
    connectivityMode: {
        type: String,
        enum: ['offline_airgapped', 'campus_lan_internet', 'hybrid_cloud_gpu'],
        required: true
    },

    // Resolved Architecture Plan Snapshot
    recommendedEngine:    { type: String, default: '' },
    recommendedModel:     { type: String, default: '' },
    estimatedTokPerSec:   { type: String, default: '' },
    concurrentClassSize:  { type: String, default: '' },
    hardwareProfile:      { type: String, default: '' },

    status: {
        type: String,
        enum: ['downloaded', 'contacted', 'pilot_active', 'deployed'],
        default: 'downloaded',
        index: true
    },
    adminNotes:    { type: String, default: '', maxlength: 1000 },
    ipAddress:     { type: String, default: '' },
    userAgent:     { type: String, default: '' },
    downloadCount: { type: Number, default: 1 }
}, { timestamps: true });

CampusDeploymentLeadSchema.index({ createdAt: -1 });

module.exports = mongoose.models.CampusDeploymentLead ||
    mongoose.model('CampusDeploymentLead', CampusDeploymentLeadSchema);
