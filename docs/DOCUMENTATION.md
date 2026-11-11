# Project Documentation – Disaster Relief Resource Allocation and Aid Distribution System

DBMS Experiential Learning – Level 3 Project, PES University
Team: Parnika Machamma (PES2UG24CS255), Roshini Madisetty (PES2UG24CS256)
Stack: Next.js 14 (UI + API route handlers) · MySQL · MongoDB · Git/GitHub

## 1. Problem statement
During floods, cyclones and earthquakes, relief centres request food, water, medicine and shelter, but stock is limited and requests arrive faster than they can be tracked. Manual records lead to over-allocation, unfair prioritisation and no proof that aid reached the people who needed it. This system tracks disasters, centre requests, stock, allocations and final distribution to beneficiaries in one place.

## 2. Objectives
- Record disasters, relief centres, beneficiaries and resource stock.
- Let centres raise prioritised aid requests with multiple items.
- Allocate stock to the most urgent requests without ever exceeding stock or the requested amount.
- Track every distribution to a beneficiary and the delivery status of each allocation.
- Capture unstructured field reports and summarise them.

## 3. Scope
In scope: web app for Admin and Staff users, MySQL relational model, MongoDB field reports, dashboards, search and filters.
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
ER diagram here (`docs/ER_diagram_relational_schema.pdf`).
The diagram must include the standalone `Users` entity (User_ID, Username, Password_Hash, Role). The MongoDB `field_reports` collection is documented separately in Section 8 (it references `Disaster_ID` by value).

### Relationships
| Relationship | Cardinality | Implemented by |
|--------------|-------------|----------------|
| Relief_Center – Aid_Request | 1 : N | `Aid_Request.Center_ID` FK |
| Disaster – Aid_Request | 1 : N | `Aid_Request.Disaster_ID` FK |
| Relief_Center – Beneficiary | 1 : N | `Beneficiary.Center_ID` FK |
| Disaster – Beneficiary | 1 : N | `Beneficiary.Disaster_ID` FK |
| Aid_Request – Resource | M : N | junction table `Request_Item` |
| Aid_Request – Allocation | 1 : N | `Allocation.Request_ID` FK |
| Allocation – Resource | M : N | junction table `Allocation_Item` |
| Allocation – Distribution | 1 : N | `Distribution.Allocation_ID` FK |
| Beneficiary – Distribution | 1 : N | `Distribution.Beneficiary_ID` FK |
| Distribution – Resource | M : N | junction table `Distribution_Item` |

## 6. Relational schema
the relational schema image here (`docs/ER_diagram_relational_schema.pdf`). Text form:

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

### Normalization
Many-to-many relationships are resolved with junction tables (`Request_Item`, `Allocation_Item`, `Distribution_Item`), so there are no repeating groups (1NF). In the junction tables every non-key attribute depends on the whole composite key (2NF), and no table stores a non-key attribute that depends on another non-key attribute (3NF). Descriptive data such as a resource's name, unit and stock lives only in `Resource`.

## 7. Database choice and justification
The technology for each type of data is chosen from the access pattern and integrity needs of that data, not for technology demonstration.

| Data | Database | Why |
|------|----------|-----|
| Disasters, centres, resources, beneficiaries, requests, allocations, distributions, users | MySQL | Highly structured, many relationships, needs foreign keys, CHECK constraints, triggers and ACID transactions so stock never goes negative or over-allocated |
| Field reports | MongoDB | Free-text notes, tags and details that differ by report type (damage, needs, medical, access). A flexible document model and text index suit this better than many nullable columns; the aggregation pipeline gives quick summaries |

**Why MySQL for the core operational data.** Disasters, resources, requests, allocations and distributions form a tightly connected chain: every allocation must refer to a valid request and resource, and every distribution to a valid allocation and beneficiary.
- *Referential integrity:* foreign keys prevent orphaned records, for example aid distributed against a request that does not exist.
- *Data integrity:* CHECK, NOT NULL, UNIQUE and ENUM constraints enforce rules at the database level, such as non-negative quantities and a fixed set of statuses.
- *ACID transactions:* allocating stock deducts availability and records the allocation as one unit. Either both succeed or neither does, which prevents over-allocation.
- *Relational queries:* reports such as aid per disaster, unmet requests and stock utilisation need JOINs, GROUP BY, HAVING, subqueries and views.
- *Server-side logic:* triggers and a stored procedure keep stock and statuses consistent regardless of which client writes the data.

