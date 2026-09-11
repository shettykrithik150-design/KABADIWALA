const db = require("../config/db");

// Allowed pickup statuses
const VALID_STATUSES = ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"];

// Coordinate validation helper
const validateCoordinates = (latitude, longitude) => {
    let lat = null;
    let lng = null;

    if (latitude !== undefined && latitude !== null && latitude !== "") {
        lat = Number(latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            return {
                valid: false,
                message: "Latitude must be a valid number between -90 and 90"
            };
        }
    }

    if (longitude !== undefined && longitude !== null && longitude !== "") {
        lng = Number(longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
            return {
                valid: false,
                message: "Longitude must be a valid number between -180 and 180"
            };
        }
    }

    return { valid: true, lat, lng };
};

// ==========================================
// 1. CREATE PICKUP
// ==========================================
const createPickup = (req, res) => {
    const {
        scrap_id,
        request_id,
        recycler_id,
        collector_id,
        pickup_address,
        address,
        pincode,
        latitude,
        longitude,
        scheduled_at,
        scheduled_date,
        notes,
        status
    } = req.body || {};

    const currentUserId = req.user.id;
    const currentUserRole = req.user.role ? req.user.role.toLowerCase() : "";

    // Validate that either request_id or scrap_id is provided
    if (!request_id && !scrap_id) {
        return res.status(400).json({
            message: "Either request_id or scrap_id must be provided to create a pickup"
        });
    }

    if (request_id !== undefined && (!Number.isInteger(Number(request_id)) || Number(request_id) <= 0)) {
        return res.status(400).json({ message: "Invalid request_id: must be a positive integer" });
    }

    if (scrap_id !== undefined && (!Number.isInteger(Number(scrap_id)) || Number(scrap_id) <= 0)) {
        return res.status(400).json({ message: "Invalid scrap_id: must be a positive integer" });
    }

    // Path A: Created via request_id (reuses request & scrap details)
    if (request_id) {
        const reqSql = `
            SELECT
                scrap_requests.id AS request_id,
                scrap_requests.scrap_id,
                scrap_requests.recycler_id,
                scrap_requests.status AS request_status,
                scrap.collector_id,
                scrap.address AS scrap_address,
                scrap.pincode AS scrap_pincode,
                scrap.latitude AS scrap_latitude,
                scrap.longitude AS scrap_longitude
            FROM scrap_requests
            JOIN scrap ON scrap_requests.scrap_id = scrap.id
            WHERE scrap_requests.id = ?
        `;

        db.query(reqSql, [request_id], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Scrap request not found" });
            }

            const reqData = results[0];

            // Verify user belongs to this transaction
            if (currentUserId !== reqData.recycler_id && currentUserId !== reqData.collector_id) {
                return res.status(403).json({
                    message: "Access forbidden: You are not a participant in this scrap request"
                });
            }

            // Reuse location data from scrap if not explicitly overridden
            const finalAddress = pickup_address || address || reqData.scrap_address;
            const finalPincode = pincode || reqData.scrap_pincode;
            const inputLat = latitude !== undefined && latitude !== null ? latitude : reqData.scrap_latitude;
            const inputLng = longitude !== undefined && longitude !== null ? longitude : reqData.scrap_longitude;

            const coordCheck = validateCoordinates(inputLat, inputLng);
            if (!coordCheck.valid) {
                return res.status(400).json({ message: coordCheck.message });
            }

            // Parse scheduled date/time
            const scheduleInput = scheduled_at || scheduled_date || null;
            let formattedSchedule = null;
            if (scheduleInput) {
                const dateObj = new Date(scheduleInput);
                if (isNaN(dateObj.getTime())) {
                    return res.status(400).json({ message: "Invalid scheduled date/time format" });
                }
                formattedSchedule = dateObj.toISOString().slice(0, 19).replace("T", " ");
            }

            // Status determination
            let finalStatus = "PENDING";
            if (status && VALID_STATUSES.includes(status.toUpperCase())) {
                finalStatus = status.toUpperCase();
            } else if (formattedSchedule) {
                finalStatus = "SCHEDULED";
            }

            const insertSql = `
                INSERT INTO pickups
                (scrap_id, request_id, collector_id, recycler_id, pickup_address, pincode, latitude, longitude, scheduled_at, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    reqData.scrap_id,
                    reqData.request_id,
                    reqData.collector_id,
                    reqData.recycler_id,
                    finalAddress ? String(finalAddress).trim() : null,
                    finalPincode ? String(finalPincode).trim() : null,
                    coordCheck.lat,
                    coordCheck.lng,
                    formattedSchedule,
                    finalStatus,
                    notes ? String(notes).trim() : null
                ],
                (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error(insertErr);
                        return res.status(500).json({ message: "Database error creating pickup" });
                    }

                    res.status(201).json({
                        message: "Pickup created successfully",
                        pickupId: insertResult.insertId,
                        status: finalStatus,
                        scheduled_at: formattedSchedule,
                        address: finalAddress,
                        pickup_address: finalAddress,
                        pincode: finalPincode,
                        latitude: coordCheck.lat,
                        longitude: coordCheck.lng
                    });
                }
            );
        });
        return;
    }

    // Path B: Created directly via scrap_id
    const scrapSql = `
        SELECT id, collector_id, address, pincode, latitude, longitude, status
        FROM scrap
        WHERE id = ?
    `;

    db.query(scrapSql, [scrap_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Scrap item not found" });
        }

        const scrap = results[0];
        let finalCollectorId;
        let finalRecyclerId;

        if (currentUserRole === "collector") {
            finalCollectorId = currentUserId;
            finalRecyclerId = recycler_id ? Number(recycler_id) : null;
            if (!finalRecyclerId) {
                return res.status(400).json({
                    message: "recycler_id is required when a collector creates a pickup directly"
                });
            }
        } else {
            // Default: logged-in user is recycler
            finalRecyclerId = currentUserId;
            finalCollectorId = scrap.collector_id;
        }

        // Reuse location data from scrap if not provided
        const finalAddress = pickup_address || address || scrap.address;
        const finalPincode = pincode || scrap.pincode;
        const inputLat = latitude !== undefined && latitude !== null ? latitude : scrap.latitude;
        const inputLng = longitude !== undefined && longitude !== null ? longitude : scrap.longitude;

        const coordCheck = validateCoordinates(inputLat, inputLng);
        if (!coordCheck.valid) {
            return res.status(400).json({ message: coordCheck.message });
        }

        const scheduleInput = scheduled_at || scheduled_date || null;
        let formattedSchedule = null;
        if (scheduleInput) {
            const dateObj = new Date(scheduleInput);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({ message: "Invalid scheduled date/time format" });
            }
            formattedSchedule = dateObj.toISOString().slice(0, 19).replace("T", " ");
        }

        let finalStatus = "PENDING";
        if (status && VALID_STATUSES.includes(status.toUpperCase())) {
            finalStatus = status.toUpperCase();
        } else if (formattedSchedule) {
            finalStatus = "SCHEDULED";
        }

        const insertSql = `
            INSERT INTO pickups
            (scrap_id, request_id, collector_id, recycler_id, pickup_address, pincode, latitude, longitude, scheduled_at, status, notes)
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [
                scrap.id,
                finalCollectorId,
                finalRecyclerId,
                finalAddress ? String(finalAddress).trim() : null,
                finalPincode ? String(finalPincode).trim() : null,
                coordCheck.lat,
                coordCheck.lng,
                formattedSchedule,
                finalStatus,
                notes ? String(notes).trim() : null
            ],
            (insertErr, insertResult) => {
                if (insertErr) {
                    console.error(insertErr);
                    return res.status(500).json({ message: "Database error creating pickup" });
                }

                res.status(201).json({
                    message: "Pickup created successfully",
                    pickupId: insertResult.insertId,
                    status: finalStatus,
                    scheduled_at: formattedSchedule,
                    address: finalAddress,
                    pickup_address: finalAddress,
                    pincode: finalPincode,
                    latitude: coordCheck.lat,
                    longitude: coordCheck.lng
                });
            }
        );
    });
};

