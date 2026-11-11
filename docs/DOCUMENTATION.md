# Project Documentation – Disaster Relief Resource Allocation and Aid Distribution System

Team: Parnika Machamma (PES2UG24CS255), Roshini Madisetty (PES2UG24CS256)

## 1. Problem statement
During floods, cyclones and earthquakes, relief centres request food, water, medicine and shelter, but stock is limited and requests arrive faster than they can be tracked. Manual records lead to over-allocation, unfair prioritisation and no proof that aid reached the people who needed it. This system tracks disasters, centre requests, stock, allocations and final distribution to beneficiaries in one place.

## 2. Objectives
- Record disasters, relief centres, beneficiaries and resource stock.
- Let centres raise prioritised aid requests with multiple items.
- Allocate stock to the most urgent requests without ever exceeding stock or the requested amount.
- Track every distribution to a beneficiary and the delivery status of each allocation.
- Capture unstructured field reports and summarise them.

## 3. Scope
In scope: web app for Admin and Staff users, MySQL relational model, MongoDB field reports, dashboards and filters.
Out of scope: payments, GPS tracking, mobile app, SMS alerts.

## 4. Functional requirements
| ID | Requirement |
|----|-------------|
| FR1 | Users log in; passwords are hashed; roles Admin and Staff have different permissions |
| FR2 | Admin adds, updates the status of and deletes disasters; all users can search and filter them |
| FR3 | Admin manages resources and restocks; low stock is flagged |
| FR4 | Staff and Admin register beneficiaries with vulnerability level |
| FR5 | Staff and Admin raise aid requests with several items (saved as one transaction) |
| FR6 | Admin allocates stock to a request item; stock and request status update automatically |
| FR7 | Staff and Admin record distributions; cannot distribute more than allocated |
| FR8 | Staff and Admin add field reports (MongoDB); anyone can search them and see an aggregated summary |
| FR9 | Dashboard shows live counts, views and aggregates |

## 5. ER diagram
Insert the ER diagram from the miniproject here (`docs/er-diagram.png`).
Add the `Users` table to it (standalone entity: User_ID, Username, Password_Hash, Role) and note the MongoDB `field_reports` collection separately (it references `Disaster_ID` by value).

## 6. Relational schema
Insert the relational schema image here (`docs/relational-schema.png`). Text form:

```
Disaster(Disaster_ID PK, Disaster_Name, Disaster_Type, Location, Start_Date, Severity, Status)
Relief_Center(Center_ID PK, Center_Name, Location, Capacity, Contact_Number, Email UNIQUE)
Resource(Resource_ID PK, Resource_Name, Category, Unit, Available_Quantity, Minimum_Stock)
Beneficiary(Beneficiary_ID PK, Beneficiary_Name, Age, Gender, Contact_Number, Vulnerability_Level,
            Center_ID FK, Disaster_ID FK)
Aid_Request(Request_ID PK, Center_ID FK, Disaster_ID FK, Request_Date, Priority, Status)
Request_Item(Request_ID FK, Resource_ID FK, Quantity_Requested, Quantity_Allocated)  PK(Request_ID, Resource_ID)
Allocation(Allocation_ID PK, Request_ID FK, Allocation_Date, Allocation_Status)
Allocation_Item(Allocation_ID FK, Resource_ID FK, Allocated_Quantity)  PK(Allocation_ID, Resource_ID)
Distribution(Distribution_ID PK, Allocation_ID FK, Beneficiary_ID FK, Distribution_Date)
Distribution_Item(Distribution_ID FK, Resource_ID FK, Quantity_Distributed)  PK(Distribution_ID, Resource_ID)
Users(User_ID PK, Username UNIQUE, Password_Hash, Role)
```

## 7. Database choice and justification
| Data | Database | Why |
|------|----------|-----|
| Disasters, centres, resources, beneficiaries, requests, allocations, distributions, users | MySQL | Highly structured, many relationships, needs foreign keys, CHECK constraints, triggers and ACID transactions so stock never goes negative or over-allocated |
| Field reports | MongoDB | Free-text notes, tags and details that differ by report type (damage, needs, medical, access). A flexible document model and text index suit this better than many nullable columns; aggregation pipeline gives quick summaries |

A vector database is not used because the project has no embedding or similarity-search requirement.

