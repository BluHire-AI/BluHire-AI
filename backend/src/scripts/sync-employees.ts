import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User as UserModel } from '../models/User';
import EmployeeModel, { EmploymentStatus, EmploymentType } from '../models/Employee';
import DepartmentModel from '../models/Department';
import DesignationModel from '../models/Designation';
import { SystemRoles } from '../models/roles';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';

async function run() {
  console.log('Connecting to database:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected successfully!');

  try {
    // 1. Get all users with role EMPLOYEE
    const employees = await UserModel.find({ role: SystemRoles.EMPLOYEE });
    console.log(`Found ${employees.length} users with role EMPLOYEE.`);

    if (employees.length === 0) {
      console.log('No employee users found to sync.');
      return;
    }

    // 2. Ensure default Department and Designation exist
    let defaultDept = await DepartmentModel.findOne({ name: 'General' });
    if (!defaultDept) {
      defaultDept = await DepartmentModel.create({
        name: 'General',
        description: 'Default department for synchronized employees',
      });
      console.log('Created default "General" department.');
    }

    let defaultDesig = await DesignationModel.findOne({ title: 'Associate', departmentId: defaultDept._id });
    if (!defaultDesig) {
      defaultDesig = await DesignationModel.create({
        title: 'Associate',
        description: 'Default designation for synchronized employees',
        departmentId: defaultDept._id,
        level: 1,
      });
      console.log('Created default "Associate" designation.');
    }

    // 3. Sync each employee user
    let createdCount = 0;
    let updatedCount = 0;

    for (const user of employees) {
      // Find employee by email or userId
      let employeeRecord = await EmployeeModel.findOne({
        $or: [
          { email: user.email },
          { userId: user._id.toString() }
        ]
      });

      if (!employeeRecord) {
        // Generate code
        const empCount = await EmployeeModel.countDocuments();
        const empCode = `EMP${new Date().getFullYear()}${(empCount + 1).toString().padStart(4, '0')}`;

        employeeRecord = await EmployeeModel.create({
          employeeCode: empCode,
          userId: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '0000000000',
          departmentId: defaultDept._id.toString(),
          designationId: defaultDesig._id.toString(),
          employmentType: EmploymentType.FULL_TIME,
          joiningDate: user.createdAt || new Date(),
          workLocation: 'Head Office',
          employmentStatus: EmploymentStatus.ACTIVE,
          skills: [],
          isDeleted: false,
          createdBy: user._id.toString(),
        });

        console.log(`[CREATED] Employee record for ${user.firstName} ${user.lastName} (${user.email}) -> Code: ${empCode}`);
        createdCount++;
      } else {
        // Update linked userId or sync status if missing/soft-deleted
        let needsUpdate = false;
        if (!employeeRecord.userId || employeeRecord.userId.toString() !== user._id.toString()) {
          employeeRecord.userId = user._id.toString();
          needsUpdate = true;
        }
        if (employeeRecord.isDeleted) {
          employeeRecord.isDeleted = false;
          employeeRecord.employmentStatus = EmploymentStatus.ACTIVE;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await employeeRecord.save();
          console.log(`[UPDATED] Linked/Reactivated Employee record for ${user.firstName} ${user.lastName} (${user.email})`);
          updatedCount++;
        } else {
          console.log(`[OK] Employee record already linked and active for ${user.firstName} ${user.lastName} (${user.email})`);
        }
      }
    }

    console.log(`\nSynchronization finished:`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Updated: ${updatedCount}`);

  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

run();
