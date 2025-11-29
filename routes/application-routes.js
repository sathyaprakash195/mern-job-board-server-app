const express = require("express");
const router = express.Router();
const ApplicationModel = require("../models/application-model");
const authMiddleware = require("../middleware/auth-middleware");
const mongoose = require("mongoose");

// CREATE - Submit a new application (job seeker only)
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { jobId, coverLetter, resume } = req.body;

    // Validate required fields
    if (!jobId || !resume) {
      return res.status(400).json({ message: "Job ID and resume are required" });
    }

    // Check if job exists
    const JobModel = require("../models/job-model");
    const job = await JobModel.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if applicant has already applied for this job
    const existingApplication = await ApplicationModel.findOne({
      job: jobId,
      applicant: req.userId,
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    // Create new application
    const newApplication = await ApplicationModel.create({
      job: jobId,
      applicant: req.userId,
      recruiter: job.recruiter,
      status: "pending",
      coverLetter,
      resume,
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application: newApplication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while submitting application" });
  }
});

// READ - Get all applications for a recruiter
router.get("/recruiter/applications", authMiddleware, async (req, res) => {
  try {
    const applications = await ApplicationModel.find({ recruiter: req.userId })
      .populate("job")
      .populate("applicant", "-password")
      .sort({ createdAt: -1 });

    if (!applications || applications.length === 0) {
      return res.status(404).json({ message: "No applications found for this recruiter" });
    }

    res.json({
      message: "Applications retrieved successfully",
      applications,
      count: applications.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching applications" });
  }
});

// READ - Get all applications submitted by a job seeker
router.get("/job-seeker/applications", authMiddleware, async (req, res) => {
  try {
    const applications = await ApplicationModel.find({ applicant: req.userId })
      .populate("job")
      .populate("recruiter", "-password")
      .sort({ createdAt: -1 });

    if (!applications || applications.length === 0) {
      return res.status(404).json({ message: "No applications found for this job seeker" });
    }

    res.json({
      message: "Applications retrieved successfully",
      applications,
      count: applications.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching applications" });
  }
});

// READ - Get all applications for a specific job
router.get("/job/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify the job exists and belongs to the recruiter
    const JobModel = require("../models/job-model");
    const job = await JobModel.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiter.toString() !== req.userId) {
      return res.status(403).json({ message: "You are not authorized to view applications for this job" });
    }

    const applications = await ApplicationModel.find({ job: jobId })
      .populate("applicant", "-password")
      .sort({ createdAt: -1 });

    if (!applications || applications.length === 0) {
      return res.status(404).json({ message: "No applications found for this job" });
    }

    res.json({
      message: "Applications retrieved successfully",
      applications,
      count: applications.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching applications" });
  }
});

// UPDATE - Change application status (recruiter only)
router.put("/:applicationId", authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "rejected", "shortlisted", "accepted"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed statuses: ${validStatuses.join(", ")}`,
      });
    }

    // Check if application exists
    const application = await ApplicationModel.findById(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if recruiter is authorized to update this application
    if (application.recruiter.toString() !== req.userId) {
      return res.status(403).json({ message: "You are not authorized to update this application" });
    }

    // Update the application status
    const updatedApplication = await ApplicationModel.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    )
      .populate("job")
      .populate("applicant", "-password");

    res.json({
      message: "Application status updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while updating application status" });
  }
});

module.exports = router;
