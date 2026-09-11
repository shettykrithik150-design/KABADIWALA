const db = require("../config/db");

// ==========================================
// CREATE SCRAP REQUEST
// ==========================================

const createRequest = (req, res) => {

    const { scrap_id, quantity_requested } = req.body;

    const recycler_id = req.user.id;

    // Check required fields
    if (!scrap_id || !quantity_requested) {
        return res.status(400).json({
            message: "Scrap ID and quantity are required"
        });
    }

    // Convert quantity to number
    const requestedQuantity = Number(quantity_requested);

    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
        return res.status(400).json({
            message: "Quantity must be a valid positive number"
        });
    }

    // Check whether scrap exists and is available
    const checkSql = `
        SELECT *
        FROM scrap
        WHERE id = ?
        AND status = 'available'
    `;

    db.query(checkSql, [scrap_id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Scrap not found or not available"
            });
        }

        const scrap = results[0];

        const availableQuantity = Number(scrap.quantity_kg);

        // Check requested quantity
        if (requestedQuantity > availableQuantity) {
            return res.status(400).json({
                message: "Requested quantity is greater than available quantity"
            });
        }

        // Create request
        const sql = `
            INSERT INTO scrap_requests
            (scrap_id, recycler_id, quantity_requested)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                scrap_id,
                recycler_id,
                requestedQuantity
            ],
            (err, result) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                res.status(201).json({
                    message: "Scrap request created successfully",
                    requestId: result.insertId
                });
            }
        );
    });
};


// ==========================================
// GET MY REQUESTS - RECYCLER
// ==========================================

const getMyRequests = (req, res) => {

    const recycler_id = req.user.id;

    const sql = `
        SELECT
            scrap_requests.id,
            scrap_requests.quantity_requested,
            scrap_requests.status,
            scrap_requests.created_at,
            scrap.name AS scrap_name,
            scrap.category AS scrap_category,
            scrap.image_url AS scrap_image_url,
            scrap.price_per_kg,
            scrap.address AS scrap_address,
            scrap.pincode AS scrap_pincode,
            scrap.latitude AS scrap_latitude,
            scrap.longitude AS scrap_longitude,
            users.name AS collector_name,
            users.phone AS collector_phone
        FROM scrap_requests
        JOIN scrap
            ON scrap_requests.scrap_id = scrap.id
        JOIN users
            ON scrap.collector_id = users.id
        WHERE scrap_requests.recycler_id = ?
        ORDER BY scrap_requests.created_at DESC
    `;

    db.query(sql, [recycler_id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json({
            message: "Requests fetched successfully",
            requests: results
        });
    });
};


// ==========================================
// GET REQUESTS FOR COLLECTOR
// ==========================================

const getCollectorRequests = (req, res) => {

    const collector_id = req.user.id;

    const sql = `
        SELECT
            scrap_requests.id,
            scrap_requests.quantity_requested,
            scrap_requests.status,
            scrap_requests.created_at,
            scrap.name AS scrap_name,
            scrap.category AS scrap_category,
            scrap.price_per_kg,
            users.name AS recycler_name,
            users.email AS recycler_email,
            users.phone AS recycler_phone
        FROM scrap_requests
        JOIN scrap
            ON scrap_requests.scrap_id = scrap.id
        JOIN users
            ON scrap_requests.recycler_id = users.id
        WHERE scrap.collector_id = ?
        ORDER BY scrap_requests.created_at DESC
    `;

    db.query(sql, [collector_id], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        res.json({
            message: "Collector requests fetched successfully",
            requests: results
        });
    });
};


// ==========================================
// ACCEPT OR REJECT SCRAP REQUEST
// ==========================================

const updateRequestStatus = (req, res) => {

    const { id } = req.params;
    const { status } = req.body;

    const collector_id = req.user.id;

    // Check valid status
    if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({
            message: "Status must be accepted or rejected"
        });
    }

    // Get request and scrap details
    const checkSql = `
        SELECT
            scrap_requests.id,
            scrap_requests.quantity_requested,
            scrap_requests.status,
            scrap.id AS scrap_id,
            scrap.quantity_kg
        FROM scrap_requests
        JOIN scrap
            ON scrap_requests.scrap_id = scrap.id
        WHERE scrap_requests.id = ?
        AND scrap.collector_id = ?
    `;

    db.query(
        checkSql,
        [id, collector_id],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Request not found or you are not the owner"
                });
            }

            const request = results[0];

            // Request must still be pending
            if (request.status !== "pending") {
                return res.status(400).json({
                    message: "Request has already been processed"
                });
            }


            // ==========================================
            // REJECT REQUEST
            // ==========================================

            if (status === "rejected") {

                const rejectSql = `
                    UPDATE scrap_requests
                    SET status = 'rejected'
                    WHERE id = ?
                `;

                db.query(
                    rejectSql,
                    [id],
                    (err) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                message: "Database error"
                            });
                        }

                        res.json({
                            message: "Request rejected successfully"
                        });
                    }
                );

                return;
            }


            // ==========================================
            // ACCEPT REQUEST
            // ==========================================

            // Convert MySQL DECIMAL values to numbers
            const requestedQuantity =
                Number(request.quantity_requested);

            const availableQuantity =
                Number(request.quantity_kg);

            // Check available quantity
            if (requestedQuantity > availableQuantity) {
                return res.status(400).json({
                    message: "Not enough scrap quantity available"
                });
            }

            // Calculate remaining quantity
            const newQuantity =
                availableQuantity - requestedQuantity;

            // Reduce scrap quantity
            const updateScrapSql = `
                UPDATE scrap
                SET quantity_kg = ?
                WHERE id = ?
            `;

            db.query(
                updateScrapSql,
                [
                    newQuantity,
                    request.scrap_id
                ],
                (err) => {

                    if (err) {
                        console.error(err);

                        return res.status(500).json({
                            message: "Database error"
                        });
                    }

                    // Mark request as accepted
                    const acceptSql = `
                        UPDATE scrap_requests
                        SET status = 'accepted'
                        WHERE id = ?
                    `;

                    db.query(
                        acceptSql,
                        [id],
                        (err) => {

                            if (err) {
                                console.error(err);

                                return res.status(500).json({
                                    message: "Database error"
                                });
                            }

                            res.json({
                                message: "Request accepted successfully",
                                remainingQuantity: newQuantity
                            });
                        }
                    );
                }
            );
        }
    );
};


// ==========================================
// EXPORT FUNCTIONS
// ==========================================

module.exports = {
    createRequest,
    getMyRequests,
    getCollectorRequests,
    updateRequestStatus
};