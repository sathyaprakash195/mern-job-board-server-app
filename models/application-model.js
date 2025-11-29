const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "jobs",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
    },
    resume: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ApplicationModel = mongoose.model("applications", applicationSchema);
module.exports = ApplicationModel;
