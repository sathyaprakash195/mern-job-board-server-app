const express = require("express");
const router = express.Router();
const JobModel = require("../models/job-model");
const authMiddleware = require("../middleware/auth-middleware");
const mongoose = require("mongoose");

// CREATE - Post a new job (recruiter only)
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, company, skills, locations, jobType, minSalary, maxSalary, lastDateToApply, experienceRequired } = req.body;

    // Validate required fields
    if (!title || !description || !company || !skills || !locations || !jobType || !minSalary || !maxSalary || !lastDateToApply || !experienceRequired) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create new job with recruiter ID from middleware
    const newJob = await JobModel.create({
      recruiter: req.userId,
      title,
      description,
      company,
      skills,
      locations,
      jobType,
      minSalary,
      maxSalary,
      lastDateToApply,
      experienceRequired,
    });

    res.status(201).json({
      message: "Job posted successfully",
      job: newJob,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while creating job" });
  }
});

// READ - Get all jobs posted by a recruiter
router.get("/recruiter/jobs", authMiddleware, async (req, res) => {
  try {
    const jobs = await JobModel.find({ recruiter: req.userId }).populate("recruiter", "-password").sort({ createdAt: -1 });

    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ message: "No jobs found for this recruiter" });
    }

    res.json({
      message: "Jobs retrieved successfully",
      jobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching jobs" });
  }
});

// READ - Get a specific job by ID
router.get("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await JobModel.findById(jobId).populate("recruiter", "-password");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      message: "Job retrieved successfully",
      job,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching job" });
  }
});

// UPDATE - Update a job (recruiter only)
router.put("/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const updateData = req.body;

    // Check if job exists and belongs to the recruiter
    const job = await JobModel.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiter.toString() !== req.userId) {
      return res.status(403).json({ message: "You are not authorized to update this job" });
    }

    // Update the job
    const updatedJob = await JobModel.findByIdAndUpdate(jobId, updateData, { new: true });

    res.json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while updating job" });
  }
});

// DELETE - Delete a job (recruiter only)
router.delete("/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists and belongs to the recruiter
    const job = await JobModel.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiter.toString() !== req.userId) {
      return res.status(403).json({ message: "You are not authorized to delete this job" });
    }

    // Delete the job
    await JobModel.findByIdAndDelete(jobId);

    res.json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while deleting job" });
  }
});


router.get("/job-seeker/open", authMiddleware, async (req, res) => {
  try {
    // Build filter object conditionally
    const filter = { status: "open" };

    // Filter by keywords (search in title and description)
    if (req.query.keywords) {
      const keywords = req.query.keywords.split(",").map(k => k.trim());
      filter.$or = keywords.map(keyword => ({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
          { skills: { $in: [new RegExp(keyword, "i")] } }
        ]
      }));
    }

    // Filter by location
    if (req.query.location) {
      filter.locations = { $regex: req.query.location, $options: "i" };
    }

    // Filter by job type
    if (req.query.jobType) {
      filter.jobType = req.query.jobType;
    }

    // Filter by salary range
    if (req.query.minSalary || req.query.maxSalary) {
      filter.$and = [];
      
      if (req.query.minSalary) {
        filter.$and.push({ maxSalary: { $gte: parseInt(req.query.minSalary) } });
      }
      
      if (req.query.maxSalary) {
        filter.$and.push({ minSalary: { $lte: parseInt(req.query.maxSalary) } });
      }
    }

    // Filter by experience level
    if (req.query.experienceLevel) {
      filter.experienceRequired = { $regex: req.query.experienceLevel, $options: "i" };
    }

    const jobs = await JobModel.find(filter).populate("recruiter", "-password").sort({ createdAt: -1 });

    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ message: "No open jobs found matching your criteria" });
    }

    res.json({
      message: "Open jobs retrieved successfully",
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching open jobs" });
  }
});

module.exports = router;
