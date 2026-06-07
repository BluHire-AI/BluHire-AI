import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../../models/User';
import Employee, { EmploymentStatus, EmploymentType } from '../../models/Employee';
import Department from '../../models/Department';
import Designation from '../../models/Designation';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';

async function runAudit(repair: boolean = false) {
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Connected to Database successfully.');

  const users = await User.find({});
  const employees = await Employee.find({});

  console.log(`\n--- DB Stats ---`);
  console.log(`Total Users in DB: ${users.length}`);
  console.log(`Total Employee Profiles in DB: ${employees.length}`);

  const linkedUsers: any[] = [];
  const missingEmployeeUsers: any[] = [];

  // Get default department and designation for fallback repair
  let defaultDept: any = await Department.findOne({});
  if (!defaultDept) {
    defaultDept = await Department.create({ name: 'General', description: 'Default department' });
  }
  let defaultDesg: any = await Designation.findOne({});
  if (!defaultDesg) {
    defaultDesg = await Designation.create({ title: 'Staff Member', description: 'Default designation' });
  }

  for (const user of users) {
    // Try to find matching employee
    const matchedEmployee = await Employee.findOne({
      $or: [
        { userId: user._id.toString() },
        { employeeCode: user.employeeId }
      ]
    });

    if (matchedEmployee) {
      // Ensure they are cross-linked correctly
      let updated = false;
      if (!matchedEmployee.userId) {
        matchedEmployee.userId = user._id.toString();
        updated = true;
      }
      if (updated) {
        await matchedEmployee.save();
      }
      linkedUsers.push({
        userId: user._id,
        email: user.email,
        role: user.role,
        employeeCode: matchedEmployee.employeeCode,
        employeeId: matchedEmployee._id
      });
    } else {
      missingEmployeeUsers.push({
        userId: user._id,
        email: user.email,
        role: user.role,
        employeeIdCode: user.employeeId,
        createdAt: user.createdAt
      });
    }
  }

  console.log(`\n=========================================`);
  console.log(`PHASE 2: USERS SUCCESSFULLY LINKED (${linkedUsers.length})`);
  console.log(`=========================================`);
  linkedUsers.forEach(u => {
    console.log(`- User: ${u.email} [${u.role}] <-> Employee Code: ${u.employeeCode} (EmpID: ${u.employeeId})`);
  });

  console.log(`\n=========================================`);
  console.log(`PHASE 2: USERS MISSING EMPLOYEE RECORDS (${missingEmployeeUsers.length})`);
  console.log(`=========================================`);
  
  const repairReport = {
    created: 0,
    skipped: 0,
    ignored: 0
  };

  for (const u of missingEmployeeUsers) {
    const shouldHaveProfile = u.role === 'EMPLOYEE' || u.role === 'SENIOR_MANAGER';
    console.log(`- User ID: ${u.userId} | Email: ${u.email} | Role: ${u.role} | Created: ${u.createdAt} | Should have profile: ${shouldHaveProfile ? 'YES' : 'NO'}`);

    if (shouldHaveProfile) {
      if (repair) {
        console.log(`  -> Repairing: Creating employee profile for ${u.email}...`);
        const userDoc = await User.findById(u.userId);
        if (userDoc) {
          try {
            const newEmp = await Employee.create({
              employeeCode: userDoc.employeeId || `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
              userId: userDoc._id.toString(),
              firstName: userDoc.firstName,
              lastName: userDoc.lastName,
              email: userDoc.email,
              phone: userDoc.phone || '9999999999',
              departmentId: defaultDept._id.toString(),
              designationId: defaultDesg._id.toString(),
              joiningDate: new Date(),
              workLocation: userDoc.department === 'Operations' ? 'OFFICE' : 'HYBRID',
              employmentStatus: EmploymentStatus.ACTIVE,
              employmentType: EmploymentType.FULL_TIME,
              createdBy: userDoc._id.toString()
            });
            console.log(`  -> Successfully created Employee ID: ${newEmp._id} for ${u.email}`);
            repairReport.created++;
          } catch (err: any) {
            console.error(`  -> Failed to create Employee for ${u.email}:`, err.message);
            repairReport.skipped++;
          }
        }
      } else {
        repairReport.skipped++;
      }
    } else {
      repairReport.ignored++;
    }
  }

  console.log(`\n=========================================`);
  console.log(`EMPLOYEE SYNC REPAIR TOOL REPORT`);
  console.log(`=========================================`);
  console.log(`Employees Created: ${repairReport.created}`);
  console.log(`Existing Employees Skipped: ${repairReport.skipped}`);
  console.log(`Invalid Users Ignored: ${repairReport.ignored}`);

  await mongoose.disconnect();
}

const runRepair = process.argv.includes('--repair');
runAudit(runRepair).catch(console.error);