// ==========================================
// 2. VIEW MY PICKUPS (Collector or Recycler)
// ==========================================
const getMyPickups = (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    const conditions = ["(pickups.collector_id = ? OR pickups.recycler_id = ?)"];
    const params = [userId, userId];

    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
        conditions.push("pickups.status = ?");
        params.push(status.toUpperCase());
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const sql = `
        SELECT
            pickups.id,
            pickups.scrap_id,
            pickups.request_id,
            pickups.collector_id,
            pickups.recycler_id,
            pickups.pickup_address,
            pickups.pickup_address AS address,
            pickups.pincode,
            pickups.latitude,
            pickups.longitude,
            pickups.scheduled_at,
            pickups.status,
            pickups.notes,
            pickups.completed_at,
            pickups.created_at,
            pickups.updated_at,
            scrap.name AS scrap_name,
            scrap.category AS scrap_category,
            scrap.image_url AS scrap_image_url,
            scrap.price_per_kg,
            collector.name AS collector_name,
            collector.phone AS collector_phone,
            collector.email AS collector_email,
            recycler.name AS recycler_name,
            recycler.phone AS recycler_phone,
            recycler.email AS recycler_email
        FROM pickups
        JOIN scrap ON pickups.scrap_id = scrap.id
        JOIN users collector ON pickups.collector_id = collector.id
        JOIN users recycler ON pickups.recycler_id = recycler.id
        ${whereClause}
        ORDER BY pickups.created_at DESC
    `;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }

        res.json({
            message: "Pickups fetched successfully",
            count: results.length,
            pickups: results
        });
    });
};

