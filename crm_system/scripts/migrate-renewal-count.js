const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://hung51607602:Qang86rejdSczeIB@cluster0.ugimcd0.mongodb.net/crm-system?retryWrites=true&w=majority&appName=Cluster0';

async function migrateRenewalCount() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('account management');

    // 查找所有會員帳戶（包括 member, regular-member, premium-member）
    const memberRoles = ['member', 'regular-member', 'premium-member'];

    // 首先設置所有沒有 renewalCount 字段的會員
    const filter1 = {
      role: { $in: memberRoles },
      renewalCount: { $exists: false }
    };

    const updateResult1 = await collection.updateMany(
      filter1,
      { $set: { renewalCount: 0 } }
    );

    // 然後設置所有 renewalCount 為 null 或 undefined 的會員
    const filter2 = {
      role: { $in: memberRoles },
      $or: [
        { renewalCount: null },
        { renewalCount: { $exists: true, $type: "null" } }
      ]
    };

    const updateResult2 = await collection.updateMany(
      filter2,
      { $set: { renewalCount: 0 } }
    );

    const totalUpdated = updateResult1.modifiedCount + updateResult2.modifiedCount;

    console.log(`成功為 ${totalUpdated} 個會員帳戶初始化續卡次數為 0`);

    // 驗證更新結果
    const totalMembers = await collection.countDocuments({ role: { $in: memberRoles } });
    const membersWithRenewalCount = await collection.countDocuments({
      role: { $in: memberRoles },
      renewalCount: { $exists: true }
    });

    console.log(`總會員數: ${totalMembers}`);
    console.log(`已設置續卡次數的會員數: ${membersWithRenewalCount}`);

  } catch (error) {
    console.error('遷移失敗:', error);
  } finally {
    await client.close();
    console.log('連接已關閉');
  }
}

if (require.main === module) {
  migrateRenewalCount();
}

module.exports = { migrateRenewalCount };