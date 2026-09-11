const db = require("../config/db");

const VALID_STATUSES = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];

// ==========================================
// 1. CREATE TRANSACTION
// ==========================================
const createTransaction = (req, res) => {
    const {
        pickup_id,
        request_id,
        scrap_id,
        amount,
        payment_method,
        notes,
        status,
        recycler_id
    } = req.body || {};

    const currentUserId = req.user.id;
    const currentUserRole = req.user.role ? req.user.role.toLowerCase() : "";

    // Validate provided amount if present
    let parsedAmount = null;
    if (amount !== undefined && amount !== null && amount !== "") {
        parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be a positive number greater than 0"
            });
        }
        parsedAmount = Number(parsedAmount.toFixed(2));
    }

    // Validate status if provided
    let finalStatus = "PENDING";
    if (status !== undefined) {
        const upper = String(status).toUpperCase();
        if (!VALID_STATUSES.includes(upper)) {
            return res.status(400).json({
                message: `Status must be one of: ${VALID_STATUSES.join(", ")}`
            });
        }
        finalStatus = upper;
    }

    const finalPaymentMethod = payment_method ? String(payment_method).toUpperCase().trim() : "CASH";

    // Validate that at least one linking ID is provided
    if (!pickup_id && !request_id && !scrap_id) {
        return res.status(400).json({
            message: "At least one of pickup_id, request_id, or scrap_id must be provided to create a transaction"
        });
    }

    // Helper to insert and respond
    const executeInsert = (data) => {
        const insertSql = `
            INSERT INTO transactions
            (scrap_id, request_id, pickup_id, collector_id, recycler_id, amount, payment_method, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [
                data.scrap_id,
                data.request_id || null,
                data.pickup_id || null,
                data.collector_id,
                data.recycler_id,
                data.amount,
                finalPaymentMethod,
                finalStatus,
                notes ? String(notes).trim() : null
            ],
            (insertErr, result) => {
                if (insertErr) {
                    console.error("Error inserting transaction:", insertErr);
                    return res.status(500).json({ message: "Database error creating transaction" });
                }

                res.status(201).json({
                    message: "Transaction created successfully",
                    transactionId: result.insertId,
                    transaction: {
                        id: result.insertId,
                        scrap_id: data.scrap_id,
                        request_id: data.request_id || null,
                        pickup_id: data.pickup_id || null,
                        collector_id: data.collector_id,
                        recycler_id: data.recycler_id,
                        amount: data.amount,
                        payment_method: finalPaymentMethod,
                        status: finalStatus,
                        notes: notes ? String(notes).trim() : null
                    }
                });
            }
        );
    };

    // PATH A: Connect via pickup_id
    if (pickup_id) {
        const pId = Number(pickup_id);
        if (!pId || !Number.isInteger(pId) || pId <= 0) {
            return res.status(400).json({ message: "Invalid pickup_id: must be a positive integer" });
        }

        const sql = `
            SELECT
                pickups.id AS pickup_id,
                pickups.scrap_id,
                pickups.request_id,
                pickups.collector_id,
                pickups.recycler_id,
                scrap.price_per_kg,
                scrap.quantity_kg,
                scrap_requests.quantity_requested
            FROM pickups
            JOIN scrap ON pickups.scrap_id = scrap.id
            LEFT JOIN scrap_requests ON pickups.request_id = scrap_requests.id
            WHERE pickups.id = ?
        `;

        db.query(sql, [pId], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error fetching pickup" });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: "Pickup not found" });
            }

            const p = rows[0];

            // Access check: current user must be collector or recycler
            if (p.collector_id !== currentUserId && p.recycler_id !== currentUserId) {
                return res.status(403).json({
                    message: "Access forbidden: You are not a participant in this pickup"
                });
            }

            // Calculate amount if not provided
            let finalAmt = parsedAmount;
            if (finalAmt === null) {
                const qty = p.quantity_requested || p.quantity_kg || 1;
                finalAmt = Number((qty * p.price_per_kg).toFixed(2));
            }

            executeInsert({
                scrap_id: p.scrap_id,
                request_id: p.request_id,
                pickup_id: p.pickup_id,
                collector_id: p.collector_id,
                recycler_id: p.recycler_id,
                amount: finalAmt
            });
        });
        return;
    }

    // PATH B: Connect via request_id
    if (request_id) {
        const rId = Number(request_id);
        if (!rId || !Number.isInteger(rId) || rId <= 0) {
            return res.status(400).json({ message: "Invalid request_id: must be a positive integer" });
        }

        const sql = `
            SELECT
                scrap_requests.id AS request_id,
                scrap_requests.scrap_id,
                scrap_requests.recycler_id,
                scrap_requests.quantity_requested,
                scrap.collector_id,
                scrap.price_per_kg
            FROM scrap_requests
            JOIN scrap ON scrap_requests.scrap_id = scrap.id
            WHERE scrap_requests.id = ?
        `;

        db.query(sql, [rId], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error fetching request" });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: "Scrap request not found" });
            }

            const r = rows[0];

            // Access check
            if (r.collector_id !== currentUserId && r.recycler_id !== currentUserId) {
                return res.status(403).json({
                    message: "Access forbidden: You are not a participant in this scrap request"
                });
            }

            let finalAmt = parsedAmount;
            if (finalAmt === null) {
                finalAmt = Number((r.quantity_requested * r.price_per_kg).toFixed(2));
            }

            executeInsert({
                scrap_id: r.scrap_id,
                request_id: r.request_id,
                pickup_id: null,
                collector_id: r.collector_id,
                recycler_id: r.recycler_id,
                amount: finalAmt
            });
        });
        return;
    }

    // PATH C: Connect via scrap_id
    if (scrap_id) {
        const sId = Number(scrap_id);
        if (!sId || !Number.isInteger(sId) || sId <= 0) {
            return res.status(400).json({ message: "Invalid scrap_id: must be a positive integer" });
        }

        const sql = "SELECT id, collector_id, price_per_kg, quantity_kg FROM scrap WHERE id = ?";

        db.query(sql, [sId], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error fetching scrap" });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: "Scrap not found" });
            }

            const scrap = rows[0];

            let finalCollectorId;
            let finalRecyclerId;

            if (currentUserRole === "collector") {
                finalCollectorId = currentUserId;
                finalRecyclerId = recycler_id ? Number(recycler_id) : null;
                if (!finalRecyclerId || !Number.isInteger(finalRecyclerId) || finalRecyclerId <= 0) {
                    return res.status(400).json({
                        message: "recycler_id is required and must be a positive integer when a collector creates a transaction directly"
                    });
                }
            } else {
                // Logged-in user is recycler
                finalRecyclerId = currentUserId;
                finalCollectorId = scrap.collector_id;
            }

            let finalAmt = parsedAmount;
            if (finalAmt === null) {
                finalAmt = Number((scrap.quantity_kg * scrap.price_per_kg).toFixed(2));
            }

            executeInsert({
                scrap_id: scrap.id,
                request_id: null,
                pickup_id: null,
                collector_id: finalCollectorId,
                recycler_id: finalRecyclerId,
                amount: finalAmt
            });
        });
    }
};

// ==========================================
// 2. VIEW MY TRANSACTIONS
// ==========================================
const getMyTransactions = (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    const conditions = ["(transactions.collector_id = ? OR transactions.recycler_id = ?)"];
    const params = [userId, userId];

    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
        conditions.push("transactions.status = ?");
        params.push(status.toUpperCase());
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const sql = `
        SELECT
            transactions.id,
            transactions.scrap_id,
            transactions.request_id,
            transactions.pickup_id,
            transactions.collector_id,
            transactions.recycler_id,
            transactions.amount,
            transactions.payment_method,
            transactions.status,
            transactions.notes,
            transactions.transaction_date,
            transactions.created_at,
            transactions.updated_at,
            scrap.name AS scrap_name,
            scrap.category AS scrap_category,
            scrap.image_url AS scrap_image_url,
            scrap.price_per_kg,
            pickups.status AS pickup_status,
            pickups.pickup_address,
            collector.name AS collector_name,
            collector.email AS collector_email,
            collector.phone AS collector_phone,
            recycler.name AS recycler_name,
            recycler.email AS recycler_email,
            recycler.phone AS recycler_phone
        FROM transactions
        JOIN scrap ON transactions.scrap_id = scrap.id
        LEFT JOIN pickups ON transactions.pickup_id = pickups.id
        JOIN users collector ON transactions.collector_id = collector.id
        JOIN users recycler ON transactions.recycler_id = recycler.id
        ${whereClause}
        ORDER BY transactions.created_at DESC
    `;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching transactions:", err);
            return res.status(500).json({ message: "Database error fetching transactions" });
        }

        res.json({
            message: "Transactions fetched successfully",
            count: results.length,
            transactions: results
        });
    });
};

// ==========================================
// 3. VIEW TRANSACTION BY ID
// ==========================================
const getTransactionById = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const transactionId = Number(id);
    if (!transactionId || !Number.isInteger(transactionId) || transactionId <= 0) {
        return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const sql = `
        SELECT
            transactions.id,
            transactions.scrap_id,
            transactions.request_id,
            transactions.pickup_id,
            transactions.collector_id,
            transactions.recycler_id,
            transactions.amount,
            transactions.payment_method,
            transactions.status,
            transactions.notes,
            transactions.transaction_date,
            transactions.created_at,
            transactions.updated_at,
            scrap.name AS scrap_name,
            scrap.category AS scrap_category,
            scrap.image_url AS scrap_image_url,
            scrap.price_per_kg,
            pickups.status AS pickup_status,
            pickups.pickup_address,
            collector.name AS collector_name,
            collector.email AS collector_email,
            collector.phone AS collector_phone,
            recycler.name AS recycler_name,
            recycler.email AS recycler_email,
            recycler.phone AS recycler_phone
        FROM transactions
        JOIN scrap ON transactions.scrap_id = scrap.id
        LEFT JOIN pickups ON transactions.pickup_id = pickups.id
        JOIN users collector ON transactions.collector_id = collector.id
        JOIN users recycler ON transactions.recycler_id = recycler.id
        WHERE transactions.id = ?
    `;

    db.query(sql, [transactionId], (err, results) => {
        if (err) {
            console.error("Error fetching transaction:", err);
            return res.status(500).json({ message: "Database error fetching transaction" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const transaction = results[0];

        // Access check
        if (transaction.collector_id !== userId && transaction.recycler_id !== userId) {
            return res.status(403).json({
                message: "Access forbidden: You are not authorized to view this transaction"
            });
        }

        res.json({
            message: "Transaction details fetched successfully",
            transaction
        });
    });
};

// ==========================================
// 4. UPDATE TRANSACTION STATUS
// ==========================================
const updateTransactionStatus = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const transactionId = Number(id);
    if (!transactionId || !Number.isInteger(transactionId) || transactionId <= 0) {
        return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const { status, notes } = req.body || {};

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    const targetStatus = String(status).toUpperCase();
    if (!VALID_STATUSES.includes(targetStatus)) {
        return res.status(400).json({
            message: `Status must be one of: ${VALID_STATUSES.join(", ")}`
        });
    }

    db.query("SELECT * FROM transactions WHERE id = ?", [transactionId], (findErr, rows) => {
        if (findErr) {
            console.error("Error finding transaction:", findErr);
            return res.status(500).json({ message: "Database error" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const current = rows[0];

        // Access check
        if (current.collector_id !== userId && current.recycler_id !== userId) {
            return res.status(403).json({
                message: "Access forbidden: You are not authorized to update this transaction"
            });
        }

        // Closed transactions cannot transition
        if (current.status === "COMPLETED") {
            return res.status(400).json({
                message: "Completed transactions cannot be modified"
            });
        }

        if (current.status === "CANCELLED") {
            return res.status(400).json({
                message: "Cancelled transactions cannot be modified"
            });
        }

        if (current.status === targetStatus) {
            return res.status(400).json({
                message: `Transaction is already ${targetStatus}`
            });
        }

        const finalNotes = notes !== undefined ? (notes ? String(notes).trim() : null) : current.notes;

        const updateSql = `
            UPDATE transactions
            SET status = ?, notes = ?
            WHERE id = ?
        `;

        db.query(updateSql, [targetStatus, finalNotes, transactionId], (updateErr) => {
            if (updateErr) {
                console.error("Error updating transaction status:", updateErr);
                return res.status(500).json({ message: "Database error updating transaction" });
            }

            res.json({
                message: "Transaction status updated successfully",
                transactionId,
                status: targetStatus,
                notes: finalNotes
            });
        });
    });
};

module.exports = {
    createTransaction,
    getMyTransactions,
    getTransactionById,
    updateTransactionStatus
};
