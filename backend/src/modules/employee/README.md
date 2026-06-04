# Employee Management Module

## Overview

The Employee Management Module is a comprehensive, production-ready system for managing employee records, organizational structure, and employee lifecycle events in the HRMinds AI HRMS platform.

## Features

✅ **Complete Employee Management**
- Create, read, update, and delete employee records
- Track comprehensive employee profiles (education, certifications, skills, documents)
- Manage employment status and history

✅ **Organizational Structure**
- Department management with hierarchies
- Designation/job title management with 7 levels
- Organization chart visualization
- Team management and reporting lines

✅ **Career Management**
- Promotion tracking and history
- Department transfers
- Status change management (active, on leave, probation, resigned, terminated)
- Salary grade management

✅ **Activity Timeline**
- Complete audit trail of all employee actions
- 15 activity types tracked automatically
- Employee timeline visualization
- Activity analytics and statistics

✅ **Advanced Features**
- Role-Based Access Control (RBAC) with 4 roles
- Pagination and filtering on all endpoints
- Advanced search capabilities
- Bulk operations support
- Soft delete support
- Activity logging for all operations

✅ **Data Validation**
- Zod schema validation on all inputs
- Type-safe request/response handling
- Comprehensive error messages
- File upload validation

## Architecture

### Technology Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod
- **RBAC**: Custom permission-based middleware

### Directory Structure

```
src/modules/employee/
├── controllers/           # HTTP request handlers
│   ├── employee.controller.ts
│   ├── department.controller.ts
│   ├── designation.controller.ts
│   ├── employee-activity.controller.ts
│   └── index.ts
├── services/             # Business logic
│   ├── employee.service.ts
│   ├── department.service.ts
│   ├── designation.service.ts
│   ├── employee-activity.service.ts
│   └── index.ts
├── repositories/         # Data access layer
│   ├── employee.repository.ts
│   ├── department.repository.ts
│   ├── designation.repository.ts
│   ├── employee-activity.repository.ts
│   └── index.ts
├── middlewares/          # Express middlewares
│   ├── validate.middleware.ts    # Zod validation
│   ├── rbac.middleware.ts        # Role-based access control
│   └── index.ts
├── routes/              # Express routes
│   ├── employee.routes.ts
│   ├── department.routes.ts
│   ├── designation.routes.ts
│   ├── employee-activity.routes.ts
│   └── index.ts
├── validators/          # Zod schemas
│   ├── employee.validator.ts
│   ├── department.validator.ts
│   ├── designation.validator.ts
│   ├── employee-activity.validator.ts
│   └── index.ts
├── dtos/               # Data transfer objects
│   ├── employee.dto.ts
│   ├── department.dto.ts
│   ├── designation.dto.ts
│   ├── employee-activity.dto.ts
│   ├── common.dto.ts
│   └── index.ts
├── tests/              # Test utilities
│   └── test.utils.ts
├── employee.types.ts        # TypeScript type definitions
├── employee.constants.ts    # Module constants
├── integration.example.ts   # Integration guide
├── employee.docs.ts        # API documentation
└── index.ts               # Module exports
```

## Database Schemas

### Employee Model
```typescript
{
  employeeCode: string (unique),
  userId: ObjectId (ref User),
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  gender: string?,
  dateOfBirth: Date?,
  departmentId: ObjectId (ref Department),
  designationId: ObjectId (ref Designation),
  managerId: ObjectId (ref Employee)?,
  employmentType: FULL_TIME | PART_TIME | CONTRACT | INTERN,
  employmentStatus: ACTIVE | ON_LEAVE | PROBATION | RESIGNED | TERMINATED,
  joiningDate: Date,
  experience: number?,
  skills: string[],
  education: { institution, degree, field, graduationYear }[],
  certifications: { name, issuer, issueDate, expiryDate }[],
  documents: { fileName, fileType, fileUrl }[],
  emergencyContact: { name, phone, relationship }?,
  address: { street, city, state, postalCode, country }?,
  salaryGrade: string?,
  workLocation: string,
  profileImage: string?,
  notes: string?,
  isDeleted: boolean (default: false),
  createdBy: ObjectId (ref User),
  updatedBy: ObjectId (ref User),
  timestamps: { createdAt, updatedAt }
}
```

