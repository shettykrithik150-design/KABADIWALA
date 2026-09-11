const fs = require("fs");
const path = require("path");
const db = require("../config/db");

// ==========================================
// COORDINATE VALIDATION HELPER
// ==========================================

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
// ADD SCRAP (Accepts category, location, image, or JSON)
// ==========================================

const addScrap = (req, res) => {

    const {
        name,
        category,
        description,
        price_per_kg,
        quantity_kg,
        address,
        pincode,
        latitude,
        longitude
    } = req.body;

    // Check required fields
    if (!name || !price_per_kg || !quantity_kg) {
        // If an image was uploaded, remove it since validation failed
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        return res.status(400).json({
            message: "Name, price and quantity are required"
        });
    }

    // Validate latitude and longitude
    const coordCheck = validateCoordinates(latitude, longitude);
    if (!coordCheck.valid) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        return res.status(400).json({
            message: coordCheck.message
        });
    }

    // Get collector ID from JWT
    const collector_id = req.user.id;

    // Relative image path/URL for client access
    const image_url = req.file ? `/uploads/scrap/${req.file.filename}` : null;
    const cleanCategory = category !== undefined && category !== null && String(category).trim() !== "" ? String(category).trim() : null;
    const cleanAddress = address !== undefined && address !== null && String(address).trim() !== "" ? String(address).trim() : null;
    const cleanPincode = pincode !== undefined && pincode !== null && String(pincode).trim() !== "" ? String(pincode).trim() : null;

    const sql = `
        INSERT INTO scrap
        (name, category, description, image_url, price_per_kg, quantity_kg, address, pincode, latitude, longitude, collector_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            cleanCategory,
            description || null,
            image_url,
            price_per_kg,
            quantity_kg,
            cleanAddress,
            cleanPincode,
            coordCheck.lat,
            coordCheck.lng,
            collector_id
        ],
        (err, result) => {

            if (err) {
                // If database query fails, clean up the uploaded file
                if (req.file) {
                    fs.unlink(req.file.path, () => {});
                }
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.status(201).json({
                message: "Scrap added successfully",
                scrapId: result.insertId,
                category: cleanCategory,
                imageUrl: image_url,
                address: cleanAddress,
                pincode: cleanPincode,
                latitude: coordCheck.lat,
                longitude: coordCheck.lng
            });
        }
    );
};


// ==========================================
// GET ALL AVAILABLE SCRAP (Search, Filter, Pagination)
// ==========================================

const getScrap = (req, res) => {

    const {
        search,
        category,
        pincode,
        location,
        address,
        minPrice,
        maxPrice,
        minQuantity
    } = req.query;

    // Pagination defaults
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    // Dynamic filtering with parameterized queries
    const whereConditions = ["scrap.status = 'available'"];
    const queryParams = [];

    // 1. Search by name or description
    if (search && search.trim() !== "") {
        whereConditions.push("(scrap.name LIKE ? OR scrap.description LIKE ?)");
        const searchPattern = `%${search.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
    }

    // 2. Filter by category
    if (category && category.trim() !== "") {
        whereConditions.push("scrap.category = ?");
        queryParams.push(category.trim());
    }

    // 3. Filter by pincode
    if (pincode && pincode.trim() !== "") {
        whereConditions.push("scrap.pincode = ?");
        queryParams.push(pincode.trim());
    }

    // 4. Filter by location / address keyword
    const locFilter = location || address;
    if (locFilter && locFilter.trim() !== "") {
        whereConditions.push("scrap.address LIKE ?");
        queryParams.push(`%${locFilter.trim()}%`);
    }

    // 5. Filter by minimum price per kg
    if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice))) {
        whereConditions.push("scrap.price_per_kg >= ?");
        queryParams.push(Number(minPrice));
    }

    // 6. Filter by maximum price per kg
    if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice))) {
        whereConditions.push("scrap.price_per_kg <= ?");
        queryParams.push(Number(maxPrice));
    }

    // 7. Filter by minimum quantity
    if (minQuantity !== undefined && minQuantity !== "" && !isNaN(Number(minQuantity))) {
        whereConditions.push("scrap.quantity_kg >= ?");
        queryParams.push(Number(minQuantity));
    }

    const whereClause = "WHERE " + whereConditions.join(" AND ");

    // Query 1: Get total count of matching records
    const countSql = `
        SELECT COUNT(*) AS total
        FROM scrap
        JOIN users ON scrap.collector_id = users.id
        ${whereClause}
    `;

    db.query(countSql, queryParams, (countErr, countResults) => {

        if (countErr) {
            console.error(countErr);
            return res.status(500).json({
                message: "Database error"
            });
        }

        const total = countResults[0].total;
        const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

        // Query 2: Fetch paginated results
        const dataSql = `
            SELECT
                scrap.id,
                scrap.name,
                scrap.category,
                scrap.description,
                scrap.image_url,
                scrap.price_per_kg,
                scrap.quantity_kg,
                scrap.address,
                scrap.pincode,
                scrap.latitude,
                scrap.longitude,
                scrap.status,
                scrap.created_at,
                users.name AS collector_name,
                users.phone AS collector_phone
            FROM scrap
            JOIN users
                ON scrap.collector_id = users.id
            ${whereClause}
            ORDER BY scrap.created_at DESC
            LIMIT ? OFFSET ?
        `;

        db.query(dataSql, [...queryParams, limit, offset], (dataErr, results) => {

            if (dataErr) {
                console.error(dataErr);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json({
                message: "Available scrap fetched successfully",
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                },
                scrap: results
            });
        });
    });
};


