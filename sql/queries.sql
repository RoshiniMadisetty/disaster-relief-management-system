-- =====================================================================
-- Important queries (used in the app and in the documentation)
-- Run with: mysql -u root -p Disaster_Relief_DB < sql/queries.sql   (after seeding)
-- =====================================================================
USE Disaster_Relief_DB;

-- Q1 JOIN + ORDER BY: all aid requests with centre and disaster, most urgent first
SELECT ar.Request_ID, rc.Center_Name, d.Disaster_Name, ar.Priority, ar.Status
FROM Aid_Request ar
JOIN Relief_Center rc ON rc.Center_ID = ar.Center_ID
JOIN Disaster d ON d.Disaster_ID = ar.Disaster_ID
ORDER BY FIELD(ar.Priority,'Critical','High','Medium','Low'), ar.Request_Date;

-- Q2 GROUP BY + HAVING + aggregate: disasters with at least one request
SELECT d.Disaster_Name, COUNT(ar.Request_ID) AS Total_Requests
FROM Disaster d JOIN Aid_Request ar ON ar.Disaster_ID = d.Disaster_ID
GROUP BY d.Disaster_ID, d.Disaster_Name
HAVING COUNT(ar.Request_ID) >= 1
ORDER BY Total_Requests DESC;

-- Q3 Aggregate across 3 tables: total quantity distributed per resource
SELECT r.Resource_Name, SUM(di.Quantity_Distributed) AS Total_Distributed
FROM Distribution_Item di JOIN Resource r ON r.Resource_ID = di.Resource_ID
GROUP BY r.Resource_ID, r.Resource_Name
ORDER BY Total_Distributed DESC;

-- Q4 Subquery: resources stocked below the average stock level
SELECT Resource_Name, Available_Quantity
FROM Resource
WHERE Available_Quantity < (SELECT AVG(Available_Quantity) FROM Resource);

-- Q5 Correlated subquery: relief centres that have never raised a request
SELECT Center_Name FROM Relief_Center rc
WHERE NOT EXISTS (SELECT 1 FROM Aid_Request ar WHERE ar.Center_ID = rc.Center_ID);

-- Q6 Views
SELECT * FROM Pending_High_Priority_Requests;
SELECT * FROM Low_Stock_Resources;

-- Q7 DML (INSERT / UPDATE / DELETE) inside a transaction that is rolled back
START TRANSACTION;
INSERT INTO Resource (Resource_Name, Category, Unit, Available_Quantity, Minimum_Stock)
VALUES ('Test Item', 'Other', 'pieces', 10, 2);
UPDATE Resource SET Available_Quantity = Available_Quantity + 5 WHERE Resource_Name = 'Test Item';
DELETE FROM Resource WHERE Resource_Name = 'Test Item';
ROLLBACK;

-- Q8 Stored procedure (allocates 500 units of resource 1 to request 1)
-- CALL sp_allocate_resource(1, 1, 500);

-- Q9 Trigger / constraint test: this fails with 'Insufficient stock' or 'exceeds remaining'
-- CALL sp_allocate_resource(1, 1, 999999);
