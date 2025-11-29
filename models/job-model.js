const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    company: { type: String, required: true },
    skills: { type: [String], required: true },
    locations: { type: String, required: true },
    jobType: { type: String, required: true },
    minSalary: { type: Number, required: true },
    maxSalary: { type: Number, required: true },
    lastDateToApply: { type: Date, required: true },
    experienceRequired: { type: String, required: true },
    status: { type: String, default: "open" },
  },
  { timestamps: true }
);

const JobModel = mongoose.model("jobs", jobSchema);
module.exports = JobModel;
