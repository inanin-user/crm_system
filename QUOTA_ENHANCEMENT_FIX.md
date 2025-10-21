# Quota 功能增強修復說明

## 修復時間
2025年10月21日

## 問題描述與修復

### 問題 1：按鈕禁用邏輯錯誤

**原始問題**：
- 當輸入的數字與當前quota相同時，按鈕會被禁用
- 例如：會員有3個quota，輸入3時按鈕變灰，無法更新

**根本原因**：
```javascript
// 錯誤的禁用條件
disabled={isUpdatingQuota || newQuota === selectedMember.quota.toString()}
```

**修復方案**：
```javascript
// 修復後的禁用條件
disabled={isUpdatingQuota || !newQuota || newQuota === '0'}
```

**修復效果**：
- ✅ 現在可以輸入與當前quota相同的數字
- ✅ 只有在空值或輸入0時按鈕才會被禁用
- ✅ 支持所有有效的數字輸入

### 問題 2：不支持減少配額

**新增需求**：
- 支持負數輸入來減少配額
- 例如：有5個quota，輸入-2，結果變為3個quota

**實現方案**：

#### 前端修改
1. **移除input的min="0"限制**：
```javascript
// 修復前
<input type="number" min="0" ... />

// 修復後  
<input type="number" ... />  // 允許負數輸入
```

2. **更新驗證邏輯**：
```javascript
// 修復前
if (isNaN(quotaValue) || quotaValue < 0) {
  setError('請輸入有效的配额数值（不能为负数）');
  return;
}

// 修復後
if (isNaN(quotaValue)) {
  setError('請輸入有效的數字');
  return;
}

// 檢查減少配額後是否會變為負數
if (quotaValue < 0 && Math.abs(quotaValue) > selectedMember.quota) {
  setError(`無法減少 ${Math.abs(quotaValue)} 個配額，當前只有 ${selectedMember.quota} 個配額`);
  return;
}
```

3. **更新成功消息**：
```javascript
const operation = quotaValue >= 0 ? '增加' : '減少';
const amount = Math.abs(quotaValue);
setSuccessMessage(`配额${operation}成功！${operation}了 ${amount} 個配額，當前剩餘配額: ${result.data.quota}`);
```

#### 後端API修改

**文件**：`/crm_system/src/app/api/accounts/[id]/quota/route.ts`

1. **移除非負數限制**：
```javascript
// 修復前
if (typeof quota !== 'number' || quota < 0) {
  return NextResponse.json({
    success: false,
    message: '配额必须是非负数'
  }, { status: 400 });
}

// 修復後
if (typeof quota !== 'number') {
  return NextResponse.json({
    success: false,
    message: '配额必须是数字'
  }, { status: 400 });
}
```

2. **重新設計配額計算邏輯**：
```javascript
// 修復後的完整邏輯
const currentQuota = account.quota || 0;
const newTotalQuota = currentQuota + quota;

// 檢查配額是否會變為負數
if (newTotalQuota < 0) {
  return NextResponse.json({
    success: false,
    message: `無法減少 ${Math.abs(quota)} 個配額，當前只有 ${currentQuota} 個配額`
  }, { status: 400 });
}

// 分別處理增加和減少
let newAddedTickets = currentAddedTickets;
let newUsedTickets = currentUsedTickets;

if (quota > 0) {
  // 增加配額：更新 addedTickets
  newAddedTickets = currentAddedTickets + quota;
} else if (quota < 0) {
  // 減少配額：更新 usedTickets
  newUsedTickets = currentUsedTickets + Math.abs(quota);
}
```

3. **更新數據庫操作**：
```javascript
const updatedAccount = await Account.findByIdAndUpdate(
  id,
  {
    $set: {
      quota: newTotalQuota,
      addedTickets: newAddedTickets,
      usedTickets: newUsedTickets,  // 新增：同時更新已使用套票
      renewalCount: (account.renewalCount || 0) + 1
    }
  },
  {
    new: true,
    runValidators: true
  }
);
```

### 問題 3：placeholder文字不清晰

**修復前**：
```
placeholder="輸入新的配額數量"
```

**修復後**：
```
placeholder="輸入數字添加配額，"-"號減少配額"
```

---

## 功能演示

### 場景 1：增加配額
1. **當前狀態**：會員有3個quota
2. **操作**：輸入 `5`
3. **結果**：quota變為8個
4. **消息**：「配额增加成功！增加了 5 個配額，當前剩餘配額: 8」

### 場景 2：減少配額
1. **當前狀態**：會員有8個quota
2. **操作**：輸入 `-3`
3. **結果**：quota變為5個
4. **消息**：「配额減少成功！減少了 3 個配額，當前剩餘配額: 5」