### Department Model
```typescript
{
  name: string (unique),
  description: string?,
  departmentHead: ObjectId (ref Employee)?,
  isActive: boolean (default: true),
  timestamps: { createdAt, updatedAt }
}
```

### Designation Model
```typescript
{
  title: string,
  description: string?,
  departmentId: ObjectId (ref Department),
  level: 1-7,
  timestamps: { createdAt, updatedAt }
  // Unique constraint: (title, departmentId)
}
```

### EmployeeActivity Model
```typescript
{
  employeeId: ObjectId (ref Employee),
  activityType: ActivityType (15 types),
  title: string,
  description: string,
  previousValue: any?,
  newValue: any?,
  metadata: object?,
  createdBy: ObjectId (ref User),
  timestamps: { createdAt, updatedAt }
}
```

## API Endpoints

All endpoints are prefixed with `/api/v1`

### Employees
- `POST /employees` - Create employee
- `GET /employees` - List employees (paginated)
- `GET /employees/:id` - Get employee
- `PUT /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee
- `GET /employees/search/:query` - Search employees
- `GET /employees/directory` - Get employee directory
- `GET /employees/hierarchy` - Get organization hierarchy
- `GET /employees/:id/team` - Get team members
- `POST /employees/:id/promote` - Promote employee
- `POST /employees/:id/transfer` - Transfer employee
- `POST /employees/:id/status` - Change status
- `POST /employees/:id/skills` - Add skill
- `DELETE /employees/:id/skills/:skillName` - Remove skill
- `POST /employees/:id/education` - Add education
- `POST /employees/:id/certifications` - Add certification
- `POST /employees/:id/documents` - Upload document
- `GET /employees/stats/dashboard` - Get statistics
- `PUT /employees/bulk/update` - Bulk update

### Departments
- `POST /departments` - Create department
- `GET /departments` - List departments
- `GET /departments/:id` - Get department
- `PUT /departments/:id` - Update department
- `DELETE /departments/:id` - Delete department
- `GET /departments/active` - Get active departments
- `GET /departments/:id/details` - Get details
- `POST /departments/:id/head` - Assign head
- `DELETE /departments/:id/head` - Remove head
- `PATCH /departments/:id/toggle-status` - Toggle status
- `GET /departments/stats/dashboard` - Get statistics
- `GET /departments/search/:query` - Search departments

### Designations
- `POST /designations` - Create designation
- `GET /designations` - List designations
- `GET /designations/:id` - Get designation
- `GET /designations/all` - Get all designations
- `GET /designations/by-department/:departmentId` - By department
- `GET /designations/by-level/:level` - By level
- `GET /designations/range/:minLevel/:maxLevel` - By level range
- `GET /designations/levels` - Get all levels
- `PUT /designations/:id` - Update designation
- `DELETE /designations/:id` - Delete designation
- `GET /designations/stats/dashboard` - Get statistics
- `GET /designations/search/:query` - Search designations

### Activities
- `GET /activities/:id` - Get activity
- `GET /activities` - List activities
- `GET /activities/employee/:employeeId/timeline` - Get timeline
- `GET /activities/employee/:employeeId` - Get by employee
- `GET /activities/type/:activityType` - Get by type
- `GET /activities/recent` - Get recent
- `GET /activities/date-range` - Get by date range
- `GET /activities/stats/dashboard` - Get statistics
- `GET /activities/summary/dashboard` - Get summary
- `GET /activities/distribution` - Get distribution
- `GET /activities/employee/:employeeId/count` - Get count
- `GET /activities/search/:query` - Search activities

## RBAC Roles

### MANAGEMENT_ADMIN
Full access to all operations
- `create:employee`, `read:employee`, `update:employee`, `delete:employee`
- `manage:department`, `manage:designation`
- `view:hierarchy`, `manage:roles`, `bulk:update`

### SENIOR_MANAGER
Can view employees and manage team
- `read:employee`, `read:team`, `update:team`
- `view:hierarchy`, `read:department`

### HR_RECRUITER
Can create and update employee records
- `create:employee`, `read:employee`, `update:employee`
- `read:department`, `read:designation`, `view:directory`

### EMPLOYEE
Can view own profile and directory
- `read:own_profile`, `update:own_profile`, `read:directory`

## Validation Schemas

All inputs are validated using Zod schemas:
- Employee: Create, Update, Promote, Transfer, Status Change, Skills, Education, Certifications, Documents, Bulk Update
- Department: Create, Update, Assign Head
- Designation: Create, Update
- Activity: List, Date Range filters

See [validators](./validators/) directory for detailed schemas.

## Integration

### Basic Setup

```typescript
import { employeeRoutes } from './modules/employee';
import app from './app';

