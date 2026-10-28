// Seed Data for วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์...');

  // 1. Create Officials & Users
  const userApplicant = await prisma.user.upsert({
    where: { email: 'vasuphat@thaluang.ac.th' },
    update: {},
    create: {
      name: 'นายวสุภัทร กุลเมือง',
      email: 'vasuphat@thaluang.ac.th',
      passwordHash: 'hashed_password',
      role: 'EMPLOYEE',
      department: 'แผนกวิชาเทคโนโลยีคอมพิวเตอร์',
      phoneNumber: '081-234-5678',
    },
  });

  const inspector = await prisma.user.upsert({
    where: { email: 'watcharapong@thaluang.ac.th' },
    update: {},
    create: {
      name: 'นายวัชรพงศ์ โสภา',
      email: 'watcharapong@thaluang.ac.th',
      passwordHash: 'hashed_password',
      role: 'ADMIN',
      department: 'เจ้าหน้าที่ศูนย์ดิจิทัลและสื่อสารองค์กร',
    },
  });

  const headOfCenter = await prisma.user.upsert({
    where: { email: 'ekkaraj@thaluang.ac.th' },
    update: {},
    create: {
      name: 'นายเอกราช เขียวทอง',
      email: 'ekkaraj@thaluang.ac.th',
      passwordHash: 'hashed_password',
      role: 'ADMIN',
      department: 'หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร',
    },
  });

  const deputyDirector = await prisma.user.upsert({
    where: { email: 'chatree@thaluang.ac.th' },
    update: {},
    create: {
      name: 'นายชาตรี เริงชัยภูมิ',
      email: 'chatree@thaluang.ac.th',
      passwordHash: 'hashed_password',
      role: 'ADMIN',
      department: 'รอง ผอ. ฝ่ายพัฒนายุทธศาสตร์และแผนงาน',
    },
  });

  // 2. Create the 6 College Meeting Rooms
  const roomsData = [
    {
      name: 'หอประชุมศิริสาร',
      roomCode: 'MR-SRS',
      capacity: 300,
      floor: 'ชั้น 1',
      location: 'อาคารเฉลิมพระเกียรติ',
      description: 'หอประชุมใหญ่สำหรับพิธีการ สัมมนา และปฐมนิเทศนักศึกษา',
    },
    {
      name: 'ห้องประชุมสักทอง',
      roomCode: 'MR-STH',
      capacity: 50,
      floor: 'ชั้น 2',
      location: 'อาคารอำนวยการ',
      description: 'ห้องประชุมผู้บริหาร โต๊ะประชุมรูปตัว U พร้อมจอ 4K',
    },
    {
      name: 'ห้องประชุมหน้าห้องผู้อำนวยการ',
      roomCode: 'MR-DIR',
      capacity: 20,
      floor: 'ชั้น 2',
      location: 'อาคารอำนวยการ',
      description: 'ห้องประชุมกลุ่มย่อย ประชุมฝ่ายบริหารและวาระด่วน',
    },
    {
      name: 'ห้องประชุม (กาญจนา)',
      roomCode: 'MR-KJN',
      capacity: 80,
      floor: 'ชั้น 3',
      location: 'อาคารวิทยบริการ',
      description: 'ห้องประชุมอบรมครู สัมมนาเชิงปฏิบัติการ',
    },
    {
      name: 'อาคารโดมอเนกประสงค์',
      roomCode: 'MR-DOME',
      capacity: 500,
      floor: 'ลานกลาง',
      location: 'พื้นที่กลางวิทยาลัย',
      description: 'กิจกรรมกลางแจ้ง งานนิทรรศการ และกีฬานักศึกษา',
    },
    {
      name: 'ห้องคอมพิวเตอร์กลาง (ห้องโสต)',
      roomCode: 'MR-COMP',
      capacity: 40,
      floor: 'ชั้น 4',
      location: 'อาคารปฏิบัติการ',
      description: 'อบรมคอมพิวเตอร์ ทดสอบสมรรถนะวิชาชีพ',
    },
  ];

  for (const r of roomsData) {
    await prisma.room.upsert({
      where: { roomCode: r.roomCode },
      update: r,
      create: r,
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