// ==========================================
// 3. VIEW PICKUP BY ID
// ==========================================
const getPickupById = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const pickupId = Number(id);
    if (!pickupId || !Number.isInteger(pickupId) || pickupId <= 0) {
        return res.status(400).json({ message: "Invalid pickup ID" });
    }

    const sql = `
        SELECT
            pickups.id,
            pickups.scrap_id,
            pickups.request_id,
            pickups.collector_id,
            pickups.recycler_id,
            pickups.pickup_address,
            pickups.pickup_address AS address,
            pickups.pincode,
            pickups.latitude,
            pickups.longitude,
            pickups.scheduled_at,
            pickups.status,
            pickups.notes,
            pickups.completed_at,
            pickups.created_at,
            pickups.updated_at,
            scrap.name AS scrap_name,
            scrap.category AS scrap_category,
            scrap.image_url AS scrap_image_url,
            scrap.price_per_kg,
            collector.name AS collector_name,
            collector.phone AS collector_phone,
            collector.email AS collector_email,
            recycler.name AS recycler_name,
            recycler.phone AS recycler_phone,
            recycler.email AS recycler_email
        FROM pickups
        JOIN scrap ON pickups.scrap_id = scrap.id
        JOIN users collector ON pickups.collector_id = collector.id
        JOIN users recycler ON pickups.recycler_id = recycler.id
        WHERE pickups.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Pickup not found" });
        }

        const pickup = results[0];

        // Access check: only collector or recycler can view
        if (pickup.collector_id !== userId && pickup.recycler_id !== userId) {
            return res.status(403).json({
                message: "Access forbidden: You are not authorized to view this pickup"
            });
        }

        res.json({
            message: "Pickup details fetched successfully",
            pickup
        });
    });
};

// ==========================================
// 4. UPDATE PICKUP
// ==========================================
const updatePickup = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const pickupId = Number(id);
    if (!pickupId || !Number.isInteger(pickupId) || pickupId <= 0) {
        return res.status(400).json({ message: "Invalid pickup ID" });
    }

    const {
        pickup_address,
        address,
        pincode,
        latitude,
        longitude,
        scheduled_at,
        scheduled_date,
        notes,
        status
    } = req.body || {};

    // Check existing pickup
    db.query("SELECT * FROM pickups WHERE id = ?", [id], (findErr, rows) => {
        if (findErr) {
            console.error(findErr);
            return res.status(500).json({ message: "Database error" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pickup not found" });
        }

        const current = rows[0];

        // Verify authorization
        if (current.collector_id !== userId && current.recycler_id !== userId) {
            return res.status(403).json({
                message: "Access forbidden: You are not authorized to update this pickup"
            });
        }

        // Closed pickups cannot be altered
        if (current.status === "COMPLETED") {
            return res.status(400).json({
                message: "Completed pickups cannot be modified"
            });
        }
        if (current.status === "CANCELLED") {
            return res.status(400).json({
                message: "Cancelled pickups cannot be modified"
            });
        }

        // Validate coordinates if provided
        const finalLatInput = latitude !== undefined ? latitude : current.latitude;
        const finalLngInput = longitude !== undefined ? longitude : current.longitude;
        const coordCheck = validateCoordinates(finalLatInput, finalLngInput);
        if (!coordCheck.valid) {
            return res.status(400).json({ message: coordCheck.message });
        }

        // Validate scheduled date if provided
        let formattedSchedule = current.scheduled_at;
        const schedInput = scheduled_at !== undefined ? scheduled_at : scheduled_date;
        if (schedInput !== undefined) {
            if (schedInput === null || schedInput === "") {
                formattedSchedule = null;
            } else {
                const d = new Date(schedInput);
                if (isNaN(d.getTime())) {
                    return res.status(400).json({ message: "Invalid scheduled date/time format" });
                }
                formattedSchedule = d.toISOString().slice(0, 19).replace("T", " ");
            }
        }

        // Validate status if provided
        let newStatus = current.status;
        if (status !== undefined) {
            const upperStatus = String(status).toUpperCase();
            if (!VALID_STATUSES.includes(upperStatus)) {
                return res.status(400).json({
                    message: `Status must be one of: ${VALID_STATUSES.join(", ")}`
                });
            }
            newStatus = upperStatus;
        }

        const finalAddress = pickup_address !== undefined ? pickup_address : (address !== undefined ? address : current.pickup_address);
        const finalPincode = pincode !== undefined ? pincode : current.pincode;
        const finalNotes = notes !== undefined ? notes : current.notes;

        const updateSql = `
            UPDATE pickups
            SET
                pickup_address = ?,
                pincode = ?,
                latitude = ?,
                longitude = ?,
                scheduled_at = ?,
                status = ?,
                notes = ?
            WHERE id = ?
        `;

        db.query(
            updateSql,
            [
                finalAddress ? String(finalAddress).trim() : null,
                finalPincode ? String(finalPincode).trim() : null,
                coordCheck.lat,
                coordCheck.lng,
                formattedSchedule,
                newStatus,
                finalNotes ? String(finalNotes).trim() : null,
                id
            ],
            (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ message: "Database error" });
                }

                res.json({
                    message: "Pickup updated successfully",
                    pickup: {
                        id: Number(id),
                        address: finalAddress,
                        pickup_address: finalAddress,
                        pincode: finalPincode,
                        latitude: coordCheck.lat,
                        longitude: coordCheck.lng,
                        scheduled_at: formattedSchedule,
                        status: newStatus,
                        notes: finalNotes
                    }
                });
            }
        );
    });
};

// ==========================================
// 5. COMPLETE PICKUP
// ==========================================
const completePickup = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const pickupId = Number(id);
    if (!pickupId || !Number.isInteger(pickupId) || pickupId <= 0) {
        return res.status(400).json({ message: "Invalid pickup ID" });
    }

    db.query("SELECT * FROM pickups WHERE id = ?", [id], (findErr, rows) => {
        if (findErr) {
            console.error(findErr);
            return res.status(500).json({ message: "Database error" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pickup not found" });
        }

        const pickup = rows[0];

        // Access check
        if (pickup.collector_id !== userId && pickup.recycler_id !== userId) {
            return res.status(403).json({
                message: "Access forbidden: You are not authorized to complete this pickup"
            });
        }

        if (pickup.status === "COMPLETED") {
            return res.status(400).json({ message: "Pickup is already completed" });
        }

        if (pickup.status === "CANCELLED") {
            return res.status(400).json({ message: "Cannot complete a cancelled pickup" });
        }

        const sql = `
            UPDATE pickups
            SET status = 'COMPLETED', completed_at = NOW()
            WHERE id = ?
        `;

        db.query(sql, [id], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            res.json({
                message: "Pickup marked as COMPLETED successfully",
                pickupId: Number(id),
                status: "COMPLETED"
            });
        });
    });
};

// ==========================================
// 6. CANCEL PICKUP
// ==========================================
const cancelPickup = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const pickupId = Number(id);
    if (!pickupId || !Number.isInteger(pickupId) || pickupId <= 0) {
        return res.status(400).json({ message: "Invalid pickup ID" });
    }

    const { reason, notes } = req.body || {};

    db.query("SELECT * FROM pickups WHERE id = ?", [id], (findErr, rows) => {
        if (findErr) {
            console.error(findErr);
            return res.status(500).json({ message: "Database error" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pickup not found" });
        }

        const pickup = rows[0];

        // Access check
        if (pickup.collector_id !== userId && pickup.recycler_id !== userId) {
            return res.status(403).json({
                message: "Access forbidden: You are not authorized to cancel this pickup"
            });
        }

        if (pickup.status === "COMPLETED") {
            return res.status(400).json({ message: "Cannot cancel an already completed pickup" });
        }

        if (pickup.status === "CANCELLED") {
            return res.status(400).json({ message: "Pickup is already cancelled" });
        }

        const cancelReason = reason || notes || null;
        let updatedNotes = pickup.notes || "";
        if (cancelReason) {
            updatedNotes = updatedNotes ? `${updatedNotes} | Cancellation reason: ${cancelReason}` : `Cancellation reason: ${cancelReason}`;
        }

        const sql = `
            UPDATE pickups
            SET status = 'CANCELLED', notes = ?
            WHERE id = ?
        `;

        db.query(sql, [updatedNotes, id], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            res.json({
                message: "Pickup cancelled successfully",
                pickupId: Number(id),
                status: "CANCELLED",
                notes: updatedNotes
            });
        });
    });
};

module.exports = {
    createPickup,
    getMyPickups,
    getPickupById,
    updatePickup,
    completePickup,
    cancelPickup
};
