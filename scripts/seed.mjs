// Seeds users (hashed passwords), sample MySQL data, and MongoDB indexes + sample reports.
// Run with: npm run seed
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

for (const [u, p, r] of [['admin', 'admin123', 'Admin'], ['staff', 'staff123', 'Staff']]) {
  await db.query('INSERT IGNORE INTO Users (Username, Password_Hash, Role) VALUES (?,?,?)', [u, await bcrypt.hash(p, 10), r]);
}

const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM Disaster');
if (n === 0) {
  await db.query('INSERT INTO Disaster (Disaster_Name, Disaster_Type, Location, Start_Date, Severity) VALUES ?', [[
    ['Kerala Floods 2026', 'Flood', 'Wayanad, Kerala', '2026-08-10', 'Critical'],
    ['Odisha Cyclone 2026', 'Cyclone', 'Puri, Odisha', '2026-09-15', 'High'],
  ]]);
  await db.query('INSERT INTO Relief_Center (Center_Name, Location, Capacity, Contact_Number, Email) VALUES ?', [[
    ['Wayanad Relief Camp A', 'Kalpetta, Wayanad', 500, '9876500001', 'campa@relief.org'],
    ['Puri Shelter Hub', 'Puri, Odisha', 300, '9876500002', 'puri@relief.org'],
  ]]);
  await db.query('INSERT INTO Resource (Resource_Name, Category, Unit, Available_Quantity, Minimum_Stock) VALUES ?', [[
    ['Rice Bags', 'Food', 'kg', 5000, 500],
    ['Drinking Water', 'Water', 'litres', 8000, 1000],
    ['First Aid Kits', 'Medicine', 'kits', 300, 50],
    ['Blankets', 'Clothing', 'pieces', 800, 100],
    ['Tarpaulin Sheets', 'Shelter', 'pieces', 60, 100],
  ]]);
  await db.query('INSERT INTO Beneficiary (Beneficiary_Name, Age, Gender, Contact_Number, Vulnerability_Level, Center_ID, Disaster_ID) VALUES ?', [[
    ['Lakshmi Nair', 68, 'Female', '9000000001', 'Critical', 1, 1],
    ['Arun Kumar', 34, 'Male', '9000000002', 'Medium', 1, 1],
    ['Sita Das', 7, 'Female', '9000000003', 'High', 2, 2],
  ]]);
  await db.query('INSERT INTO Aid_Request (Center_ID, Disaster_ID, Priority) VALUES (1, 1, "Critical"), (2, 2, "High")');
  await db.query('INSERT INTO Request_Item (Request_ID, Resource_ID, Quantity_Requested) VALUES (1,1,1000),(1,2,2000),(2,4,200)');
}

const mongo = await new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 }).connect();
const col = mongo.db(process.env.MONGO_DB).collection('field_reports');
await col.createIndex({ disasterId: 1, createdAt: -1 });
await col.createIndex({ reportType: 1 });
await col.createIndex({ notes: 'text', tags: 'text' });
if ((await col.countDocuments()) === 0) {
  await col.insertMany([
    { disasterId: 1, disasterName: 'Kerala Floods 2026', reportType: 'Damage', severity: 5, notes: 'Bridge near Kalpetta washed out, three villages cut off.', tags: ['bridge', 'cut-off'], details: { affectedPeople: 1200, roadAccess: 'Blocked' }, reportedBy: 'staff', createdAt: new Date() },
    { disasterId: 1, disasterName: 'Kerala Floods 2026', reportType: 'Needs', severity: 4, notes: 'Camp A needs drinking water and baby food urgently.', tags: ['water', 'infants'], details: { affectedPeople: 400, roadAccess: 'Limited' }, reportedBy: 'staff', createdAt: new Date() },
    { disasterId: 2, disasterName: 'Odisha Cyclone 2026', reportType: 'Medical', severity: 3, notes: 'Several minor injuries, first aid kits running low.', tags: ['injuries', 'first-aid'], details: { affectedPeople: 85, roadAccess: 'Open' }, reportedBy: 'staff', createdAt: new Date() },
  ]);
}
await mongo.close();
await db.end();
console.log('Seed complete. Logins: admin/admin123 (Admin), staff/staff123 (Staff)');