**Why MongoDB for field reports.** Field reports are written on the ground and vary widely from report to report.
- *Flexible schema:* one report may carry affected-people counts and road access, another only free-text notes. A document model stores each report as it is, with no nullable columns or extra join tables.
- *Nested data:* tags and report-specific details sit inside one document.
- *Access pattern:* reports are mostly appended and read whole, with no multi-table joins or cross-record transactions. Indexes on disaster, time and type keep filtering fast, and a text index supports keyword search.
- *Schema evolution:* new report fields can be added without `ALTER TABLE` migrations.

**Why not a single database.** Forcing field reports into MySQL would mean many nullable columns or a generic key-value table that is awkward to query. Forcing inventory and allocation into MongoDB would give up foreign keys and multi-record ACID guarantees, which this domain depends on. The two stores are linked by the `Disaster_ID` value stored in each report document.

**Why not a vector database.** The project has no embedding or similarity-search requirement. Reports are retrieved by disaster, type, date and keywords, not by meaning, so a vector store would add complexity without benefit (Requirement 8 is optional).

## 8. Data dictionary (MySQL)
| Table | Columns (type, constraints) |
|-------|------------------------------|
| Disaster | Disaster_ID INT PK AI; Disaster_Name VARCHAR(100) NOT NULL, non-blank; Disaster_Type VARCHAR(50) NOT NULL; Location VARCHAR(150) NOT NULL; Start_Date DATE NOT NULL; Severity ENUM(Low,Medium,High,Critical) NOT NULL; Status ENUM(Active,Controlled,Closed) DEFAULT Active |
| Relief_Center | Center_ID INT PK AI; Center_Name VARCHAR(100) NOT NULL; Location VARCHAR(150) NOT NULL; Capacity INT NOT NULL CHECK >0; Contact_Number VARCHAR(15); Email VARCHAR(100) UNIQUE |
| Resource | Resource_ID INT PK AI; Resource_Name VARCHAR(100) NOT NULL, non-blank; Category ENUM(Food,Water,Medicine,Clothing,Shelter,Other); Unit VARCHAR(30) NOT NULL; Available_Quantity INT >=0 DEFAULT 0; Minimum_Stock INT >=0 DEFAULT 0 |
| Beneficiary | Beneficiary_ID INT PK AI; Beneficiary_Name VARCHAR(100) NOT NULL, non-blank; Age INT >=0; Gender VARCHAR(20); Contact_Number VARCHAR(15); Vulnerability_Level ENUM('Low','Medium','High','Critical'); Center_ID FK; Disaster_ID FK |
| Aid_Request | Request_ID INT PK AI; Center_ID FK; Disaster_ID FK; Request_Date DATETIME DEFAULT now; Priority ENUM('Low','Medium','High','Critical') NOT NULL; Status ENUM(Pending,Partially Allocated,Allocated,Rejected,Completed) DEFAULT Pending |
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
1. **Transactions** – `sp_allocate_resource` (START TRANSACTION / COMMIT / ROLLBACK on error); aid request creation and distribution recording use transactions in the API (`lib/db.js` transaction helper).
2. **Views** – `Pending_High_Priority_Requests`, `Low_Stock_Resources` (shown on the dashboard).
3. **Stored procedure** – `sp_allocate_resource` called from the allocations page.
4. **Triggers** – `trg_allocitem_before_insert` (stock and remaining-quantity checks), `trg_allocitem_after_insert` (deduct stock, update request item and request status), `trg_distitem_before_insert` (no over-distribution).
5. **Indexing** – 5 B-tree indexes on frequently filtered columns (`Aid_Request.Priority`, `Aid_Request.Status`, `Disaster.Location`, `Resource.Category`, `Beneficiary.Center_ID`), plus MongoDB indexes.
6. **NoSQL aggregation** – `$group` pipeline over field reports.
7. **Full-text search** – MongoDB text index on report notes and tags.

## 10. Data validation and integrity
Validation is applied in layers, and the database layer is authoritative so rules hold even if the UI or API is bypassed.

