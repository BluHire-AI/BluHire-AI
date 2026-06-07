import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from '../../models/User';
import Employee, { EmploymentStatus, EmploymentType } from '../../models/Employee';
import Department from '../../models/Department';
import Designation from '../../models/Designation';
import Shift from '../../models/Shift';
import Holiday from '../../models/Holiday';
import Leave, { LeaveType, LeaveStatus } from '../../models/Leave';
import Attendance, { AttendanceStatus } from '../../models/Attendance';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bluhire';

const DEPARTMENTS = [
  { name: 'Engineering', description: 'Core product engineers and QA' },
  { name: 'Human Resources', description: 'People operations and recruiting' },
  { name: 'Sales & Marketing', description: 'Growth and branding' },
  { name: 'Operations', description: 'Facilities and daily ops' },
  { name: 'Finance', description: 'Accounting and payroll' },
];

const DESIGNATIONS_BY_DEPT: Record<string, Array<{ title: string, level: number }>> = {
  'Engineering': [
    { title: 'Engineering Director', level: 1 },
    { title: 'Engineering Manager', level: 2 },
    { title: 'Senior Software Engineer', level: 3 },
    { title: 'Software Engineer', level: 4 },
    { title: 'QA Engineer', level: 4 },
  ],
  'Human Resources': [
    { title: 'HR Manager', level: 2 },
    { title: 'HR Specialist', level: 4 },
  ],
  'Sales & Marketing': [
    { title: 'Sales Manager', level: 2 },
    { title: 'Sales Executive', level: 4 },
  ],
  'Operations': [
    { title: 'Operations Specialist', level: 4 },
  ],
  'Finance': [
    { title: 'Financial Analyst', level: 3 },
  ],
};

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  // Clean old attendance, leaves, shifts, holidays
  console.log('Cleaning old attendance module data...');
  await Promise.all([
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Shift.deleteMany({}),
    Holiday.deleteMany({}),
  ]);

  // Clean Employees and Users that are NOT our main admin accounts
  const preservedEmails = [
    'maddilamadhuri10@gmail.com',
    'ravimaddila@gmail.com',
    'alex.admin@bluhire.com',
    'jane.recruiter@bluhire.com'
  ];

  console.log('Cleaning non-essential Users and Employees...');
  const userDeletionResult = await User.deleteMany({ email: { $nin: preservedEmails } });
  console.log(`Deleted ${userDeletionResult.deletedCount} non-essential Users.`);

  // Find users that were preserved
  const adminUser = await User.findOne({ email: 'maddilamadhuri10@gmail.com' });
  const adminUserId = adminUser ? adminUser._id.toString() : new mongoose.Types.ObjectId().toString();

  // Clear all employees except ones linked to preserved emails
  const employeeDeletionResult = await Employee.deleteMany({ email: { $nin: preservedEmails } });
  console.log(`Deleted ${employeeDeletionResult.deletedCount} Employees.`);

  // Create Departments & Designations if they don't exist
  const deptMap: Record<string, any> = {};
  const desgMap: Record<string, any> = {};

  for (const d of DEPARTMENTS) {
    let deptDoc = await Department.findOne({ name: d.name });
    if (!deptDoc) {
      deptDoc = await Department.create(d);
    }
    deptMap[d.name] = deptDoc;

    // Seed designations for this department
    const desList = DESIGNATIONS_BY_DEPT[d.name] || [];
    for (const des of desList) {
      let desgDoc = await Designation.findOne({ title: des.title, departmentId: deptDoc._id });
      if (!desgDoc) {
        desgDoc = await Designation.create({
          title: des.title,
          description: `${des.title} in ${d.name} department`,
          level: des.level,
          departmentId: deptDoc._id,
        });
      }
      desgMap[`${d.name}_${des.title}`] = desgDoc;
    }
  }

  // Seed Shifts
  console.log('Seeding Shifts...');
  const morningShift: any = await Shift.create({
    name: 'Morning Shift',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMinutes: 15,
    workingHoursPerDay: 8,
    isFlexible: false,
  });

  const nightShift: any = await Shift.create({
    name: 'Night Shift',
    startTime: '20:00',
    endTime: '05:00',
    gracePeriodMinutes: 15,
    workingHoursPerDay: 8,
    isFlexible: false,
  });

  const flexibleShift: any = await Shift.create({
    name: 'Flexible Shift',
    startTime: '00:00',
    endTime: '23:59',
    gracePeriodMinutes: 0,
    workingHoursPerDay: 8,
    isFlexible: true,
  });

  // Seed 15 Employees
  console.log('Seeding 15 Employees & Users...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password', salt);

  const employeeSpecs = [
    { email: 'director.eng@bluhire.com', first: 'Arthur', last: 'Pendragon', dept: 'Engineering', desg: 'Engineering Director', shift: morningShift, code: 'EMP-ENG-001', role: 'SENIOR_MANAGER' },
    { email: 'manager.eng@bluhire.com', first: 'Guinevere', last: 'LeFay', dept: 'Engineering', desg: 'Engineering Manager', shift: morningShift, code: 'EMP-ENG-002', role: 'SENIOR_MANAGER', managerCode: 'EMP-ENG-001' },
    { email: 'dev1.eng@bluhire.com', first: 'Lancelot', last: 'DuLac', dept: 'Engineering', desg: 'Senior Software Engineer', shift: morningShift, code: 'EMP-ENG-003', role: 'EMPLOYEE', managerCode: 'EMP-ENG-002' },
    { email: 'dev2.eng@bluhire.com', first: 'Gawain', last: 'Orkney', dept: 'Engineering', desg: 'Software Engineer', shift: morningShift, code: 'EMP-ENG-004', role: 'EMPLOYEE', managerCode: 'EMP-ENG-002' },
    { email: 'dev3.eng@bluhire.com', first: 'Galahad', last: 'Pure', dept: 'Engineering', desg: 'Software Engineer', shift: flexibleShift, code: 'EMP-ENG-005', role: 'EMPLOYEE', managerCode: 'EMP-ENG-002' },
    { email: 'qa.eng@bluhire.com', first: 'Bors', last: 'deGanis', dept: 'Engineering', desg: 'QA Engineer', shift: morningShift, code: 'EMP-ENG-006', role: 'EMPLOYEE', managerCode: 'EMP-ENG-002' },
    
    { email: 'manager.hr@bluhire.com', first: 'Morgana', last: 'LeFay', dept: 'Human Resources', desg: 'HR Manager', shift: morningShift, code: 'EMP-HR-001', role: 'SENIOR_MANAGER' },
    { email: 'spec.hr@bluhire.com', first: 'Merlin', last: 'Ambrosius', dept: 'Human Resources', desg: 'HR Specialist', shift: morningShift, code: 'EMP-HR-002', role: 'EMPLOYEE', managerCode: 'EMP-HR-001' },
    
    { email: 'manager.sales@bluhire.com', first: 'Kay', last: 'Ector', dept: 'Sales & Marketing', desg: 'Sales Manager', shift: morningShift, code: 'EMP-SAL-001', role: 'SENIOR_MANAGER' },
    { email: 'exec1.sales@bluhire.com', first: 'Bedivere', last: 'Lucan', dept: 'Sales & Marketing', desg: 'Sales Executive', shift: morningShift, code: 'EMP-SAL-002', role: 'EMPLOYEE', managerCode: 'EMP-SAL-001' },
    { email: 'exec2.sales@bluhire.com', first: 'Tristan', last: 'Lyonesse', dept: 'Sales & Marketing', desg: 'Sales Executive', shift: nightShift, code: 'EMP-SAL-003', role: 'EMPLOYEE', managerCode: 'EMP-SAL-001' },
    
    { email: 'ops.spec1@bluhire.com', first: 'Percival', last: 'Pelles', dept: 'Operations', desg: 'Operations Specialist', shift: morningShift, code: 'EMP-OPS-001', role: 'EMPLOYEE' },
    { email: 'ops.spec2@bluhire.com', first: 'Lamorak', last: 'Pellinore', dept: 'Operations', desg: 'Operations Specialist', shift: morningShift, code: 'EMP-OPS-002', role: 'EMPLOYEE' },
    
    { email: 'fin.analyst1@bluhire.com', first: 'Gareth', last: 'Orkney', dept: 'Finance', desg: 'Financial Analyst', shift: morningShift, code: 'EMP-FIN-001', role: 'EMPLOYEE' },
    { email: 'fin.analyst2@bluhire.com', first: 'Gaheris', last: 'Orkney', dept: 'Finance', desg: 'Financial Analyst', shift: morningShift, code: 'EMP-FIN-002', role: 'EMPLOYEE' },
  ];

  const createdEmployees: any[] = [];
  const empMapByCode: Record<string, any> = {};

  for (const spec of employeeSpecs) {
    // 1. Create User
    const user = await User.create({
      firstName: spec.first,
      lastName: spec.last,
      email: spec.email,
      employeeId: spec.code,
      role: spec.role as any,
      passwordHash,
      isActive: true,
      department: spec.dept,
      designation: spec.desg,
    });

    const desgKey = `${spec.dept}_${spec.desg}`;

    // 2. Create Employee Profile
    const emp = await Employee.create({
      employeeCode: spec.code,
      userId: user._id.toString(),
      firstName: spec.first,
      lastName: spec.last,
      email: spec.email,
      phone: '9876543210',
      gender: 'MALE',
      departmentId: (deptMap[spec.dept] as any)._id.toString(),
      designationId: (desgMap[desgKey] as any)._id.toString(),
      employmentType: EmploymentType.FULL_TIME,
      joiningDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      workLocation: spec.dept === 'Operations' ? 'OFFICE' : 'HYBRID',
      shiftId: (spec.shift as any)._id.toString(),
      employmentStatus: EmploymentStatus.ACTIVE,
      createdBy: adminUserId,
    });

    createdEmployees.push(emp);
    empMapByCode[spec.code] = emp;
  }

  // Establish reporting managers
  console.log('Setting up reporting hierarchy managers...');
  for (const spec of employeeSpecs) {
    if (spec.managerCode) {
      const emp = empMapByCode[spec.code];
      const manager = empMapByCode[spec.managerCode];
      if (emp && manager) {
        emp.managerId = manager._id.toString();
        await emp.save();
      }
    }
  }

  // Seed Holidays
  console.log('Seeding Holidays...');
  const currentYear = new Date().getFullYear();
  const holidaysData = [
    { name: 'New Year Day', date: new Date(`${currentYear}-01-01`), description: 'Holiday for New Year celebration', isOptional: false },
    { name: 'Republic Day', date: new Date(`${currentYear}-01-26`), description: 'National Republic Day', isOptional: false },
    { name: 'Independence Day', date: new Date(`${currentYear}-08-15`), description: 'National Independence Day', isOptional: false },
    { name: 'Gandhi Jayanti', date: new Date(`${currentYear}-10-02`), description: 'Mahatma Gandhi Birthday', isOptional: false },
    { name: 'Dussehra', date: new Date(`${currentYear}-10-22`), description: 'Dussehra festival', isOptional: false },
    { name: 'Diwali', date: new Date(`${currentYear}-11-12`), description: 'Festival of lights', isOptional: false },
    { name: 'Christmas Day', date: new Date(`${currentYear}-12-25`), description: 'Christmas festival celebration', isOptional: false },
    { name: 'BluHire Foundation Day', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), description: 'Corporate celebration day', isOptional: true },
  ];
  const seededHolidays = await Holiday.insertMany(holidaysData);
  console.log(`Seeded ${seededHolidays.length} Holidays.`);

  // Seed Leave Requests
  console.log('Seeding Leave Requests...');
  const leavesToSeed: any[] = [];
  const holidayDates = holidaysData.map(h => h.date.toDateString());

  const days: Date[] = [];
  for (let i = 60; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  for (let i = 2; i < createdEmployees.length; i += 3) {
    const emp = createdEmployees[i];
    const approvedLeaveStart = new Date(days[20]);
    const approvedLeaveEnd = new Date(days[21]);
    leavesToSeed.push({
      employeeId: emp._id.toString(),
      leaveType: LeaveType.SICK,
      startDate: approvedLeaveStart,
      endDate: approvedLeaveEnd,
      reason: 'Recovering from flu',
      status: LeaveStatus.APPROVED,
      approvedBy: adminUserId,
      approvedAt: approvedLeaveStart,
    });

    const pendingLeaveStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const pendingLeaveEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    leavesToSeed.push({
      employeeId: emp._id.toString(),
      leaveType: LeaveType.CASUAL,
      startDate: pendingLeaveStart,
      endDate: pendingLeaveEnd,
      reason: 'Personal family matters',
      status: LeaveStatus.PENDING,
    });

    const rejectedLeaveStart = new Date(days[10]);
    const rejectedLeaveEnd = new Date(days[10]);
    leavesToSeed.push({
      employeeId: emp._id.toString(),
      leaveType: LeaveType.ANNUAL,
      startDate: rejectedLeaveStart,
      endDate: rejectedLeaveEnd,
      reason: 'Extended vacation request',
      status: LeaveStatus.REJECTED,
      approvedBy: adminUserId,
      approvedAt: rejectedLeaveStart,
    });
  }

  const seededLeaves = await Leave.insertMany(leavesToSeed);
  console.log(`Seeded ${seededLeaves.length} Leaves.`);

  const isEmployeeOnApprovedLeave = (employeeId: string, date: Date) => {
    const time = date.getTime();
    return leavesToSeed.some(l => 
      l.employeeId === employeeId && 
      l.status === LeaveStatus.APPROVED && 
      time >= new Date(l.startDate).getTime() && 
      time <= new Date(l.endDate).getTime()
    );
  };

  // Seed 60 Days Attendance Records
  console.log('Seeding 60 Days of Attendance Records...');
  const attendanceRecords: any[] = [];

  for (const day of days) {
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDates.includes(day.toDateString());

    for (const emp of createdEmployees) {
      const shiftSpec = employeeSpecs.find(s => s.code === emp.employeeCode);
      const isNight = shiftSpec?.shift === nightShift;
      const isFlex = shiftSpec?.shift === flexibleShift;

      if (isEmployeeOnApprovedLeave(emp._id.toString(), day)) {
        continue;
      }

      if (isWeekend && !isFlex) {
        continue;
      }

      const rand = Math.random();

      if (isHoliday) {
        attendanceRecords.push({
          employeeId: emp._id.toString(),
          date: day,
          attendanceStatus: AttendanceStatus.HOLIDAY,
          remarks: 'Official Holiday',
          createdBy: adminUserId,
        });
        continue;
      }

      if (rand < 0.08) {
        attendanceRecords.push({
          employeeId: emp._id.toString(),
          date: day,
          attendanceStatus: AttendanceStatus.ABSENT,
          remarks: 'Absent without notice',
          createdBy: adminUserId,
        });
        continue;
      }

      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let checkInHour = 9;
      let checkInMin = Math.floor(Math.random() * 20); // 09:00 - 09:20
      let checkOutHour = 18;
      let checkOutMin = Math.floor(Math.random() * 30); // 18:00 - 18:30

      if (isNight) {
        checkInHour = 20;
        checkOutHour = 5;
      }

      if (rand >= 0.08 && rand < 0.22) {
        status = AttendanceStatus.LATE;
        if (isNight) {
          checkInMin = 20 + Math.floor(Math.random() * 20);
        } else {
          checkInMin = 18 + Math.floor(Math.random() * 30);
        }
      }

      if (rand >= 0.22 && rand < 0.35) {
        status = AttendanceStatus.WORK_FROM_HOME;
      }

      if (rand >= 0.35 && rand < 0.40) {
        status = AttendanceStatus.HALF_DAY;
        checkOutHour = isNight ? 0 : 13;
        checkOutMin = 0;
      }

      const checkInTime = new Date(day);
      checkInTime.setHours(checkInHour, checkInMin, Math.floor(Math.random() * 60));

      const checkOutTime = new Date(day);
      if (isNight) {
        checkOutTime.setDate(checkOutTime.getDate() + 1);
      }
      checkOutTime.setHours(checkOutHour, checkOutMin, Math.floor(Math.random() * 60));

      const totalMs = checkOutTime.getTime() - checkInTime.getTime();
      const totalHours = totalMs / (1000 * 60 * 60);
      const workingHours = status === AttendanceStatus.HALF_DAY ? 4 : Math.min(totalHours - 1, 8);
      const overtimeHours = totalHours > 9 ? parseFloat((totalHours - 9).toFixed(2)) : 0;
      const breakDuration = 1.0;

      attendanceRecords.push({
        employeeId: emp._id.toString(),
        date: day,
        checkInTime,
        checkOutTime,
        totalHours: parseFloat(totalHours.toFixed(2)),
        workingHours: parseFloat(workingHours.toFixed(2)),
        overtimeHours,
        breakDuration,
        attendanceStatus: status,
        location: status === AttendanceStatus.WORK_FROM_HOME ? 'Remote' : 'Office',
        ipAddress: '192.168.1.50',
        deviceInfo: 'Chrome Browser / Windows',
        createdBy: adminUserId,
      });
    }
  }

  console.log(`Inserting ${attendanceRecords.length} Attendance Records...`);
  const chunkSize = 200;
  for (let i = 0; i < attendanceRecords.length; i += chunkSize) {
    const chunk = attendanceRecords.slice(i, i + chunkSize);
    await Attendance.insertMany(chunk);
  }

  console.log('Database successfully seeded with realistic attendance records!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