// Apply to Express app
app.use('/api/v1', employeeRoutes);
```

### Requirements

Your authentication middleware must attach a user object:
```typescript
req.user = {
  _id: "mongodb-user-id",
  email: "user@example.com",
  role: "MANAGEMENT_ADMIN" | "SENIOR_MANAGER" | "HR_RECRUITER" | "EMPLOYEE"
}
```

See [integration.example.ts](./integration.example.ts) for complete setup guide.

## Testing

Test utilities are provided in [tests/test.utils.ts](./tests/test.utils.ts):
- Mock data for all entities
- Test data builders
- Permission test cases
- Validation test data
- Filter and search test cases

```typescript
import { mockEmployeeData, buildEmployeeRequest } from './tests/test.utils';

const employeeData = buildEmployeeRequest({ firstName: 'Jane' });
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error or validation errors",
  "statusCode": 400
}
```

Common status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation)
- `401` - Unauthorized
- `403` - Forbidden (permissions)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Error

## Response Format

Success responses:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "statusCode": 200
}
```

Paginated responses:
```json
{
  "success": true,
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

## Performance Considerations

✅ **Database Indexes**
- Single field indexes on frequently queried fields
- Composite indexes for common filter combinations
- Index on isDeleted for soft delete queries

✅ **Pagination**
- Default limit: 10
- Max limit: 100
- All list endpoints support pagination

✅ **Caching Opportunities**
- Department lists (static data)
- Designation levels (reference data)
- Organization hierarchy (updated less frequently)

## Security Features

✅ **Access Control**
- Role-based permission checks on every endpoint
- User context isolation (createdBy, updatedBy)

✅ **Data Validation**
- Comprehensive Zod schemas
- Type-safe input handling

✅ **Audit Trail**
- All operations logged in EmployeeActivity
- User tracking (createdBy, updatedBy)
- Activity types for compliance

✅ **Soft Deletes**
- Data retention
- Compliance support
- Recovery possibility

## Future Enhancements

- [ ] Batch import/export (CSV, Excel)
- [ ] Employee performance ratings
- [ ] Leave management integration
- [ ] Attendance tracking
- [ ] Advanced reporting and analytics
- [ ] Email notifications
- [ ] Document storage integration (S3, GCS)
- [ ] Employee self-service portal
- [ ] Org chart visualization frontend
- [ ] Custom field support

## Contributing

When extending this module:
1. Follow the existing architecture pattern
2. Add Zod validation for new inputs
3. Log activities for user actions
4. Add proper RBAC checks
5. Write tests for new features
6. Update documentation

## Documentation

- [API Documentation](./employee.docs.ts)
- [Integration Guide](./integration.example.ts)
- [Test Utilities](./tests/test.utils.ts)
- [Constants](./employee.constants.ts)

## Support

For issues or questions:
1. Check the API documentation
2. Review test utils for examples
3. Check integration guide for setup help
4. Verify role permissions for access issues
