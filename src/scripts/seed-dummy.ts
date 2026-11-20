import "dotenv/config.js";
import type { Document, Filter } from "mongodb";
import { connectToMongoDB } from "../config/db.js";

const db = await connectToMongoDB();

/** Re-running this script never creates duplicates: every record has a fixed id. */
async function seed(collection: string, docs: Record<string, unknown>[]) {
  for (const doc of docs) {
    await db
      .collection(collection)
      .updateOne(
        { _id: String(doc._id) } as unknown as Filter<Document>,
        { $setOnInsert: doc },
        { upsert: true },
      );
  }
  console.log(`${collection}: ${docs.length} dummy records ready`);
}

const iso = (date: string) => new Date(date).toISOString();

const owners = [
  {
    id: "demo-owner-1",
    name: "Marcus Bennett",
    email: "marcus.bennett@example.com",
    phone: "+1 415 555 0148",
    company: "Bennett Equipment Co.",
    location: "San Francisco, CA",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80",
    bio: "Heavy equipment owner with 12 years of experience.",
    licenseNumber: "CA-BIZ-884219",
    joinedAt: iso("2024-03-18"),
    verified: true,
  },
  {
    id: "demo-owner-2",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+1 510 555 0182",
    company: "Sharma Rentals",
    location: "Oakland, CA",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    bio: "Cameras, drones and event gear for creative teams.",
    licenseNumber: "CA-BIZ-551204",
    joinedAt: iso("2024-07-02"),
    verified: true,
  },
];

const users = [
  { _id: "demo-admin", name: "Admin User", email: "admin@example.com", role: "admin", image: "", emailVerified: true, createdAt: iso("2024-01-10"), updatedAt: iso("2024-01-10") },
  ...owners.map((owner) => ({
    _id: owner.id,
    name: owner.name,
    email: owner.email,
    role: "owner",
    image: owner.avatar,
    emailVerified: true,
    createdAt: owner.joinedAt,
    updatedAt: owner.joinedAt,
  })),
  ...[
    ["demo-customer-1", "Sarah Mitchell", "sarah.mitchell@example.com"],
    ["demo-customer-2", "James Carter", "james.carter@example.com"],
    ["demo-customer-3", "Emily Nguyen", "emily.nguyen@example.com"],
    ["demo-customer-4", "Michael Brown", "michael.brown@example.com"],
    ["demo-customer-5", "Olivia Davis", "olivia.davis@example.com"],
  ].map(([id, name, email], index) => ({
    _id: id,
    name,
    email,
    role: "customer",
    image: "",
    emailVerified: true,
    createdAt: iso(`2025-0${index + 2}-12`),
    updatedAt: iso(`2025-0${index + 2}-12`),
  })),
];

