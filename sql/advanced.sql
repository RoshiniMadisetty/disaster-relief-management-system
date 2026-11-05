-- =====================================================================
-- File 2 of 2: Advanced features (views, triggers, stored procedure)
-- Run AFTER schema.sql
-- =====================================================================
USE Disaster_Relief_DB;

-- ---------- Views ----------
CREATE OR REPLACE VIEW Pending_High_Priority_Requests AS
SELECT AR.Request_ID, RC.Center_Name, D.Disaster_Name, D.Location AS Disaster_Location,
       AR.Request_Date, AR.Priority, AR.Status
FROM Aid_Request AR
JOIN Relief_Center RC ON AR.Center_ID = RC.Center_ID
JOIN Disaster D ON AR.Disaster_ID = D.Disaster_ID
WHERE AR.Status = 'Pending' AND AR.Priority IN ('High','Critical');

CREATE OR REPLACE VIEW Low_Stock_Resources AS
SELECT Resource_ID, Resource_Name, Category, Available_Quantity, Minimum_Stock
FROM Resource
WHERE Available_Quantity <= Minimum_Stock;

DELIMITER $$

-- ---------- Trigger 1: validate an allocation before it is stored ----------
CREATE TRIGGER trg_allocitem_before_insert
BEFORE INSERT ON Allocation_Item
FOR EACH ROW
BEGIN
    DECLARE v_stock INT;
    DECLARE v_req_id INT;
    DECLARE v_remaining INT;

    SELECT Available_Quantity INTO v_stock FROM Resource WHERE Resource_ID = NEW.Resource_ID;
    IF v_stock IS NULL OR NEW.Allocated_Quantity > v_stock THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for this resource';
    END IF;

    SELECT Request_ID INTO v_req_id FROM Allocation WHERE Allocation_ID = NEW.Allocation_ID;
    SELECT Quantity_Requested - Quantity_Allocated INTO v_remaining
      FROM Request_Item WHERE Request_ID = v_req_id AND Resource_ID = NEW.Resource_ID;

    IF v_remaining IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This resource was not requested in the aid request';
    ELSEIF NEW.Allocated_Quantity > v_remaining THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Allocation exceeds the remaining requested quantity';
    END IF;
END$$

-- ---------- Trigger 2: keep stock, request items and request status consistent ----------
CREATE TRIGGER trg_allocitem_after_insert
AFTER INSERT ON Allocation_Item
FOR EACH ROW
BEGIN
    DECLARE v_req_id INT;
    DECLARE v_open INT;

    SELECT Request_ID INTO v_req_id FROM Allocation WHERE Allocation_ID = NEW.Allocation_ID;

    UPDATE Resource SET Available_Quantity = Available_Quantity - NEW.Allocated_Quantity
     WHERE Resource_ID = NEW.Resource_ID;

    UPDATE Request_Item SET Quantity_Allocated = Quantity_Allocated + NEW.Allocated_Quantity
     WHERE Request_ID = v_req_id AND Resource_ID = NEW.Resource_ID;

    SELECT COUNT(*) INTO v_open FROM Request_Item
     WHERE Request_ID = v_req_id AND Quantity_Allocated < Quantity_Requested;

    UPDATE Aid_Request
       SET Status = IF(v_open = 0, 'Allocated', 'Partially Allocated')
     WHERE Request_ID = v_req_id;
END$$

-- ---------- Trigger 3: cannot distribute more than was allocated ----------
CREATE TRIGGER trg_distitem_before_insert
BEFORE INSERT ON Distribution_Item
FOR EACH ROW
BEGIN
    DECLARE v_alloc_id INT;
    DECLARE v_allocated INT;
    DECLARE v_done INT;

    SELECT Allocation_ID INTO v_alloc_id FROM Distribution WHERE Distribution_ID = NEW.Distribution_ID;
    SELECT Allocated_Quantity INTO v_allocated FROM Allocation_Item
     WHERE Allocation_ID = v_alloc_id AND Resource_ID = NEW.Resource_ID;

    IF v_allocated IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This resource is not part of the selected allocation';
    END IF;

    SELECT COALESCE(SUM(di.Quantity_Distributed), 0) INTO v_done
      FROM Distribution_Item di JOIN Distribution d ON d.Distribution_ID = di.Distribution_ID
     WHERE d.Allocation_ID = v_alloc_id AND di.Resource_ID = NEW.Resource_ID;

    IF v_done + NEW.Quantity_Distributed > v_allocated THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Distribution exceeds the allocated quantity';
    END IF;
END$$

-- ---------- Stored procedure with a transaction ----------
CREATE PROCEDURE sp_allocate_resource(IN p_request_id INT, IN p_resource_id INT, IN p_qty INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    INSERT INTO Allocation (Request_ID, Allocation_Status) VALUES (p_request_id, 'Approved');
    INSERT INTO Allocation_Item (Allocation_ID, Resource_ID, Allocated_Quantity)
    VALUES (LAST_INSERT_ID(), p_resource_id, p_qty);
    COMMIT;
END$$

DELIMITER ;