## 8. Data dictionary (MySQL)
| Table | Columns (type, constraints) |
|-------|------------------------------|
| Disaster | Disaster_ID INT PK AI; Disaster_Name VARCHAR(100) NOT NULL, non-blank; Disaster_Type VARCHAR(50) NOT NULL; Location VARCHAR(150) NOT NULL; Start_Date DATE NOT NULL; Severity ENUM(Low,Medium,High,Critical) NOT NULL; Status ENUM(Active,Controlled,Closed) DEFAULT Active |
| Relief_Center | Center_ID INT PK AI; Center_Name VARCHAR(100) NOT NULL; Location VARCHAR(150) NOT NULL; Capacity INT NOT NULL CHECK >0; Contact_Number VARCHAR(15); Email VARCHAR(100) UNIQUE |
| Resource | Resource_ID INT PK AI; Resource_Name VARCHAR(100) NOT NULL, non-blank; Category ENUM(Food,Water,Medicine,Clothing,Shelter,Other); Unit VARCHAR(30) NOT NULL; Available_Quantity INT >=0 DEFAULT 0; Minimum_Stock INT >=0 DEFAULT 0 |
| Beneficiary | Beneficiary_ID INT PK AI; Beneficiary_Name VARCHAR(100) NOT NULL, non-blank; Age INT >=0; Gender VARCHAR(20); Contact_Number VARCHAR(15); Vulnerability_Level ENUM DEFAULT Medium; Center_ID FK; Disaster_ID FK |
| Aid_Request | Request_ID INT PK AI; Center_ID FK; Disaster_ID FK; Request_Date DATETIME DEFAULT now; Priority ENUM NOT NULL; Status ENUM(Pending,Partially Allocated,Allocated,Rejected,Completed) DEFAULT Pending |
| Request_Item | (Request_ID FK, Resource_ID FK) PK; Quantity_Requested >0; Quantity_Allocated between 0 and Quantity_Requested |
| Allocation | Allocation_ID INT PK AI; Request_ID FK; Allocation_Date DATETIME; Allocation_Status ENUM(Pending,Approved,Dispatched,Delivered) |
| Allocation_Item | (Allocation_ID FK, Resource_ID FK) PK; Allocated_Quantity >0 |
| Distribution | Distribution_ID INT PK AI; Allocation_ID FK; Beneficiary_ID FK; Distribution_Date DATETIME |
| Distribution_Item | (Distribution_ID FK, Resource_ID FK) PK; Quantity_Distributed >0 |
| Users | User_ID INT PK AI; Username VARCHAR(50) UNIQUE; Password_Hash VARCHAR(255) (bcrypt); Role ENUM(Admin,Staff) |

### MongoDB collection `field_reports`
```json
{
  "disasterId": 1, "disasterName": "Kerala Floods 2026",
  "reportType": "Damage | Needs | Medical | Access",
  "severity": 1-5, "notes": "free text", "tags": ["bridge", "water"],
  "details": { "affectedPeople": 1200, "roadAccess": "Open | Limited | Blocked" },
  "reportedBy": "staff", "createdAt": "ISODate"
}
```
Indexes: `{disasterId:1, createdAt:-1}` (reports of a disaster, newest first), `{reportType:1}` (filter and grouping), text index on `notes` and `tags` (keyword search).
Retrieval strategy: filter by `reportType`, `$text` search on notes/tags, sort by `createdAt`, and `$group` aggregation for the summary.

## 9. Database implementation
- `sql/schema.sql` – DDL: CREATE (10 tables + Users), ALTER (add Email, UNIQUE constraint), DROP (temporary table), primary/foreign keys, CHECK/ENUM/NOT NULL/UNIQUE constraints, indexes.
- `sql/advanced.sql` – 2 views, 3 triggers, 1 stored procedure with transaction.
- `scripts/seed.mjs` – users with bcrypt hashes, sample rows, MongoDB indexes and sample reports.

Advanced concepts demonstrated (requirement: at least four):
1. **Transactions** – `sp_allocate_resource` (START TRANSACTION / COMMIT / ROLLBACK on error); aid request creation and distribution recording use transactions in the API.
2. **Views** – `Pending_High_Priority_Requests`, `Low_Stock_Resources` (shown on the dashboard).
3. **Stored procedure** – `sp_allocate_resource` called from the allocations page.
4. **Triggers** – `trg_allocitem_before_insert` (stock and remaining-quantity checks), `trg_allocitem_after_insert` (deduct stock, update request item and request status), `trg_distitem_before_insert` (no over-distribution).
5. **Indexing** – 5 B-tree indexes on frequently filtered columns, plus MongoDB indexes.
6. **NoSQL aggregation** – `$group` pipeline over field reports.