const equipment = [
  ["demo-eq-1", "CAT 320 Excavator", "Construction", "San Francisco, CA", 450, "daily", 2, 3, "excellent", "Caterpillar", "320 GC", "https://images.unsplash.com/photo-1652613015049-be06063b559c?auto=format&fit=crop&w=800&q=80", "Approved", 95, owners[0]],
  ["demo-eq-2", "Bobcat S650 Skid Steer", "Construction", "San Jose, CA", 390, "daily", 1, 2, "good", "Bobcat", "S650", "https://images.unsplash.com/photo-1650220691079-7358e0760f1c?auto=format&fit=crop&w=800&q=80", "Approved", 80, owners[0]],
  ["demo-eq-3", "Canon EOS R5 Camera Kit", "Photography", "Oakland, CA", 85, "daily", 4, 5, "excellent", "Canon", "EOS R5", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80", "Approved", 88, owners[1]],
  ["demo-eq-4", "DJI Mavic 3 Pro Drone", "Photography", "Berkeley, CA", 120, "daily", 3, 4, "new", "DJI", "Mavic 3 Pro", "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80", "Pending", 60, owners[1]],
  ["demo-eq-5", "Honda EU3000iS Generator", "Events", "San Jose, CA", 60, "daily", 5, 6, "good", "Honda", "EU3000iS", "https://images.unsplash.com/photo-1680796261004-cb56372e3599?auto=format&fit=crop&w=800&q=80", "Approved", 72, owners[0]],
  ["demo-eq-6", "JBL EON715 PA Speaker", "Events", "Oakland, CA", 45, "daily", 6, 8, "new", "JBL", "EON715", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80", "Approved", 65, owners[1]],
  ["demo-eq-7", "Bosch Rotary Hammer", "Power Tools", "San Francisco, CA", 35, "daily", 6, 6, "good", "Bosch", "GBH 2-28", "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80", "Rejected", 20, owners[0]],
  ["demo-eq-8", "Makita Circular Saw", "Power Tools", "Daly City, CA", 20, "daily", 8, 10, "excellent", "Makita", "5008MGA", "https://images.unsplash.com/photo-1426927308491-6380b6a9936f?auto=format&fit=crop&w=800&q=80", "Pending", 40, owners[1]],
  ["demo-eq-9", "Toyota Hilux Pickup", "Transport", "Fremont, CA", 110, "daily", 2, 3, "excellent", "Toyota", "Hilux 2023", "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80", "Approved", 78, owners[0]],
  ["demo-eq-10", "John Deere Tractor", "Agriculture", "Modesto, CA", 240, "weekly", 1, 2, "good", "John Deere", "5E -series", "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80", "Approved", 70, owners[0]],
  ["demo-eq-11", "MacBook Pro 16 M3", "Electronics", "Oakland, CA", 75, "weekly", 3, 4, "new", "Apple", "MacBook Pro M3", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80", "Approved", 85, owners[1]],
  ["demo-eq-12", "LED Stage Light Set", "Events", "San Jose, CA", 55, "daily", 7, 8, "excellent", "Chauvet", "DJ LED Bar", "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80", "Pending", 50, owners[1]],
].map(([id, name, category, location, rentalPrice, rentalType, availableQuantity, totalQuantity, condition, brand, model, image, status, popularity, owner]) => ({
  _id: id,
  id,
  name,
  description: `${name} — professionally maintained and ready for immediate pickup. Includes all standard accessories and a quick handover walkthrough.`,
  category,
  location,
  rentalPrice,
  rentalType,
  availableQuantity,
  totalQuantity,
  condition,
  brand,
  model,
  image,
  terms: "Valid ID and insurance required. Fuel/consumables are the renter's responsibility. Return in the same condition. Late returns incur an extra day's fee.",
  status: String(status).toLowerCase(),
  popularity,
  createdAt: iso("2026-10-05"),
  owner,
}));

const customers = users.filter((user) => user.role === "customer");
const rentalRows = [
  [0, 0, 0, "2026-11-01", "2026-11-04", 1, "paid", "completed"],
  [2, 1, 2, "2026-11-06", "2026-11-08", 2, "paid", "active"],
  [1, 2, 1, "2026-11-10", "2026-11-12", 1, "pending", "confirmed"],
  [3, 3, 4, "2026-11-14", "2026-11-16", 2, "paid", "completed"],
  [4, 4, 5, "2026-11-18", "2026-11-19", 4, "pending", "pending"],
  [0, 6, 2, "2026-11-20", "2026-11-22", 1, "failed", "cancelled"],
  [2, 8, 0, "2026-11-21", "2026-11-24", 1, "paid", "active"],
  [1, 10, 1, "2026-11-23", "2026-11-30", 2, "pending", "confirmed"],
  [3, 5, 3, "2026-10-15", "2026-10-18", 3, "refunded", "completed"],
  [4, 11, 4, "2026-11-25", "2026-11-27", 1, "pending", "pending"],
] as const;

const bookings = rentalRows.map((row, index) => {
  const [customerIndex, equipmentIndex, , startDate, endDate, quantity, paymentStatus, bookingStatus] = row;
  const customer = customers[customerIndex]!;
  const item = equipment[equipmentIndex]!;
  const days = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000,
  );
  const perUnit = item.rentalType === "weekly" ? 7 : item.rentalType === "monthly" ? 30 : 1;
  const totalAmount = Math.ceil(days / perUnit) * Number(item.rentalPrice) * quantity;

  return {
    _id: `demo-booking-${index + 1}`,
    equipmentId: item._id,
    equipmentName: item.name,
    equipmentImage: item.image,
    userId: customer._id,
    customer: { name: customer.name, email: customer.email, phone: "+1 415 555 0100" },
    startDate,
    endDate,
    quantity,
    rentalType: item.rentalType,
    days,
    totalAmount,
    contactNumber: "+1 415 555 0100",
    deliveryAddress: "120 Market Street, San Francisco, CA",
    notes: index % 2 === 0 ? "Please deliver before 9 AM." : "Pickup from owner.",
    paymentStatus,
    bookingStatus,
    createdAt: iso(startDate),
  };
});

const rentals = bookings.map((booking, index) => {
  const item = equipment.find((entry) => entry._id === booking.equipmentId);
  return {
    _id: `demo-rental-${index + 1}`,
    bookingId: booking._id,
    customer: {
      name: booking.customer.name,
      email: booking.customer.email,
      phone: booking.contactNumber,
    },
    equipmentId: booking.equipmentId,
    equipmentName: booking.equipmentName,
    equipmentCategory: item?.category ?? "Construction",
    equipmentImage: booking.equipmentImage,
    startDate: booking.startDate,
    endDate: booking.endDate,
    rentalType: booking.rentalType,
    quantity: booking.quantity,
    bookingAmount: booking.totalAmount,
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.bookingStatus,
    createdAt: booking.createdAt,
  };
});

const payments = bookings
  .filter((booking) => booking.paymentStatus === "paid")
  .map((booking, index) => ({
    _id: `demo-payment-${index + 1}`,
    stripeSessionId: `cs_demo_${index + 1}`,
    bookingId: booking._id,
    amount: booking.totalAmount,
    currency: "usd",
    status: "paid",
    createdAt: booking.createdAt,
  }));

const favorites = [
  ["demo-customer-1", "demo-eq-1"],
  ["demo-customer-1", "demo-eq-3"],
  ["demo-customer-2", "demo-eq-5"],
  ["demo-customer-2", "demo-eq-9"],
  ["demo-customer-3", "demo-eq-4"],
  ["demo-customer-4", "demo-eq-11"],
  ["demo-customer-5", "demo-eq-6"],
  ["demo-customer-5", "demo-eq-12"],
].map(([userId, equipmentId], index) => ({
  _id: `demo-favorite-${index + 1}`,
  userId,
  equipmentId,
  createdAt: iso("2026-11-15"),
}));

const userProfiles = users.map((user, index) => ({
  _id: `demo-userprofile-${index + 1}`,
  userId: user._id,
  name: user.name,
  email: user.email,
  image: user.image,
  phone: "+1 415 555 0100",
  address: `${100 + index} Demo Street, San Francisco, CA`,
}));

await seed("user", users);
await seed("equipments", equipment);
await seed("bookings", bookings);
await seed("rentals", rentals);
await seed("payments", payments);
await seed("favorites", favorites);
await seed("userProfiles", userProfiles);
await seed(
  "ownerProfiles",
  owners.map((owner, index) => ({ ...owner, key: `demo-owner-${index + 1}` })),
);

console.log("Dummy data seeded. Re-run is safe (no duplicates).");
process.exit(0);
