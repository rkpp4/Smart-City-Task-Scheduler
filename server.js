require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");

const User = require("./models/User");
const Issue = require("./models/Issue");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_smartcity_2026";

/* ===============================
   AUTH MIDDLEWARE
=============================== */

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: "Forbidden" });

  next();
};

/* ===============================
   AUTH ROUTES
=============================== */

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, mobile, area, role } = req.body;

    const userRole = ["citizen", "monitor"].includes(role) ? role : "citizen";

    const user = new User({
      name,
      email,
      password,
      mobile,
      area,
      role: userRole,
    });

    await user.save();

    res.json({
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      password,
    });

    if (!user)
      return res.status(401).json({
        error: "Invalid credentials",
      });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===============================
   ISSUE ROUTES
=============================== */

app.post("/issues", authenticate, authorize(["citizen"]), async (req, res) => {
  try {
    const { title, description, category, location, priority, photo } =
      req.body;

    const issue = new Issue({
      title,
      description,
      category,
      location,
      priority,
      photo,
      createdBy: req.user.id,
    });

    await issue.save();

    res.json({
      message: "Issue submitted successfully",
      issue,
    });
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
});

app.get(
  "/my-issues",
  authenticate,
  authorize(["citizen"]),
  async (req, res) => {
    try {
      const issues = await Issue.find({
        createdBy: req.user.id,
      });

      res.json(issues);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },
);

app.get("/issues", authenticate, authorize(["monitor"]), async (req, res) => {
  try {
    const issues = await Issue.find().populate("createdBy", "name email");

    res.json(issues);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===============================
   UPDATE ISSUE STATUS (NEW FIX)
=============================== */

app.put(
  "/issues/status/:id",
  authenticate,
  authorize(["monitor"]),
  async (req, res) => {
    try {
      const issue = await Issue.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          assignedWorkerName: req.body.assignedWorkerName,
          assignedWorkerPhone: req.body.assignedWorkerPhone,
          resolutionPhoto: req.body.resolutionPhoto,
        },
        { new: true },
      );

      if (!issue)
        return res.status(404).json({
          error: "Issue not found",
        });

      res.json({
        message: "Issue status updated successfully",
        issue,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },
);

/* ===============================
   ADD MONITOR REMARKS (NEW FIX)
=============================== */

app.put(
  "/issues/remarks/:id",
  authenticate,
  authorize(["monitor"]),
  async (req, res) => {
    try {
      const issue = await Issue.findById(req.params.id);

      if (!issue)
        return res.status(404).json({
          error: "Issue not found",
        });

      issue.remarks.push({
        text: req.body.remark,
        addedBy: req.user.id,
      });

      await issue.save();

      res.json({
        message: "Remark added successfully",
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },
);

/* ===============================
   DASHBOARD STATS
=============================== */

app.get("/dashboard/stats", authenticate, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "citizen") query.createdBy = req.user.id;

    const issues = await Issue.find(query);

    const stats = {
      total: issues.length,

      submitted: issues.filter((i) => i.status === "Submitted").length,

      approved: issues.filter((i) => i.status === "Approved").length,

      inProgress: issues.filter((i) => i.status === "In Progress").length,

      resolved: issues.filter((i) => i.status === "Resolved").length,

      closed: issues.filter((i) => i.status === "Closed").length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/health", (req, res) => {
  res.send("Smart City Task Scheduler running successfully");
});

/* ===============================
   DEFAULT USERS SEED
=============================== */

const setupDefaultData = async () => {
  if ((await User.countDocuments()) === 0) {
    await User.create([
      {
        name: "Alice Citizen",
        email: "citizen@test.com",
        password: "password",
        role: "citizen",
      },
      {
        name: "Bob Monitor",
        email: "monitor@test.com",
        password: "password",
        role: "monitor",
      },
    ]);

    console.log("Default users inserted");
  }
};

/* ===============================
   SAMPLE ISSUES SEED
=============================== */

const seedData = async () => {
  if ((await Issue.countDocuments()) === 0) {
    const defaultUser = await User.findOne({
      email: "citizen@test.com",
    });

    if (!defaultUser) return;

    await Issue.insertMany([
      {
        title: "Street Light Not Working",
        description: "Street light near main road not working",
        category: "Electricity",
        location: "Main Road Area",
        status: "Submitted",
        createdBy: defaultUser._id,
      },
    ]);

    console.log("Sample issues inserted");
  }
};

/* ===============================
   SERVER START
=============================== */

let serverStarted = false;

const startServer = async () => {
  if (serverStarted) return;

  const mongoServer = await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  console.log("Connected to In-Memory MongoDB");

  await setupDefaultData();

  await seedData();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  serverStarted = true;
};

module.exports = {
  startServer,
  app,
};

if (require.main === module) startServer();