## 10. Important queries
See `sql/queries.sql`: joins, GROUP BY with HAVING, aggregates with ORDER BY, subquery and NOT EXISTS, views, DML in a rolled-back transaction, procedure call, trigger failure test.

## 11. System architecture
```
Browser (Next.js pages, React)
        |  fetch /api/...
Next.js Route Handlers  (JWT cookie check -> role check -> validation)
   |                         |
 MySQL (mysql2 pool)     MongoDB (mongodb driver)
 relational data         field reports
```
Credentials are read from `.env.local` (not committed). Passwords are stored as bcrypt hashes. Session is an HttpOnly JWT cookie. All SQL uses parameterised queries (prevents SQL injection). Database constraints and triggers validate data even if the UI is bypassed.

## 12. Application screenshots
Add screenshots to `docs/screenshots/` and list them here: login, dashboard, disasters (search/filter), resources (low stock), beneficiaries, aid request form, allocation (admin), distribution, field reports (search + summary), permission error for Staff.

## 13. Testing results
| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Login with wrong password | "Wrong username or password" | Pass |
| 2 | Open /disasters without logging in | Redirect to /login  | Pass|
| 3 | Staff opens Disasters page | No add/delete controls; API returns 403 on POST | Pass |
| 4 | Add disaster with blank name (Admin) | Rejected by CHECK constraint | Pass |
| 5 | Add resource with negative quantity | Rejected by CHECK constraint | Pass |
| 6 | Raise request with the same resource twice | Rejected (primary key); nothing saved (rollback) | Pass |
| 7 | Allocate more than stock | "Insufficient stock for this resource" | Pass |
| 8 | Allocate more than requested | "Allocation exceeds the remaining requested quantity" | Pass |
| 9 | Valid allocation | Stock decreases, request item updated, status becomes Partially Allocated / Allocated | Pass |
| 10 | Distribute more than allocated | "Distribution exceeds the allocated quantity" | Pass |
| 11 | Distribute everything allocated | Allocation status becomes Delivered | Pass |
| 12 | Add field report with severity 9 | Rejected with message | Pass |
| 13 | Search field reports for "water" | Matching reports listed | Pass |
| 14 | Delete a disaster that has requests | Rejected by foreign key | Pass |

Fill the Result column (Pass/Fail with a screenshot) after running each test.

## 14. Individual contributions (edit to match your real commits)
| Member | Database | Application |
|--------|----------|-------------|
| Roshini Madisetty | Triggers, stored procedure, views (`advanced.sql`); transaction logic | Login/roles (`lib/auth.js`, middleware), allocations and distributions APIs and pages |
| Parnika Machamma | Schema, constraints and indexes (`schema.sql`), `queries.sql`; MongoDB model, indexes and aggregation | Disasters, resources, beneficiaries, requests and field-report pages and APIs; dashboard |

## 15. Conclusion and future enhancements
The system prevents over-allocation at the database level, keeps a full trail from request to delivery, and combines a relational model with a document store where each fits best.
Future work: relief-centre management screen, map view of disasters, SMS alerts for low stock, vector search over field reports to find similar past incidents, per-centre staff accounts.

### Security Implementation

The Disaster Relief Resource Allocation and Aid Distribution System implements multiple security mechanisms to protect user accounts, application endpoints and database operations.

The security features include:

1. **Password Hashing:** bcrypt is used to hash passwords before storing them in the MySQL database. Passwords are not stored in plain text.

2. **JWT Authentication:** JSON Web Tokens are used to authenticate users and verify their identity when accessing protected API endpoints.

3. **Secure Cookie Handling:** Authentication tokens are stored using HttpOnly cookies. The Secure attribute is enabled in production to ensure cookies are transmitted only over HTTPS.

4. **Role-Based Access Control:** The application supports Admin and Staff roles. Server-side authorization checks restrict access according to the user's role.

5. **SQL Injection Prevention:** Parameterized SQL queries are used to reduce the risk of SQL injection attacks.

6. **Environment Variable Protection:** Database credentials and sensitive configuration values are stored using environment variables instead of being hard-coded into the application.

These security mechanisms help protect sensitive information and prevent unauthorized access to application resources.