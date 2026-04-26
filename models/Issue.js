const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Emergency'], default: 'Low' },
  status: { type: String, enum: ['Submitted', 'Approved', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'], default: 'Submitted' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: [{ 
    text: String, 
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
  }],
  photo: { type: String }, // Initial photo
  resolutionPhoto: { type: String }, // Fixation photo
  assignedWorkerName: { type: String }, // Indian worker name
  assignedWorkerPhone: { type: String } // Indian worker phone
}, { timestamps: true });

module.exports = mongoose.model('Issue', IssueSchema);
