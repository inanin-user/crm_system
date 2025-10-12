/**
 * PDF 模板配置文件
 * 用於控制二維碼PDF導出的樣式和內容
 */

export interface PDFTemplateConfig {
  // 頁面設置
  page: {
    width: string;          // A4 寬度 (px)
    height: string;         // A4 高度 (px)
    padding: string;        // 頁面內邊距
    backgroundColor: string; // 背景顏色
  };

  // 字體設置
  fonts: {
    family: string;         // 字體家族
    title: {
      size: string;         // 標題字體大小
      weight: string;       // 標題字體粗細
      color: string;        // 標題顏色
      marginBottom: string; // 標題下邊距
    };
    subtitle: {
      size: string;         // 副標題字體大小
      weight: string;       // 副標題字體粗細
      color: string;        // 副標題顏色
      lineHeight: string;   // 行高
      marginBottom: string; // 副標題下邊距
    };
    product: {
      size: string;         // 產品描述字體大小
      weight: string;       // 產品描述字體粗細
      color: string;        // 產品描述顏色
    };
    instructions: {
      size: string;         // 使用說明字體大小
      weight: string;       // 使用說明字體粗細
      color: string;        // 使用說明顏色
      marginTop: string;    // 使用說明上邊距
    };
  };

  // 二維碼設置
  qrCode: {
    width: string;          // 二維碼寬度
    height: string;         // 二維碼高度
    marginBottom: string;   // 二維碼下邊距
  };

  // 文字內容
  content: {
    subtitles: string[];    // 副標題文字數組
    productPrefix: string;  // 產品描述前綴
    instructions: string;   // 使用說明文字
  };
}

// 默認配置
export const defaultPDFConfig: PDFTemplateConfig = {
  page: {
    width: '794px',
    height: '1123px',
    padding: '60px',
    backgroundColor: 'white',
  },
  fonts: {
    family: 'Arial, "Microsoft JhengHei", "微軟正黑體", sans-serif',
    title: {
      size: '48px',
      weight: 'bold',
      color: '#333',
      marginBottom: '20px',
    },
    subtitle: {
      size: '24px',
      weight: 'normal',
      color: '#666',
      lineHeight: '1.6',
      marginBottom: '30px',
    },
    product: {
      size: '32px',
      weight: 'normal',
      color: '#333',
    },
    instructions: {
      size: '24px',         // 使用說明字體大小
      weight: 'bold',       // 使用說明字體粗細
      color: '#000',        // 使用說明顏色（黑色）
      marginTop: '20px',    // 使用說明上邊距
    },
  },
  qrCode: {
    width: '520px',
    height: '520px',
    marginBottom: '40px',
  },
  content: {
    subtitles: [
      '自動計算閣下之代幣',
      '落單前請先掃二維碼'
    ],
    productPrefix: '產品：',
    instructions: '1.手機掃QRcode\u00A0\u00A0\u00A02.確認付款\u00A0\u00A0\u00A03.Enjoy',
  },
};

// 可以在這裡添加其他預設配置
export const compactPDFConfig: PDFTemplateConfig = {
  ...defaultPDFConfig,
  fonts: {
    ...defaultPDFConfig.fonts,
    title: {
      ...defaultPDFConfig.fonts.title,
      size: '40px',
    },
    subtitle: {
      ...defaultPDFConfig.fonts.subtitle,
      size: '20px',
    },
  },
  qrCode: {
    width: '450px',
    height: '450px',
    marginBottom: '30px',
  },
};

/**
 * 獲取 PDF 配置
 * @param configType - 配置類型 ('default' | 'compact')
 * @returns PDF 模板配置
 */
export function getPDFConfig(configType: 'default' | 'compact' = 'default'): PDFTemplateConfig {
  switch (configType) {
    case 'compact':
      return compactPDFConfig;
    case 'default':
    default:
      return defaultPDFConfig;
  }
}
