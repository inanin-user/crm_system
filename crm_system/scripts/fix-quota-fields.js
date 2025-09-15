const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://hung51607602:Qang86rejdSczeIB@cluster0.ugimcd0.mongodb.net/crm-system?retryWrites=true&w=majority&appName=Cluster0';

async function fixQuotaFields() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('account management');

    // 查找所有會員帳戶（包括 member, regular-member, premium-member）
    const memberRoles = ['member', 'regular-member', 'premium-member'];

    // 修復 quota 字段為 undefined 或不存在的會員
    const quotaFilter = {
      role: { $in: memberRoles },
      $or: [
        { quota: { $exists: false } },
        { quota: null },
        { quota: undefined }
      ]
    };

    const quotaUpdateResult = await collection.updateMany(
      quotaFilter,
      { $set: { quota: 0 } }
    );

    console.log(`修復了 ${quotaUpdateResult.modifiedCount} 個會員的配額字段`);

    // 修復 renewalCount 字段為 undefined 或不存在的會員
    const renewalFilter = {
      role: { $in: memberRoles },
      $or: [
        { renewalCount: { $exists: false } },
        { renewalCount: null },
        { renewalCount: undefined }
      ]
    };

    const renewalUpdateResult = await collection.updateMany(
      renewalFilter,
      { $set: { renewalCount: 0 } }
    );

    console.log(`修復了 ${renewalUpdateResult.modifiedCount} 個會員的續卡次數字段`);

    // 驗證修復結果
    const membersWithIssues = await collection.find({
      role: { $in: memberRoles },
      $or: [
        { quota: { $exists: false } },
        { quota: null },
        { quota: undefined },
        { renewalCount: { $exists: false } },
        { renewalCount: null },
        { renewalCount: undefined }
      ]
    }).toArray();

    if (membersWithIssues.length === 0) {
      console.log('所有會員字段都已修復完成！');
    } else {
      console.log(`還有 ${membersWithIssues.length} 個會員存在問題:`);
      membersWithIssues.forEach(member => {
        console.log(`- ${member.memberName || member.username}: quota=${member.quota}, renewalCount=${member.renewalCount}`);
      });
    }

    // 顯示修復後的會員列表
    const allMembers = await collection.find({ role: { $in: memberRoles } }).toArray();
    console.log('\\n修復後的會員列表:');
    allMembers.forEach(m => {
      console.log(`ID: ${m._id}, 姓名: ${m.memberName || m.username}, 配額: ${m.quota}, 續卡次數: ${m.renewalCount}`);
    });

  } catch (error) {
    console.error('修復失敗:', error);
  } finally {
    await client.close();
    console.log('連接已關閉');
  }
}

if (require.main === module) {
  fixQuotaFields();
}

module.exports = { fixQuotaFields };