const { MongoClient } = require('mongodb');

// MongoDB 连接字符串
const CONNECTION_STRING = 'mongodb+srv://hung51607602:Qang86rejdSczeIB@cluster0.ugimcd0.mongodb.net/crm-system?retryWrites=true&w=majority&appName=Cluster0';

async function cleanupNonMemberRecords() {
  const client = new MongoClient(CONNECTION_STRING);

  try {
    console.log('正在连接到 MongoDB...');
    await client.connect();

    const db = client.db();
    const accountsCollection = db.collection('account management');
    const attendanceCollection = db.collection('attendances');

    console.log('开始清理非会员的出席记录...');

    // 1. 获取所有会员信息
    const members = await accountsCollection.find({
      role: { $in: ['member', 'regular-member', 'premium-member'] }
    }).toArray();

    console.log(`找到 ${members.length} 个会员账户`);

    // 2. 创建会员姓名和联系方式的集合
    const memberNames = new Set();
    const memberContacts = new Set();

    members.forEach(member => {
      if (member.memberName) {
        memberNames.add(member.memberName.trim());
      }
      if (member.username) {
        memberNames.add(member.username.trim()); // 也包括用户名
      }
      if (member.phone) {
        memberContacts.add(member.phone.trim());
      }
      if (member.email) {
        memberContacts.add(member.email.trim());
      }
    });

    console.log(`会员姓名数量: ${memberNames.size}`);
    console.log(`会员联系方式数量: ${memberContacts.size}`);

    // 3. 查找所有出席记录
    const allAttendanceRecords = await attendanceCollection.find({}).toArray();
    console.log(`总出席记录数: ${allAttendanceRecords.length}`);

    // 4. 找出非会员的记录
    const nonMemberRecords = [];
    const memberRecords = [];

    allAttendanceRecords.forEach(record => {
      const recordName = record.name ? record.name.trim() : '';
      const recordContact = record.contactInfo ? record.contactInfo.trim() : '';

      // 检查是否为会员（通过姓名或联系方式匹配）
      const isNameMatch = memberNames.has(recordName);
      const isContactMatch = memberContacts.has(recordContact);

      if (isNameMatch || isContactMatch) {
        memberRecords.push(record);
      } else {
        nonMemberRecords.push(record);
      }
    });

    console.log(`会员记录数: ${memberRecords.length}`);
    console.log(`非会员记录数: ${nonMemberRecords.length}`);

    // 5. 显示将被删除的非会员记录详情
    if (nonMemberRecords.length > 0) {
      console.log('\n将被删除的非会员记录:');
      console.log('姓名 | 联系方式 | 地点 | 活动 | 创建时间');
      console.log('-'.repeat(80));

      nonMemberRecords.forEach(record => {
        const createdAt = record.createdAt ? new Date(record.createdAt).toLocaleDateString('zh-CN') : '未知';
        console.log(`${record.name || '无'} | ${record.contactInfo || '无'} | ${record.location || '无'} | ${record.activity || '无'} | ${createdAt}`);
      });

      // 6. 执行删除操作
      console.log(`\n准备删除 ${nonMemberRecords.length} 条非会员记录...`);

      const nonMemberIds = nonMemberRecords.map(record => record._id);
      const deleteResult = await attendanceCollection.deleteMany({
        _id: { $in: nonMemberIds }
      });

      console.log(`成功删除 ${deleteResult.deletedCount} 条非会员记录`);

      // 7. 验证删除结果
      const remainingRecords = await attendanceCollection.countDocuments({});
      console.log(`剩余出席记录数: ${remainingRecords}`);
      console.log(`预期剩余记录数: ${memberRecords.length}`);

      if (remainingRecords === memberRecords.length) {
        console.log('✅ 删除操作成功，记录数量匹配');
      } else {
        console.log('⚠️ 警告：剩余记录数与预期不符');
      }
    } else {
      console.log('✅ 没有发现非会员记录，无需删除');
    }

    // 8. 显示最终统计
    console.log('\n最终统计:');
    console.log(`会员总数: ${members.length}`);
    console.log(`保留的出席记录: ${memberRecords.length}`);
    console.log(`删除的出席记录: ${nonMemberRecords.length}`);

  } catch (error) {
    console.error('清理过程中发生错误:', error);
  } finally {
    await client.close();
    console.log('数据库连接已关闭');
  }
}

// 运行清理
cleanupNonMemberRecords().catch(console.error);