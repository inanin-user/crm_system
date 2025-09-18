const { MongoClient } = require('mongodb');

// MongoDB 连接字符串
const CONNECTION_STRING = 'mongodb+srv://hung51607602:Qang86rejdSczeIB@cluster0.ugimcd0.mongodb.net/crm-system?retryWrites=true&w=majority&appName=Cluster0';

async function migrateTicketFields() {
  const client = new MongoClient(CONNECTION_STRING);

  try {
    console.log('正在连接到 MongoDB...');
    await client.connect();

    const db = client.db();
    const accountsCollection = db.collection('account management');

    console.log('开始迁移套票字段...');

    // 查找所有会员账户
    const members = await accountsCollection.find({
      role: { $in: ['member', 'regular-member', 'premium-member'] }
    }).toArray();

    console.log(`找到 ${members.length} 个会员账户需要迁移`);

    let migratedCount = 0;

    for (const member of members) {
      const currentQuota = member.quota || 0;

      // 为现有会员设置新字段
      const updateData = {
        initialTickets: currentQuota, // 将现有配额设为初始套票
        addedTickets: 0,              // 累计添加套票初始为0
        usedTickets: 0                // 已使用套票初始为0
      };

      await accountsCollection.updateOne(
        { _id: member._id },
        { $set: updateData }
      );

      migratedCount++;
      console.log(`已迁移会员: ${member.memberName || member.username} (${migratedCount}/${members.length})`);
    }

    console.log(`\n迁移完成！共处理 ${migratedCount} 个会员账户`);
    console.log('套票字段说明:');
    console.log('- initialTickets: 初始套票次数 (创建时的配额)');
    console.log('- addedTickets: 累计添加套票次数 (续卡时增加的总和)');
    console.log('- usedTickets: 已使用套票次数 (参加活动次数)');
    console.log('- quota: 剩余配额 = initialTickets + addedTickets - usedTickets');

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await client.close();
    console.log('数据库连接已关闭');
  }
}

// 运行迁移
migrateTicketFields().catch(console.error);