| Layer | Mechanism | Example |
|-------|-----------|---------|
| Database – column rules | NOT NULL, UNIQUE, ENUM, DEFAULT, CHECK | Blank disaster name rejected; negative stock rejected; `Capacity > 0` |
| Database – referential | Foreign keys | A disaster that has requests cannot be deleted |
| Database – composite keys | PK on junction tables | The same resource cannot appear twice in one request |
| Database – business rules | Triggers | Cannot allocate more than stock or than the remaining requested quantity; cannot distribute more than allocated |
| Database – atomicity | Transactions / stored procedure | Allocation either fully succeeds or fully rolls back |
| API | Role check, input validation, parameterised queries | Staff receives 403 on admin-only actions; field-report severity must be 1–5 |
| UI | Form controls and error messages | Database errors are shown to the user as readable messages |

## 11. Important queries
See `sql/queries.sql`: joins, GROUP BY with HAVING, aggregates with ORDER BY, subquery and NOT EXISTS, views, DML in a rolled-back transaction, procedure call, trigger failure test.

## 12. System architecture
```
Browser (Next.js pages, React)
        |  fetch /api/...
Next.js Route Handlers  (JWT cookie check -> role check -> validation)
   |                         |
 MySQL (mysql2 pool)     MongoDB (mongodb driver)
 relational data         field reports
```
Credentials are read from `.env.local` (not committed). Database constraints and triggers validate data even if the UI is bypassed.

### 12.1 Security implementation
1. **Password hashing:** passwords are hashed with bcrypt before being stored in MySQL; plain-text passwords are never stored.
2. **JWT authentication:** JSON Web Tokens authenticate users and are verified on protected API endpoints. The signing secret comes from an environment variable.
3. **Secure cookie handling:** the token is stored in an HttpOnly cookie, and the Secure attribute is enabled in production so it is sent only over HTTPS.
4. **Role-based access control:** Admin and Staff roles are enforced by server-side checks in middleware and route handlers, not only by hiding buttons in the UI.
5. **SQL injection prevention:** all SQL uses parameterised queries.
6. **Environment variable protection:** database, MongoDB and JWT configuration is read from environment variables; `.env.local` is git-ignored and `.env.example` documents the required keys.

## 13. Application screenshots
Screenshots are in `docs/screenshots/`: login, dashboard, disasters (search/filter), resources (low stock), beneficiaries, aid request form, allocation (admin), distribution, field reports (search + summary), permission error for Staff.

## 14. Testing results
Evidence screenshots for each test are in `docs/screenshots/`, referenced by test number.

| # | Test | Expected | Result | Evidence |
|---|------|----------|--------|----------|
| 1 | Login with wrong password | "Wrong username or password" | Pass | T1 |
| 2 | Open /disasters without logging in | Redirect to /login | Pass | T2 |
| 3 | Staff opens Disasters page | No add/delete controls; API returns 403 on POST | Pass | T3 |
| 4 | Add disaster with blank name (Admin) | Rejected by CHECK constraint | Pass | T4 |
| 5 | Add resource with negative quantity | Rejected by CHECK constraint | Pass | T5 |
| 6 | Raise request with the same resource twice | Rejected (primary key); nothing saved (rollback) | Pass | T6 |
| 7 | Allocate more than stock | "Insufficient stock for this resource" | Pass | T7 |
| 8 | Allocate more than requested | "Allocation exceeds the remaining requested quantity" | Pass | T8 |
| 9 | Valid allocation | Stock decreases, request item updated, status becomes Partially Allocated / Allocated | Pass | T9 |
| 10 | Distribute more than allocated | "Distribution exceeds the allocated quantity" | Pass | T10 |
| 11 | Distribute everything allocated | Allocation status becomes Delivered | Pass | T11 |
| 12 | Add field report with severity 9 | Rejected with message | Pass | T12 |
| 13 | Search field reports for "water" | Matching reports listed | Pass | T13 |
| 14 | Delete a disaster that has requests | Rejected by foreign key | Pass | T14 |

## 15. Individual contributions
| Member | Database | Application |
|--------|----------|-------------|
| Roshini Madisetty | Triggers, stored procedure, views (`advanced.sql`); transaction logic | Login/roles (`lib/auth.js`, middleware), allocations and distributions APIs and pages |
| Parnika Machamma | Schema, constraints and indexes (`schema.sql`), `queries.sql`; MongoDB model, indexes and aggregation | Disasters, resources, beneficiaries, requests and field-report pages and APIs; dashboard |

## 16. Conclusion and future enhancements
The system prevents over-allocation at the database level, keeps a full trail from request to delivery, and combines a relational model with a document store where each fits best.
Future work: relief-centre management screen, map view of disasters, SMS alerts for low stock, vector search over field reports to find similar past incidents, per-centre staff accounts.
