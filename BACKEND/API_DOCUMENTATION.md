# KABADIWALA Backend API Documentation

Welcome to the complete API reference for the **KABADIWALA** backend platform. This service connects scrap collectors and recyclers with features including JWT authentication, role-based access control (RBAC), scrap listings with photo upload and geolocation, pickup scheduling, transactions, and user profile management.

---

## 1. Overview & Global Standards

### Base URL
- Local Development: `http://localhost:3000` (configurable via `PORT` in `.env`)

### Authentication & Authorization
- **Bearer JWT**: Secured endpoints require the HTTP header:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Role-Based Access Control (RBAC)**:
  - `collector`: Can add/update/delete scrap listings, view incoming requests, accept/reject requests, view & manage associated pickups and transactions, manage profile.
  - `recycler`: Can browse/filter scrap listings, submit scrap requests, view own requests, view & manage associated pickups and transactions, manage profile.

### Security Headers & Rate Limiting
- **Helmet**: All responses automatically include secure HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control: off`, and suppressed `X-Powered-By`).
- **Auth Rate Limiting**: The `/api/auth/*` endpoints are rate-limited to **100 requests per 15 minutes** per IP by default (configurable via `AUTH_RATE_LIMIT_MAX` in `.env`). Exceeding this limit returns `HTTP 429 Too Many Requests`.

### Standard Error Response Format
All error responses adhere to a consistent JSON structure:
```json
{
  "message": "Descriptive error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Standard HTTP Status Codes
| Code | Meaning | Description |
| :---: | :--- | :--- |
| `200` | OK | The request succeeded. |
| `201` | Created | Resource successfully created. |
| `400` | Bad Request | Validation error, malformed JSON, or illegal business logic transition. |
| `401` | Unauthorized | Missing, malformed, or expired JWT token. |
| `403` | Forbidden | Authenticated user lacks the required role or ownership. |
| `404` | Not Found | Target endpoint or database record does not exist. |
| `409` | Conflict | Duplicate entry (e.g. email already registered). |
| `429` | Too Many Requests | Rate limit exceeded on authentication endpoints. |
| `500` | Internal Server Error | Unexpected server failure (internal details sanitized). |
| `503` | Service Unavailable | Database connection loss or pool exhaustion. |

---

## 2. System & Static Endpoints

### 2.1 Health Check
Returns the current operational status of the backend API.

- **Method**: `GET`
- **URL**: `/`
- **Authentication**: None (Public)
- **Required Role**: None
- **Request Parameters**: None

#### Example Request
```bash
curl -X GET http://localhost:3000/
```

#### Success Response (`200 OK`)
```json
{
  "message": "Kabadiwala Backend is Running!"
}
```

---

### 2.2 Get Uploaded Scrap Photo
Serves static image assets uploaded for scrap listings.

- **Method**: `GET`
- **URL**: `/uploads/scrap/:filename`
- **Authentication**: None (Public)
- **Required Role**: None
- **URL Parameters**:
  - `filename` *(string, required)*: The filename returned when creating or querying scrap listings (e.g. `scrap-1789149596830-65796928.png`).

#### Example Request
```bash
curl -X GET http://localhost:3000/uploads/scrap/scrap-1789149596830-65796928.png
```

#### Success Response (`200 OK`)
- **Content-Type**: `image/png`, `image/jpeg`, `image/webp`
- Binary image data stream.

#### Error Response (`404 Not Found`)
```json
{
  "message": "Route GET /uploads/scrap/missing.png not found"
}
```

---

## 3. Authentication API (`/api/auth`)

Rate limited by default to 100 requests per 15 minutes.

### 3.1 Register User
Creates a new collector or recycler account.

- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Authentication**: None (Public)
- **Required Role**: None
- **Headers**: `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `name` | `string` | **Yes** | User full name (2–100 characters). |
| `email` | `string` | **Yes** | Valid unique email address. |
| `password` | `string` | **Yes** | Plaintext password (min 6 characters). |
| `phone` | `string` | **Yes** | Contact phone (7–15 digits/characters). |
| `role` | `string` | **Yes** | Must be either `"collector"` or `"recycler"`. |

#### Example Request
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arjun Sharma",
    "email": "arjun.collector@example.com",
    "password": "SecurePassword123",
    "phone": "9876543210",
    "role": "collector"
  }'
```

#### Success Response (`201 Created`)
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

#### Error Responses
- **`400 Bad Request`** (Validation Failure):
  ```json
  {
    "message": "Invalid email format",
    "errors": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
  ```
- **`409 Conflict`** (Email Already Registered):
  ```json
  {
    "message": "Email already registered"
  }
  ```
- **`429 Too Many Requests`**:
  ```json
  {
    "message": "Too many authentication attempts from this IP, please try again after 15 minutes"
  }
  ```

---

### 3.2 User Login
Authenticates a user and returns a signed JWT token valid for 7 days.

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Authentication**: None (Public)
- **Required Role**: None
- **Headers**: `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `email` | `string` | **Yes** | Registered email address. |
| `password` | `string` | **Yes** | Account password. |

#### Example Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "arjun.collector@example.com",
    "password": "SecurePassword123"
  }'
```

#### Success Response (`200 OK`)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Arjun Sharma",
    "email": "arjun.collector@example.com",
    "role": "collector"
  }
}
```

#### Error Responses
- **`401 Unauthorized`**:
  ```json
  {
    "message": "Invalid email or password"
  }
  ```
- **`400 Bad Request`**:
  ```json
  {
    "message": "Validation failed",
    "errors": [
      { "field": "email", "message": "Valid email is required" }
    ]
  }
  ```

---

## 4. User Profile API (`/api/users`)

### 4.1 Get Current User Profile
Fetches the profile details of the authenticated user.

- **Method**: `GET`
- **URL**: `/api/users/profile`
- **Authentication**: Bearer JWT
- **Required Role**: Any authenticated user (`collector` or `recycler`)
- **Headers**: `Authorization: Bearer <token>`

#### Example Request
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <token>"
```

#### Success Response (`200 OK`)
```json
{
  "message": "Profile fetched successfully",
  "user": {
    "id": 1,
    "name": "Arjun Sharma",
    "email": "arjun.collector@example.com",
    "phone": "9876543210",
    "role": "collector",
    "created_at": "2026-09-11T12:00:00.000Z"
  }
}
```

#### Error Responses
- **`401 Unauthorized`**:
  ```json
  {
    "message": "Access token required"
  }
  ```

---

### 4.2 Update Profile Details
Updates contact details (`name`, `email`, `phone`). Users cannot alter their `role`.

- **Method**: `PUT` or `PATCH`
- **URL**: `/api/users/profile`
- **Authentication**: Bearer JWT
- **Required Role**: Any authenticated user
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `name` | `string` | Optional | Updated user full name (2–100 chars). |
| `email` | `string` | Optional | Updated email address. |
| `phone` | `string` | Optional | Updated phone (7–15 chars). |

#### Example Request
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arjun Sharma Updated",
    "phone": "9876543299"
  }'
```

#### Success Response (`200 OK`)
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "Arjun Sharma Updated",
    "email": "arjun.collector@example.com",
    "phone": "9876543299",
    "role": "collector"
  }
}
```

#### Error Responses
- **`400 Bad Request`**:
  ```json
  {
    "message": "Invalid phone number format (must be 7-15 digits/symbols)"
  }
  ```
- **`409 Conflict`**:
  ```json
  {
    "message": "Email is already registered by another account"
  }
  ```

---

### 4.3 Change Password
Changes user password after verifying current password against bcrypt hash.

- **Method**: `PUT` or `PATCH`
- **URL**: `/api/users/profile/password`
- **Authentication**: Bearer JWT
- **Required Role**: Any authenticated user
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `currentPassword` | `string` | **Yes** | Existing plaintext password. |
| `newPassword` | `string` | **Yes** | New plaintext password (min 6 characters). |

#### Example Request
```bash
curl -X PUT http://localhost:3000/api/users/profile/password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePassword123",
    "newPassword": "BrandNewPassword789"
  }'
```

#### Success Response (`200 OK`)
```json
{
  "message": "Password changed successfully"
}
```

#### Error Responses
- **`400 Bad Request`** (Wrong Current Password):
  ```json
  {
    "message": "Current password is incorrect"
  }
  ```
- **`400 Bad Request`** (Short New Password):
  ```json
  {
    "message": "New password must be at least 6 characters long"
  }
  ```

---

## 5. Scrap Listings API (`/api/scrap`)

### 5.1 Add Scrap Listing
Allows authenticated collectors to list scrap materials with optional geolocation and photo upload.

- **Method**: `POST`
- **URL**: `/api/scrap`
- **Authentication**: Bearer JWT
- **Required Role**: `collector`
- **Supported Content Types**: `multipart/form-data` OR `application/json`

#### Parameters / Body Fields
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `name` | `string` | **Yes** | Material name (e.g. `"Copper Wires"`). |
| `category` | `string` | Optional | Material category (e.g. `"Metal"`, `"Paper"`, `"Plastic"`). |
| `description` | `string` | Optional | Detailed condition / specifications. |
| `price_per_kg` | `number` | **Yes** | Unit price in INR (> 0). |
| `quantity_kg` | `number` | **Yes** | Available weight in kg (> 0). |
| `address` | `string` | Optional | Street / pickup address. |
| `pincode` | `string` | Optional | Postal code (3–10 characters). |
| `latitude` | `number` | Optional | Geolocation latitude (-90 to +90). |
| `longitude` | `number` | Optional | Geolocation longitude (-180 to +180). |
| `image` | `binary` | Optional | Photo file (`.jpg`, `.jpeg`, `.png`, `.webp`, max 5 MB). |

#### Example Request (`multipart/form-data`)
```bash
curl -X POST http://localhost:3000/api/scrap \
  -H "Authorization: Bearer <collector_token>" \
  -F "name=Copper Cable Scrap" \
  -F "category=Metal" \
  -F "description=High grade stripped copper wire" \
  -F "price_per_kg=450.00" \
  -F "quantity_kg=50.00" \
  -F "address=42 MG Road, Bengaluru" \
  -F "pincode=560001" \
  -F "latitude=12.9716" \
  -F "longitude=77.5946" \
  -F "image=@/path/to/copper.jpg"
```

#### Success Response (`201 Created`)
```json
{
  "message": "Scrap listing added successfully",
  "scrapId": 12,
  "imageUrl": "/uploads/scrap/scrap-1789149596830-65796928.jpg"
}
```

#### Error Responses
- **`400 Bad Request`** (Coordinate out of bounds):
  ```json
  {
    "message": "Latitude must be a valid number between -90 and 90"
  }
  ```
- **`400 Bad Request`** (Invalid file format):
  ```json
  {
    "message": "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed"
  }
  ```
- **`403 Forbidden`** (Wrong role):
  ```json
  {
    "message": "Access forbidden: Requires collector role"
  }
  ```

---

### 5.2 Get Available Scrap (Search, Filters & Pagination)
Public endpoint to query scrap listings with keyword search, category, location, price ranges, minimum quantity, and pagination.

- **Method**: `GET`
- **URL**: `/api/scrap`
- **Authentication**: None (Public)
- **Required Role**: None

#### Query Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :---: | :--- |
| `search` | `string` | None | Substring match on `name` or `description`. |
| `category` | `string` | None | Exact match on `category` (case-insensitive). |
| `location` | `string` | None | Substring match on `address` or `pincode`. |
| `pincode` | `string` | None | Exact match on `pincode`. |
| `minPrice` | `number` | None | Minimum `price_per_kg`. |
| `maxPrice` | `number` | None | Maximum `price_per_kg`. |
| `minQuantity` | `number` | None | Minimum `quantity_kg`. |
| `page` | `integer`| `1` | Page number (1-indexed). |
| `limit` | `integer`| `10` | Records per page (1–100). |

#### Example Request
```bash
curl -X GET "http://localhost:3000/api/scrap?search=Copper&category=Metal&minPrice=300&maxPrice=500&page=1&limit=5"
```

#### Success Response (`200 OK`)
```json
{
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "id": 12,
      "collector_id": 1,
      "collector_name": "Arjun Sharma",
      "name": "Copper Cable Scrap",
      "description": "High grade stripped copper wire",
      "category": "Metal",
      "price_per_kg": "450.00",
      "quantity_kg": "50.00",
      "address": "42 MG Road, Bengaluru",
      "latitude": "12.9716",
      "longitude": "77.5946",
      "pincode": "560001",
      "image_url": "/uploads/scrap/scrap-1789149596830-65796928.jpg",
      "status": "available",
      "created_at": "2026-09-11T12:30:00.000Z"
    }
  ]
}
```

---

### 5.3 Update Scrap Listing
Allows a collector to update an existing scrap listing they created.

- **Method**: `PUT`
- **URL**: `/api/scrap/:id`
- **Authentication**: Bearer JWT
- **Required Role**: `collector` (owner)
- **URL Parameters**: `id` *(integer, required)*

#### Example Request
```bash
curl -X PUT http://localhost:3000/api/scrap/12 \
  -H "Authorization: Bearer <collector_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "price_per_kg": 460.00,
    "quantity_kg": 40.00,
    "address": "42 MG Road, Gate 3, Bengaluru"
  }'
```

#### Success Response (`200 OK`)
```json
{
  "message": "Scrap listing updated successfully"
}
```

#### Error Responses
- **`403 Forbidden`**: Caller does not own this scrap item.
- **`404 Not Found`**: Scrap listing does not exist.

---

### 5.4 Delete Scrap Listing
Deletes a scrap listing and removes its uploaded photo from the server's disk.

- **Method**: `DELETE`
- **URL**: `/api/scrap/:id`
- **Authentication**: Bearer JWT
- **Required Role**: `collector` (owner)
- **URL Parameters**: `id` *(integer, required)*

#### Example Request
```bash
curl -X DELETE http://localhost:3000/api/scrap/12 \
  -H "Authorization: Bearer <collector_token>"
```

#### Success Response (`200 OK`)
```json
{
  "message": "Scrap listing deleted successfully"
}
```

---

## 6. Scrap Requests API (`/api/requests`)

### 6.1 Create Scrap Request
Recyclers can request scrap from an available listing.

- **Method**: `POST`
- **URL**: `/api/requests`
- **Authentication**: Bearer JWT
- **Required Role**: `recycler`
- **Headers**: `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `scrap_id` | `integer` | **Yes** | ID of the target scrap item. |
| `quantity_requested` | `number` | **Yes** | Quantity requested (> 0 and <= available). |
| `notes` | `string` | Optional | Additional delivery or pickup instructions. |

#### Example Request
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer <recycler_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scrap_id": 12,
    "quantity_requested": 25.00,
    "notes": "Pickup during morning hours preferred"
  }'
```

#### Success Response (`201 Created`)
```json
{
  "message": "Scrap request created successfully",
  "requestId": 3
}
```

#### Error Responses
- **`400 Bad Request`**: Requested quantity exceeds available quantity.
- **`403 Forbidden`**: Collectors cannot submit scrap requests.

---

### 6.2 View My Requests (Recycler)
Retrieves all requests submitted by the logged-in recycler.

- **Method**: `GET`
- **URL**: `/api/requests/my`
- **Authentication**: Bearer JWT
- **Required Role**: `recycler`

#### Success Response (`200 OK`)
```json
{
  "message": "My requests fetched successfully",
  "requests": [
    {
      "id": 3,
      "scrap_id": 12,
      "scrap_name": "Copper Cable Scrap",
      "quantity_requested": "25.00",
      "status": "pending",
      "collector_name": "Arjun Sharma",
      "created_at": "2026-09-11T13:00:00.000Z"
    }
  ]
}
```

---

### 6.3 View Incoming Requests (Collector)
Retrieves all incoming requests placed on scrap listings owned by the logged-in collector.

- **Method**: `GET`
- **URL**: `/api/requests/collector`
- **Authentication**: Bearer JWT
- **Required Role**: `collector`

#### Success Response (`200 OK`)
```json
{
  "message": "Incoming requests fetched successfully",
  "requests": [
    {
      "id": 3,
      "scrap_id": 12,
      "scrap_name": "Copper Cable Scrap",
      "quantity_requested": "25.00",
      "status": "pending",
      "recycler_name": "Green Earth Recyclers",
      "created_at": "2026-09-11T13:00:00.000Z"
    }
  ]
}
```

---

### 6.4 Update Request Status (Accept / Reject)
Allows the collector to accept or reject an incoming scrap request.

- **Method**: `PUT`
- **URL**: `/api/requests/:id/status`
- **Authentication**: Bearer JWT
- **Required Role**: `collector` (owner)
- **URL Parameters**: `id` *(integer, required)*

#### Request Body
```json
{
  "status": "accepted"
}
```
*(Status must be `"accepted"` or `"rejected"`)*

#### Success Response (`200 OK`)
```json
{
  "message": "Request status updated to accepted"
}
```

---

## 7. Pickup Management API (`/api/pickups`)

Pickups connect collectors, recyclers, and scrap items with scheduling and GPS routing data.

### Supported Status Values
- `PENDING`: Initial state.
- `SCHEDULED`: Confirmed pickup time and location.
- `COMPLETED`: Terminal completed state.
- `CANCELLED`: Terminal cancelled state.

---

### 7.1 Create Pickup
Schedules a pickup linked to a scrap listing or accepted request. Reuses scrap location data automatically when available.

- **Method**: `POST`
- **URL**: `/api/pickups`
- **Authentication**: Bearer JWT
- **Required Role**: `collector` or `recycler`
- **Headers**: `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `request_id` | `integer` | Optional* | ID of the linked request. |
| `scrap_id` | `integer` | Optional* | ID of the scrap item (*one of `request_id` or `scrap_id` required). |
| `scheduled_at`| `string` | **Yes** | ISO 8601 timestamp (e.g. `"2026-09-20T10:00:00.000Z"`). |
| `address` | `string` | Optional | Pickup address (defaults to scrap address if omitted). |
| `latitude` | `number` | Optional | GPS latitude (-90 to +90). |
| `longitude` | `number` | Optional | GPS longitude (-180 to +180). |
| `notes` | `string` | Optional | Delivery instructions, truck registration, etc. |

#### Example Request
```bash
curl -X POST http://localhost:3000/api/pickups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": 3,
    "scheduled_at": "2026-09-20T10:00:00.000Z",
    "notes": "Truck Plate KA-01-AB-1234"
  }'
```

#### Success Response (`201 Created`)
```json
{
  "message": "Pickup scheduled successfully",
  "pickupId": 7,
  "status": "SCHEDULED"
}
```

---

### 7.2 View My Pickups
Returns all pickups where the authenticated user is either the collector or the recycler.

- **Method**: `GET`
- **URL**: `/api/pickups/my` or `/api/pickups`
- **Authentication**: Bearer JWT
- **Required Role**: Any participant
- **Query Parameters**:
  - `status` *(optional)*: Filter by `PENDING`, `SCHEDULED`, `COMPLETED`, `CANCELLED`.

#### Success Response (`200 OK`)
```json
{
  "message": "Pickups retrieved successfully",
  "count": 1,
  "pickups": [
    {
      "id": 7,
      "scrap_id": 12,
      "collector_id": 1,
      "recycler_id": 2,
      "address": "42 MG Road, Bengaluru",
      "latitude": "12.9716",
      "longitude": "77.5946",
      "scheduled_at": "2026-09-20T10:00:00.000Z",
      "status": "SCHEDULED",
      "notes": "Truck Plate KA-01-AB-1234"
    }
  ]
}
```

---

### 7.3 View Pickup by ID
Retrieves single pickup details. Only authorized participants can access.

- **Method**: `GET`
- **URL**: `/api/pickups/:id`
- **Authentication**: Bearer JWT
- **Required Role**: Participant (`collector` or `recycler`)
- **URL Parameters**: `id` *(integer, required)*

#### Success Response (`200 OK`)
```json
{
  "message": "Pickup retrieved successfully",
  "pickup": {
    "id": 7,
    "scrap_id": 12,
    "collector_id": 1,
    "recycler_id": 2,
    "address": "42 MG Road, Bengaluru",
    "latitude": "12.9716",
    "longitude": "77.5946",
    "scheduled_at": "2026-09-20T10:00:00.000Z",
    "status": "SCHEDULED"
  }
}
```

#### Error Responses
- **`403 Forbidden`**: User is not a participant in this pickup.
- **`404 Not Found`**: Pickup ID does not exist.

---

### 7.4 Update Pickup
Updates address, coordinates, schedule, or notes. Terminal states (`COMPLETED` or `CANCELLED`) cannot be modified.

- **Method**: `PUT` or `PATCH`
- **URL**: `/api/pickups/:id`
- **Authentication**: Bearer JWT
- **Required Role**: Participant

#### Example Request
```bash
curl -X PUT http://localhost:3000/api/pickups/7 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduled_at": "2026-09-21T11:30:00.000Z",
    "notes": "Rescheduled by mutual consent"
  }'
```

#### Success Response (`200 OK`)
```json
{
  "message": "Pickup updated successfully"
}
```

---

### 7.5 Complete Pickup
Transitions pickup status to `COMPLETED`.

- **Method**: `PATCH` or `PUT`
- **URL**: `/api/pickups/:id/complete`
- **Authentication**: Bearer JWT
- **Required Role**: Participant

#### Success Response (`200 OK`)
```json
{
  "message": "Pickup completed successfully",
  "status": "COMPLETED"
}
```

---

### 7.6 Cancel Pickup
Transitions pickup status to `CANCELLED`.

- **Method**: `PATCH` or `PUT`
- **URL**: `/api/pickups/:id/cancel`
- **Authentication**: Bearer JWT
- **Required Role**: Participant

#### Success Response (`200 OK`)
```json
{
  "message": "Pickup cancelled successfully",
  "status": "CANCELLED"
}
```

---

## 8. Transactions API (`/api/transactions`)

### Supported Status Values
- `PENDING`: Initial payment pending state.
- `COMPLETED`: Payment cleared and confirmed.
- `CANCELLED`: Transaction cancelled.
- `FAILED`: Payment processing failed.

---

### 8.1 Create Transaction
Creates a transaction record referencing a pickup, request, or scrap. Automatically calculates amount if `request_id` is supplied without an explicit `amount`.

- **Method**: `POST`
- **URL**: `/api/transactions`
- **Authentication**: Bearer JWT
- **Required Role**: Participant (`collector` or `recycler`)
- **Headers**: `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `pickup_id` | `integer` | Optional | ID of the linked pickup. |
| `request_id`| `integer` | Optional | ID of the linked request. |
| `scrap_id` | `integer` | Optional | ID of the scrap listing. |
| `amount` | `number` | Optional* | Transaction amount in INR (> 0). *Auto-calculated from request rate * quantity if omitted. |
| `notes` | `string` | Optional | Payment notes or payment reference. |

#### Example Request
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_id": 7,
    "amount": 11250.00,
    "notes": "Direct bank settlement upon weighing"
  }'
```

#### Success Response (`201 Created`)
```json
{
  "message": "Transaction created successfully",
  "transactionId": 5,
  "amount": "11250.00",
  "status": "PENDING"
}
```

---

### 8.2 View My Transactions
Retrieves all transactions associated with the authenticated user.

- **Method**: `GET`
- **URL**: `/api/transactions/my` or `/api/transactions`
- **Authentication**: Bearer JWT
- **Required Role**: Participant
- **Query Parameters**:
  - `status` *(optional)*: Filter by `PENDING`, `COMPLETED`, `CANCELLED`, `FAILED`.

#### Success Response (`200 OK`)
```json
{
  "message": "Transactions retrieved successfully",
  "count": 1,
  "transactions": [
    {
      "id": 5,
      "pickup_id": 7,
      "collector_id": 1,
      "recycler_id": 2,
      "amount": "11250.00",
      "status": "PENDING",
      "created_at": "2026-09-11T13:30:00.000Z"
    }
  ]
}
```

---

### 8.3 View Transaction by ID
Fetches complete transaction record.

- **Method**: `GET`
- **URL**: `/api/transactions/:id`
- **Authentication**: Bearer JWT
- **Required Role**: Participant (`collector` or `recycler`)
- **URL Parameters**: `id` *(integer, required)*

#### Success Response (`200 OK`)
```json
{
  "message": "Transaction retrieved successfully",
  "transaction": {
    "id": 5,
    "pickup_id": 7,
    "collector_id": 1,
    "recycler_id": 2,
    "amount": "11250.00",
    "status": "PENDING",
    "created_at": "2026-09-11T13:30:00.000Z"
  }
}
```

---

### 8.4 Update Transaction Status
Updates transaction status to `COMPLETED`, `CANCELLED`, or `FAILED`. Once marked `COMPLETED` or `CANCELLED`, transaction records become immutable.

- **Method**: `PUT` or `PATCH`
- **URL**: `/api/transactions/:id/status`
- **Authentication**: Bearer JWT
- **Required Role**: Participant
- **URL Parameters**: `id` *(integer, required)*

#### Request Body
```json
{
  "status": "COMPLETED"
}
```

#### Success Response (`200 OK`)
```json
{
  "message": "Transaction status updated successfully",
  "status": "COMPLETED"
}
```

#### Error Responses
- **`400 Bad Request`**: Completed or cancelled transactions cannot be modified.
- **`403 Forbidden`**: User not authorized to update this transaction.

---

## 9. AI Service API (`/api/ai`)

Provides integration with the Kabadiwala AI FastAPI machine learning service for scrap classification, confidence scoring, and estimated market price calculations.

---

### 9.1 Predict Scrap Material (Image Upload)
Accepts a scrap photo via `multipart/form-data` under the field name `"file"`, holds it in memory, and proxies it to the FastAPI AI service (`POST ${AI_SERVICE_URL}/predict`). Returns material classification, confidence, and estimated price per kg.

- **Method**: `POST`
- **URL**: `/api/ai/predict`
- **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)
- **Required Role**: Any authenticated user (`collector` or `recycler`)
- **Content-Type**: `multipart/form-data`

#### Request Parameters
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `file` | `binary` | **Yes** | Image file to classify (`.jpg`, `.jpeg`, `.png`, `.webp`, max 10MB). |

#### Example Request
```bash
curl -X POST http://localhost:3000/api/ai/predict \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "file=@/path/to/scrap_sample.jpg"
```

#### Success Response (`200 OK`)
```json
{
  "material": "Plastic",
  "confidence": 0.92,
  "estimated_price_per_kg": 30,
  "estimated_weight": null,
  "estimated_value": null
}
```

#### Error Responses
- **`400 Bad Request`** (Missing Image):
  ```json
  {
    "message": "Image file is required under field name 'file'"
  }
  ```
- **`400 Bad Request`** (Invalid File Type):
  ```json
  {
    "message": "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed"
  }
  ```
- **`401 Unauthorized`**:
  ```json
  {
    "message": "Access token required"
  }
  ```
- **`503 Service Unavailable`** (AI FastAPI Server Offline / Unreachable):
  ```json
  {
    "message": "AI prediction service is currently unavailable. Please try again later."
  }
  ```
- **`504 Gateway Timeout`** (AI Server Request Timed Out):
  ```json
  {
    "message": "AI prediction service request timed out"
  }
  ```

---

## 10. Postman Collection & Automated Workflow

The repository includes a ready-to-import Postman collection located at:
- **`postman/collections/KABADIWALA_API.postman_collection.json`**
- **`BACKEND/postman/collections/KABADIWALA_API.postman_collection.json`**

### Collection Features
- **33 Request Templates**: Organized across 8 folders (`System & Health`, `Auth`, `Users`, `Scrap`, `Requests`, `Pickups`, `Transactions`, `AI Service`).
- **Dynamic Variable Injection**: Automatically captures JWT tokens (`collectorToken`, `recyclerToken`) and entity IDs (`scrapId`, `requestId`, `pickupId`, `transactionId`, `uploadedFilename`) during request execution.
- **Pre-configured Environments**: Works immediately against `{{baseUrl}}` (`http://localhost:3000`).

### Quick Testing Sequence in Postman
1. Run **Auth > Register - Collector** and **Auth > Register - Recycler**.
2. Run **Auth > Login - Collector** (stores `{{collectorToken}}`).
3. Run **Auth > Login - Recycler** (stores `{{recyclerToken}}`).
4. Run **AI Service > Predict Scrap Material** (upload a scrap photo to get instant material classification).
5. Run **Scrap > Add Scrap with Photo** (stores `{{scrapId}}` and `{{uploadedFilename}}`).
6. Run **Requests > Create Scrap Request** (stores `{{requestId}}`).
7. Run **Requests > Update Request Status (Collector)** (accepts request).
8. Run **Pickups > Create Pickup** (stores `{{pickupId}}`).
9. Run **Transactions > Create Transaction** (stores `{{transactionId}}`).
10. Run status updates and verification endpoints.
