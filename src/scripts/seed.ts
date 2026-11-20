import "dotenv/config.js";
import { connectToMongoDB } from "../config/db.js";

const db = await connectToMongoDB();

const categories = [
  { name: "Construction Equipment", slug: "construction", icon: "construction", order: 1 },
  { name: "Photography Equipment", slug: "photography", icon: "camera", order: 2 },
  { name: "Vehicles & Transportation", slug: "transport", icon: "truck", order: 3 },
  { name: "Agriculture Equipment", slug: "agriculture", icon: "tractor", order: 4 },
  { name: "Electronics", slug: "electronics", icon: "laptop", order: 5 },
  { name: "Event Equipment", slug: "events", icon: "music", order: 6 },
];

const reviews = [
  {
    name: "Sarah Mitchell",
    role: "Verified renter",
    rating: 5,
    comment:
      "Booking was simple and the excavator arrived on site exactly when promised. Great communication from the owner.",
    createdAt: new Date("2026-10-12").toISOString(),
  },
  {
    name: "James Carter",
    role: "Verified renter",
    rating: 5,
    comment:
      "Rented a camera kit for a weekend shoot. The equipment was clean, complete and far cheaper than buying.",
    createdAt: new Date("2026-10-18").toISOString(),
  },
  {
    name: "Emily Nguyen",
    role: "Verified renter",
    rating: 4,
    comment:
      "Flexible weekly rental options saved us a lot on our production. Payment was quick and the terms were clear.",
    createdAt: new Date("2026-11-02").toISOString(),
  },
  {
    name: "Michael Brown",
    role: "Verified renter",
    rating: 5,
    comment:
      "I found a generator for my event within minutes. The owner was verified and pickup could not have been easier.",
    createdAt: new Date("2026-11-09").toISOString(),
  },
];

if ((await db.collection("categories").countDocuments()) === 0) {
  await db.collection("categories").insertMany(categories);
  console.log(`Seeded ${categories.length} categories`);
}

if ((await db.collection("reviews").countDocuments()) === 0) {
  await db.collection("reviews").insertMany(reviews);
  console.log(`Seeded ${reviews.length} reviews`);
}

process.exit(0);