// ==========================================
// UPDATE SCRAP
// ==========================================

const updateScrap = (req, res) => {

    const { id } = req.params;

    const {
        name,
        category,
        description,
        price_per_kg,
        quantity_kg,
        address,
        pincode,
        latitude,
        longitude
    } = req.body;

    // Validate latitude and longitude
    const coordCheck = validateCoordinates(latitude, longitude);
    if (!coordCheck.valid) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        return res.status(400).json({
            message: coordCheck.message
        });
    }

    // Get collector ID from JWT
    const collector_id = req.user.id;
    const cleanCategory = category !== undefined && category !== null && String(category).trim() !== "" ? String(category).trim() : null;
    const cleanAddress = address !== undefined && address !== null && String(address).trim() !== "" ? String(address).trim() : null;
    const cleanPincode = pincode !== undefined && pincode !== null && String(pincode).trim() !== "" ? String(pincode).trim() : null;
    const newImageUrl = req.file ? `/uploads/scrap/${req.file.filename}` : null;

    let sql;
    let params;

    if (newImageUrl) {
        sql = `
            UPDATE scrap
            SET
                name = ?,
                category = ?,
                description = ?,
                image_url = ?,
                price_per_kg = ?,
                quantity_kg = ?,
                address = ?,
                pincode = ?,
                latitude = ?,
                longitude = ?
            WHERE id = ?
            AND collector_id = ?
        `;
        params = [
            name,
            cleanCategory,
            description || null,
            newImageUrl,
            price_per_kg,
            quantity_kg,
            cleanAddress,
            cleanPincode,
            coordCheck.lat,
            coordCheck.lng,
            id,
            collector_id
        ];
    } else {
        sql = `
            UPDATE scrap
            SET
                name = ?,
                category = ?,
                description = ?,
                price_per_kg = ?,
                quantity_kg = ?,
                address = ?,
                pincode = ?,
                latitude = ?,
                longitude = ?
            WHERE id = ?
            AND collector_id = ?
        `;
        params = [
            name,
            cleanCategory,
            description || null,
            price_per_kg,
            quantity_kg,
            cleanAddress,
            cleanPincode,
            coordCheck.lat,
            coordCheck.lng,
            id,
            collector_id
        ];
    }

    db.query(
        sql,
        params,
        (err, result) => {

            if (err) {
                if (req.file) {
                    fs.unlink(req.file.path, () => {});
                }
                console.error(err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.affectedRows === 0) {
                if (req.file) {
                    fs.unlink(req.file.path, () => {});
                }
                return res.status(404).json({
                    message: "Scrap not found or you are not the owner"
                });
            }

            res.json({
                message: "Scrap updated successfully",
                ...(newImageUrl && { imageUrl: newImageUrl }),
                category: cleanCategory,
                address: cleanAddress,
                pincode: cleanPincode,
                latitude: coordCheck.lat,
                longitude: coordCheck.lng
            });
        }
    );
};


// ==========================================
// DELETE SCRAP
// ==========================================

const deleteScrap = (req, res) => {

    const { id } = req.params;

    // Get collector ID from JWT
    const collector_id = req.user.id;

    // Query for existing image_url first so we can remove file on disk
    const findSql = "SELECT image_url FROM scrap WHERE id = ? AND collector_id = ?";
    db.query(findSql, [id, collector_id], (findErr, rows) => {

        if (findErr) {
            console.error(findErr);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Scrap not found or you are not the owner"
            });
        }

        const existingImageUrl = rows[0].image_url;

        const deleteSql = `
            DELETE FROM scrap
            WHERE id = ?
            AND collector_id = ?
        `;

        db.query(
            deleteSql,
            [id, collector_id],
            (err, result) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                // Delete image file from uploads folder if it exists
                if (existingImageUrl) {
                    const filePath = path.join(__dirname, "..", existingImageUrl);
                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr && unlinkErr.code !== "ENOENT") {
                            console.error("Failed to delete scrap image:", unlinkErr);
                        }
                        res.json({
                            message: "Scrap deleted successfully"
                        });
                    });
                } else {
                    res.json({
                        message: "Scrap deleted successfully"
                    });
                }
            }
        );
    });
};


// ==========================================
// EXPORT FUNCTIONS
// ==========================================

module.exports = {
    addScrap,
    getScrap,
    updateScrap,
    deleteScrap
};