const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const User = require(path.join(__dirname, "..", "models", "UserModel"));

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pesotrack";

const COLLECTIONS_TO_CLEAR = [
  "transactions",
  "bills",
  "payments",
  "notifications",
  "audit_logs",
  "savings_goals",
  "feedback",
  "revisions",
  "financial_documents"
];

const DEMO_USERS = [
  {
    name: "PesoTrack Admin",
    email: "admin@pesotrack.test",
    password: "Admin123!",
    role: "admin"
  },
  {
    name: "PesoTrack User",
    email: "user@pesotrack.test",
    password: "User123!",
    role: "user"
  }
];

async function resetDemoData() {
  try {
    const connection = await mongoose.connect(MONGO_URI);
    const dbName = connection.connection.name;

    if (dbName !== "pesotrack") {
      throw new Error(
        `Safety check stopped the reset because the connected database is "${dbName}", not "pesotrack".`
      );
    }

    console.log(`Connected to MongoDB database: ${dbName}`);
    console.log("");

    console.log("Clearing all existing PesoTrack data...");

    for (const collectionName of COLLECTIONS_TO_CLEAR) {
      try {
        const result = await mongoose.connection.db
          .collection(collectionName)
          .deleteMany({});

        console.log(
          `  ${collectionName}: ${result.deletedCount} document(s) deleted`
        );
      } catch (error) {
        if (error.codeName === "NamespaceNotFound") {
          console.log(`  ${collectionName}: collection does not exist yet`);
        } else {
          throw error;
        }
      }
    }

    // Clean slate: remove ALL existing users in the local PesoTrack database.
    const deletedUsers = await User.deleteMany({});
    console.log(`  users: ${deletedUsers.deletedCount} user(s) deleted`);

    console.log("");
    console.log("Creating fresh demo accounts...");

    const usersToCreate = [];

    for (const demoUser of DEMO_USERS) {
      const passwordHash = await bcrypt.hash(demoUser.password, 10);

      usersToCreate.push({
        name: demoUser.name,
        email: demoUser.email,
        password: passwordHash,
        role: demoUser.role
      });
    }

    await User.insertMany(usersToCreate);

    console.log("");
    console.log("Fresh demo accounts:");
    console.log("--------------------------------");
    console.log("ADMIN");
    console.log("Email:    admin@pesotrack.test");
    console.log("Password: Admin123!");
    console.log("");
    console.log("USER");
    console.log("Email:    user@pesotrack.test");
    console.log("Password: User123!");
    console.log("--------------------------------");
    console.log("");
    console.log("PesoTrack clean slate reset completed.");
    console.log("All previous local users and demo records were removed.");
  } catch (error) {
    console.error("");
    console.error("RESET FAILED");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

resetDemoData();
