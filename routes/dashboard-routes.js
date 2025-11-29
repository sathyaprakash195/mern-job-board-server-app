const express = require("express");
const router = express.Router();
const ApplicationModel = require("../models/application-model");
const JobModel = require("../models/job-model");
const authMiddleware = require("../middleware/auth-middleware");

// READ - Get job seeker dashboard statistics
router.get("/job-seeker", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter
    const filter = {
      applicant: req.userId,
    };

    // Add date range filter if both dates are provided
    if (startDate && endDate) {
      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate date format
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use YYYY-MM-DD format" });
      }

      // Set end date to end of day
      end.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Get total applications
    const totalApplications = await ApplicationModel.countDocuments(filter);

    // Get shortlisted applications
    const shortlistedApplications = await ApplicationModel.countDocuments({
      ...filter,
      status: "shortlisted",
    });

    // Get rejected applications
    const rejectedApplications = await ApplicationModel.countDocuments({
      ...filter,
      status: "rejected",
    });

    // Get pending applications
    const pendingApplications = await ApplicationModel.countDocuments({
      ...filter,
      status: "pending",
    });

    res.json({
      totalApplications,
      shortlistedApplications,
      rejectedApplications,
      pendingApplications,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error while fetching dashboard statistics" });
  }
});

// READ - Get recruiter dashboard statistics
router.get("/recruiter", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build filter for applications
    const applicationFilter = {
      recruiter: req.userId,
    };

    // Add date range filter if both dates are provided
    if (startDate && endDate) {
      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate date format
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use YYYY-MM-DD format" });
      }

      // Set end date to end of day
      end.setHours(23, 59, 59, 999);

      applicationFilter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Get total applications
    const totalApplications = await ApplicationModel.countDocuments(
      applicationFilter
    );

    // Get shortlisted applications
    const shortlistedApplications = await ApplicationModel.countDocuments({
      ...applicationFilter,
      status: "shortlisted",
    });

    // Get rejected applications
    const rejectedApplications = await ApplicationModel.countDocuments({
      ...applicationFilter,
      status: "rejected",
    });

    // Get pending applications
    const pendingApplications = await ApplicationModel.countDocuments({
      ...applicationFilter,
      status: "pending",
    });

    // Get total jobs posted
    const totalJobsPosted = await JobModel.countDocuments({
      recruiter: req.userId,
    });

    res.json({
      applicationsReceived: totalApplications,
      shortlistedApplications,
      rejectedApplications,
      pendingApplications,
      totalJobsPosted,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error while fetching dashboard statistics" });
  }
});

module.exports = router;