### 場景 3：相同數字添加
1. **當前狀態**：會員有3個quota
2. **操作**：輸入 `3`
3. **結果**：quota變為6個
4. **按鈕狀態**：✅ 正常可點擊（修復前會被禁用）

### 場景 4：減少配額超出限制
1. **當前狀態**：會員有3個quota
2. **操作**：輸入 `-5`
3. **結果**：❌ 顯示錯誤
4. **錯誤消息**：「無法減少 5 個配額，當前只有 3 個配額」

---

## 數據庫字段更新邏輯

### 增加配額時（正數）
```
quota = 當前quota + 輸入值
addedTickets = 當前addedTickets + 輸入值
usedTickets = 保持不變
renewalCount = 當前renewalCount + 1
```

### 減少配額時（負數）
```
quota = 當前quota + 輸入值（輸入值為負數）
addedTickets = 保持不變
usedTickets = 當前usedTickets + |輸入值|
renewalCount = 當前renewalCount + 1
```

### 示例計算

**初始狀態**：
- quota: 10
- addedTickets: 15
- usedTickets: 5
- renewalCount: 2

**操作1：增加3個配額**
- 輸入：`3`
- 結果：quota=13, addedTickets=18, usedTickets=5, renewalCount=3

**操作2：減少2個配額**
- 輸入：`-2`
- 結果：quota=11, addedTickets=18, usedTickets=7, renewalCount=4

---

## 安全性保障

### 1. 前端驗證
- ✅ 檢查輸入是否為有效數字
- ✅ 檢查減少配額是否會導致負數
- ✅ 提供清晰的錯誤提示

### 2. 後端驗證
- ✅ 雙重檢查配額不會變為負數
- ✅ 驗證輸入數據類型
- ✅ 原子性數據庫操作

### 3. 數據一致性
- ✅ 同時更新所有相關字段
- ✅ 使用事務性更新操作
- ✅ 清除相關緩存

---

## 用戶界面改進

### 1. 輸入提示
- ✅ 清晰的placeholder說明正負數用法
- ✅ 實時的錯誤提示
- ✅ 成功操作的詳細反饋

### 2. 按鈕狀態
- ✅ 只在必要時禁用按鈕
- ✅ 支持所有有效輸入
- ✅ 清晰的加載狀態

### 3. 反饋消息
- ✅ 區分增加和減少操作
- ✅ 顯示具體的變更數量
- ✅ 顯示最終的配額結果

---

## 測試建議

### 基本功能測試
1. **正數輸入**：輸入5，驗證配額增加
2. **負數輸入**：輸入-3，驗證配額減少
3. **相同數字**：輸入與當前配額相同的數字
4. **零值輸入**：輸入0，驗證按鈕禁用

### 邊界測試
1. **減少超限**：輸入超過當前配額的負數
2. **極大數值**：輸入很大的正數或負數
3. **小數輸入**：輸入小數，驗證處理
4. **非數字輸入**：輸入字母或特殊字符

### 數據一致性測試
1. **多次操作**：連續進行增加和減少操作
2. **頁面刷新**：操作後刷新頁面驗證數據
3. **多頁面同步**：在不同頁面查看配額一致性

---

## 相關文件

### 修改的文件
1. `/crm_system/src/app/member_management/profile/page.tsx`
   - 修復按鈕禁用邏輯
   - 支持負數輸入
   - 更新placeholder文字
   - 改進成功消息

2. `/crm_system/src/app/api/accounts/[id]/quota/route.ts`
   - 移除非負數限制
   - 重新設計配額計算邏輯
   - 支持減少配額操作
   - 更新數據庫字段

### 未修改但相關的文件
- `/crm_system/src/models/Account.ts` - 數據模型（已支持所需字段）
- `/crm_system/src/app/member_management/my_profile/page.tsx` - 會員個人資料頁面
- `/crm_system/src/app/account_management/member/page.tsx` - 管理員會員管理頁面

---

## 向後兼容性

### ✅ 完全兼容
- 現有的正數輸入功能完全不變
- 數據庫結構無變更
- API接口保持兼容
- 其他功能不受影響

### ✅ 數據安全
- 所有現有配額數據保持不變
- 新功能不會影響歷史記錄
- 配額永遠不會意外變為負數

---

## 總結

本次修復和增強完成了以下改進：

1. **✅ 修復按鈕禁用問題**：現在可以輸入與當前配額相同的數字
2. **✅ 新增負數支持**：可以使用負數來減少配額
3. **✅ 改進用戶界面**：更清晰的提示和反饋
4. **✅ 增強安全性**：防止配額變為負數
5. **✅ 保持數據一致性**：正確更新所有相關字段

現在管理員可以更靈活地管理會員配額，既可以增加也可以減少，操作更加直觀和安全。

---

**修復完成時間**：2025年10月21日  
**功能狀態**：已完成並可投入使用  
**測試狀態**：建議進行完整測試後部署
