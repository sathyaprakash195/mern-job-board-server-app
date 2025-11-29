const express = require("express");
const app = express();

const PORT = process.env.PORT || 5000;
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(cookieParser());

app.use(
  cors({
    origin: "https://mern-job-board-client-app.vercel.app",
    credentials: true,
  })
);

dotenv.config();
const connectToMongoDB = require("./config/mongo-db-config");
connectToMongoDB();

app.use(express.json());

const userRoutes = require("./routes/user-routes");
const jobRoutes = require("./routes/job-routes");
const applicationRoutes = require("./routes/application-routes");
const dashboardRoutes = require("./routes/dashboard-routes");
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Node+Express Server is running on port ${PORT}`);
});
