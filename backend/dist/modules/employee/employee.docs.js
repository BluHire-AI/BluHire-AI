"use strict";
/*
# Employee Management Module - API Documentation

## Base URL
```
/api/v1
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <token>
```

## RBAC Roles
- `MANAGEMENT_ADMIN` - Full access to all operations
- `SENIOR_MANAGER` - View employees, manage team
- `HR_RECRUITER` - Create/update employees, manage records
- `EMPLOYEE` - View own profile and directory

---

## Employee Endpoints

### Create Employee
```
POST /employees
Permissions: create:employee
Status: 201

Request Body:
{
  "employeeCode": "EMP001",
  "userId": "user-id",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "departmentId": "dept-id",
  "designationId": "desig-id",
  "employmentType": "FULL_TIME",
  "joiningDate": "2024-01-01T00:00:00Z",
  "workLocation": "New York"
}
```

### List Employees
```
GET /employees
Permissions: read:employee

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10, max: 100)
- search: string
- departmentId: string
- designationId: string
- employmentStatus: ACTIVE|ON_LEAVE|PROBATION|RESIGNED|TERMINATED
- employmentType: FULL_TIME|PART_TIME|CONTRACT|INTERN
- sortBy: string (default: createdAt)
- sortOrder: asc|desc
```

### Get Employee
```
GET /employees/:id
Permissions: read:employee
```

### Update Employee
```
PUT /employees/:id
Permissions: update:employee

Request Body: (all fields optional)
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-0456",
  ...
}
```

### Delete Employee (Soft Delete)
```
DELETE /employees/:id
Permissions: delete:employee
```

### Search Employees
```
GET /employees/search/:query
Permissions: read:employee

Query Parameters:
- page: number
- limit: number
```

### Get Employee Directory
```
GET /employees/directory
Permissions: read:directory

Returns list of active employees with basic info
```

### Get Organization Hierarchy
```
GET /employees/hierarchy
Permissions: view:hierarchy

Returns organization chart structure
```

### Get Team Members
```
GET /employees/:id/team
Permissions: read:team

Returns direct reports of a manager
```

### Promote Employee
```
POST /employees/:id/promote
Permissions: update:employee

Request Body:
{
  "designationId": "new-desig-id",
  "departmentId": "dept-id" (optional),
  "salaryGrade": "grade-name" (optional)
}
```

### Transfer Employee
```
POST /employees/:id/transfer
Permissions: update:employee

Request Body:
{
  "departmentId": "new-dept-id",
  "designationId": "desig-id" (optional),
  "managerId": "manager-id" (optional)
}
```

### Change Employee Status
```
POST /employees/:id/status
Permissions: update:employee

Request Body:
{
  "employmentStatus": "ACTIVE|ON_LEAVE|PROBATION|RESIGNED|TERMINATED",
  "reason": "string" (optional),
  "effectiveDate": "2024-01-01T00:00:00Z" (optional)
}
```

### Add Skill
```
POST /employees/:id/skills
Permissions: update:employee

Request Body:
{
  "skill": "TypeScript"
}
```

### Remove Skill
```
DELETE /employees/:id/skills/:skillName
Permissions: update:employee
```

### Add Education
```
POST /employees/:id/education
Permissions: update:employee

Request Body:
{
  "institution": "Harvard University",
  "degree": "Master's",
  "field": "Computer Science",
  "graduationYear": 2020
}
```

### Add Certification
```
POST /employees/:id/certifications
Permissions: update:employee

Request Body:
{
  "name": "AWS Solutions Architect",
  "issuer": "Amazon Web Services",
  "issueDate": "2023-01-01T00:00:00Z",
  "expiryDate": "2026-01-01T00:00:00Z" (optional),
  "certificateUrl": "https://..." (optional)
}
```

### Upload Document
```
POST /employees/:id/documents
Permissions: update:employee

Request Body:
{
  "fileName": "resume.pdf",
  "fileType": "pdf|doc|docx|jpg|png|jpeg",
  "fileUrl": "https://..."
}
```

### Get Employee Statistics
```
GET /employees/stats/dashboard
Permissions: read:employee

Returns: {
  totalEmployees: number,
  activeEmployees: number,
  onLeave: number,
  probation: number,
  resigned: number,
  terminated: number
}
```

### Bulk Update Employees
```
PUT /employees/bulk/update
Permissions: bulk:update

Request Body:
{
  "employeeIds": ["id1", "id2", "id3"],
  "updates": {
    "departmentId": "new-dept-id",
    ...
  }
}
```

---

## Department Endpoints

### Create Department
```
POST /departments
Permissions: manage:department

Request Body:
{
  "name": "Engineering",
  "description": "Software Development",
  "departmentHead": "employee-id" (optional)
}
```

### List Departments
```
GET /departments
Permissions: read:department

Query Parameters:
- page: number
- limit: number
- search: string
- isActive: boolean
- sortBy: string
- sortOrder: asc|desc
```

### Get Department
```
GET /departments/:id
Permissions: read:department
```

### Update Department
```
PUT /departments/:id
Permissions: manage:department
```

### Delete Department
```
DELETE /departments/:id
Permissions: manage:department
```

### Get Active Departments
```
GET /departments/active
Permissions: read:department
```

### Get Department Details
```
GET /departments/:id/details
Permissions: read:department

Returns department info with employee count
```

### Assign Department Head
```
POST /departments/:id/head
Permissions: manage:department

Request Body:
{
  "employeeId": "emp-id"
}
```

### Remove Department Head
```
DELETE /departments/:id/head
Permissions: manage:department
```

### Toggle Department Status
```
PATCH /departments/:id/toggle-status
Permissions: manage:department
```

### Get Department Statistics
```
GET /departments/stats/dashboard
Permissions: read:department
```

### Search Departments
```
GET /departments/search/:query
Permissions: read:department
```

---

## Designation Endpoints

### Create Designation
```
POST /designations
Permissions: manage:designation

Request Body:
{
  "title": "Senior Engineer",
  "description": "...",
  "departmentId": "dept-id",
  "level": 3 (1-7)
}
```

### List Designations
```
GET /designations
Permissions: read:designation
```

### Get Designation
```
GET /designations/:id
Permissions: read:designation
```

### Get All Designations
```
GET /designations/all
Permissions: read:designation
```

### Get Designations by Department
```
GET /designations/by-department/:departmentId
Permissions: read:designation
```

### Get Designations by Level
```
GET /designations/by-level/:level
Permissions: read:designation
```

### Get Designations by Level Range
```
GET /designations/range/:minLevel/:maxLevel
Permissions: read:designation
```

### Get All Levels
```
GET /designations/levels
Permissions: read:designation

Returns available designation levels with counts
```

### Update Designation
```
PUT /designations/:id
Permissions: manage:designation
```

### Delete Designation
```
DELETE /designations/:id
Permissions: manage:designation
```

### Get Designation Statistics
```
GET /designations/stats/dashboard
Permissions: read:designation
```

### Search Designations
```
GET /designations/search/:query
Permissions: read:designation
```

---

## Activity/Timeline Endpoints

### Get Activity
```
GET /activities/:id
Permissions: read:employee
```

### List Activities
```
GET /activities
Permissions: read:employee

Query Parameters:
- page: number
- limit: number
- employeeId: string
- activityType: string
- startDate: ISO8601 date
- endDate: ISO8601 date
- sortBy: string
- sortOrder: asc|desc
```

### Get Employee Timeline
```
GET /activities/employee/:employeeId/timeline
Permissions: read:employee

Returns last 50 activities for employee
```

### Get Activities by Employee
```
GET /activities/employee/:employeeId
Permissions: read:employee
```

### Get Activities by Type
```
GET /activities/type/:activityType
Permissions: read:employee
```

### Get Recent Activities
```
GET /activities/recent
Permissions: read:employee

Query Parameters:
- limit: number (default: 100)
```

### Get Activities by Date Range
```
GET /activities/date-range
Permissions: read:employee

Query Parameters:
- startDate: ISO8601 date (required)
- endDate: ISO8601 date (required)
- page: number
- limit: number
```

### Get Activity Statistics
```
GET /activities/stats/dashboard
Permissions: read:employee

Query Parameters:
- startDate: ISO8601 date (optional)
- endDate: ISO8601 date (optional)

Returns count of activities by type
```

### Get Activity Summary
```
GET /activities/summary/dashboard
Permissions: read:employee

Returns total activities, breakdown by type, and recent activities
```

### Get Activity Distribution
```
GET /activities/distribution
Permissions: read:employee

Returns activity types sorted by frequency
```

### Get Employee Activity Count
```
GET /activities/employee/:employeeId/count
Permissions: read:employee
```

### Search Activities
```
GET /activities/search/:query
Permissions: read:employee

Query Parameters:
- page: number
- limit: number
```

---

## Activity Types
- `JOINED` - Employee joined company
- `DEPARTMENT_CHANGED` - Department changed
- `DESIGNATION_CHANGED` - Designation changed
- `PROMOTION` - Employee promoted
- `MANAGER_CHANGED` - Manager/supervisor changed
- `STATUS_CHANGED` - Employment status changed
- `SALARY_UPDATED` - Salary information updated
- `DOCUMENT_ADDED` - Document uploaded
- `PROFILE_UPDATED` - Profile updated
- `SKILL_ADDED` - Skill added
- `CERTIFICATION_ADDED` - Certification added
- `LEAVE_STARTED` - Leave started
- `LEAVE_ENDED` - Leave ended
- `RESIGNED` - Employee resigned
- `TERMINATED` - Employee terminated

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error or validation errors",
  "statusCode": 400
}
```

### Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## Success Responses

All success responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "statusCode": 200
}
```

For paginated responses:
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    "data": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "statusCode": 200
}
```
*/
