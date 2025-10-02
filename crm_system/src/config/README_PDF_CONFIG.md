# PDF 模板配置文檔

## 📄 概述

這個配置文件用於控制二維碼 PDF 導出的樣式和內容。通過修改配置文件，你可以輕鬆調整 PDF 的外觀而無需修改核心代碼。

## 📁 文件位置

配置文件位於：`src/config/pdfTemplateConfig.ts`

## 🎨 配置項說明

### 1. 頁面設置 (`page`)

控制 PDF 頁面的基本屬性：

```typescript
page: {
  width: '794px',              // A4 寬度（像素）
  height: '1123px',            // A4 高度（像素）
  padding: '60px',             // 頁面內邊距
  backgroundColor: 'white',    // 背景顏色
}
```

### 2. 字體設置 (`fonts`)

#### 字體家族
```typescript
family: 'Arial, "Microsoft JhengHei", "微軟正黑體", sans-serif'
```

#### 標題字體 (`title`)
```typescript
title: {
  size: '48px',              // 字體大小
  weight: 'bold',            // 字體粗細
  color: '#333',             // 字體顏色
  marginBottom: '20px',      // 下邊距
}
```

#### 副標題字體 (`subtitle`)
```typescript
subtitle: {
  size: '24px',              // 字體大小
  weight: 'normal',          // 字體粗細
  color: '#666',             // 字體顏色
  lineHeight: '1.6',         // 行高
  marginBottom: '30px',      // 下邊距
}
```

#### 產品描述字體 (`product`)
```typescript
product: {
  size: '32px',              // 字體大小
  weight: 'normal',          // 字體粗細
  color: '#333',             // 字體顏色
}
```

### 3. 二維碼設置 (`qrCode`)

```typescript
qrCode: {
  width: '520px',            // 二維碼寬度
  height: '520px',           // 二維碼高度
  marginBottom: '40px',      // 下邊距
}
```

### 4. 文字內容 (`content`)

```typescript
content: {
  subtitles: [               // 副標題文字數組
    '歡迎使用自助落單會自動計算',
    '落單前請先掃二維碼'
  ],
  productPrefix: '產品：',   // 產品描述前綴
}
```

## 📝 當前 PDF 佈局

```
┌─────────────────────────────┐
│                             │
│      [校區標題]             │
│                             │
│  歡迎使用自助落單會自動計算  │
│    落單前請先掃二維碼        │
│                             │
│      [二維碼圖片]           │
│                             │
│      產品：[產品描述]        │
│                             │
└─────────────────────────────┘
```

## 🔧 如何修改配置

### 示例 1：修改副標題文字

在 `pdfTemplateConfig.ts` 中找到 `content.subtitles`：

```typescript
content: {
  subtitles: [
    '您的自定義文字第一行',
    '您的自定義文字第二行',
    '可以添加更多行...'
  ],
  productPrefix: '產品：',
}
```

### 示例 2：調整字體大小

```typescript
fonts: {
  title: {
    size: '56px',  // 增大標題
    // ... 其他設置
  },
  subtitle: {
    size: '28px',  // 增大副標題
    // ... 其他設置
  },
}
```

### 示例 3：調整二維碼大小

```typescript
qrCode: {
  width: '600px',   // 放大二維碼
  height: '600px',
  marginBottom: '50px',
}
```

## 🎯 預設配置

系統提供兩種預設配置：

### 1. `default` - 默認配置
- 標題：48px
- 副標題：24px
- 二維碼：520x520px
- 適合標準打印

### 2. `compact` - 緊湊配置
- 標題：40px
- 副標題：20px
- 二維碼：450x450px
- 適合節省紙張

## 🔄 切換配置

在 `page.tsx` 中修改配置類型：

```typescript
// 使用默認配置
const config = getPDFConfig('default');

// 或使用緊湊配置
const config = getPDFConfig('compact');
```

## ⚠️ 注意事項

1. **像素單位**：所有尺寸使用像素 (px) 單位
2. **顏色格式**：使用十六進制顏色碼（如 `#333`）
3. **字體支持**：確保使用的字體支持中文
4. **A4 尺寸**：建議保持頁面尺寸為 794x1123px（A4 at 96 DPI）

## 🚀 快速測試

修改配置後：
1. 保存文件
2. 頁面會自動熱重載
3. 生成新的二維碼 PDF 查看效果

## 📞 支持

如需添加新的配置項或有任何問題，請查看 `pdfTemplateConfig.ts` 文件中的註釋。
