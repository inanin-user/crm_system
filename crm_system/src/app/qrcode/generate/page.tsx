'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getPDFConfig } from '@/config/pdfTemplateConfig';

interface QRCodeRecord {
  _id: string;
  qrCodeNumber: string;
  regionCode: string;
  regionName: string;
  productDescription: string;
  price: number;
  qrCodeData: string;
  createdAt: string;
}

export default function QRCodeGeneratePage() {
  const { user } = useAuth();
  const [currentNumber, setCurrentNumber] = useState('0001');
  const [regionCode, setRegionCode] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [customProductDescription, setCustomProductDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [qrCodeHistory, setQRCodeHistory] = useState<QRCodeRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<QRCodeRecord | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [customProducts, setCustomProducts] = useState<string[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // 獲取當前編號
  const fetchCurrentNumber = async () => {
    try {
      const response = await fetch('/api/qrcode/current-number');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentNumber(data.data.currentNumber);
        }
      }
    } catch (error) {
      console.error('獲取當前編號失敗:', error);
    }
  };

  // 獲取歷史記錄
  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('/api/qrcode');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQRCodeHistory(data.data);
        }
      }
    } catch (error) {
      console.error('獲取歷史記錄失敗:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchCurrentNumber();
    // 從 localStorage 讀取自定義產品選項
    const savedProducts = localStorage.getItem('customProducts');
    if (savedProducts) {
      try {
        setCustomProducts(JSON.parse(savedProducts));
      } catch (error) {
        console.error('讀取自定義產品失敗:', error);
      }
    }
  }, []);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProductDropdown && !target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProductDropdown]);

  // 刪除自定義產品選項
  const deleteCustomProduct = (productToDelete: string) => {
    const updatedProducts = customProducts.filter(p => p !== productToDelete);
    setCustomProducts(updatedProducts);
    localStorage.setItem('customProducts', JSON.stringify(updatedProducts));

    // 如果當前選中的是被刪除的選項，則重置選擇
    if (productDescription === productToDelete) {
      setProductDescription('');
    }
  };

  // 添加新的自定義產品選項
  const addCustomProduct = (newProduct: string) => {
    const trimmedProduct = newProduct.trim();
    if (!trimmedProduct) return;

    // 檢查是否已存在（包括預設選項和自定義選項）
    const defaultProducts = ['奶昔', '跳舞'];
    if (defaultProducts.includes(trimmedProduct) || customProducts.includes(trimmedProduct)) {
      return;
    }

    const updatedProducts = [...customProducts, trimmedProduct];
    setCustomProducts(updatedProducts);
    localStorage.setItem('customProducts', JSON.stringify(updatedProducts));
  };

  // 重置表單
  const resetForm = () => {
    setRegionCode('');
    setProductDescription('');
    setCustomProductDescription('');
    setPrice('');
  };

  // 生成二維碼
  const generateQRCode = async () => {
    // 確定最終的產品描述（如果選擇"其他"，使用自定義輸入）
    const finalProductDescription = productDescription === '其他' ? customProductDescription : productDescription;

    // 驗證必填字段
    if (!regionCode) {
      alert('請選擇地區編號');
      return;
    }

    if (!productDescription) {
      alert('請選擇產品描述');
      return;
    }

    // 如果選擇了"其他"，檢查是否有輸入自定義內容
    if (productDescription === '其他' && !customProductDescription.trim()) {
      alert('請輸入自定義的產品描述');
      return;
    }

    if (price === '' || price < 0) {
      alert('請輸入有效的價格（不能為負數）');
      return;
    }

    if (!user) {
      alert('用戶未登錄');
      return;
    }

    try {
      setIsGenerating(true);

      // 調用API創建二維碼記錄
      const response = await fetch('/api/qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regionCode,
          productDescription: finalProductDescription.trim(),
          price: Number(price),
          createdBy: user.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '創建二維碼失敗');
      }

      const data = await response.json();
      if (data.success) {
        // 如果使用了"其他"選項，將新產品添加到自定義列表
        if (productDescription === '其他' && customProductDescription.trim()) {
          addCustomProduct(customProductDescription.trim());
        }

        // 生成二維碼圖片並直接下載PDF
        const qrCodeDataURL = await QRCode.toDataURL(data.data.qrCodeData, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // 直接下載PDF (現在是異步的)
        await downloadPDF(qrCodeDataURL);

        // 更新當前編號
        await fetchCurrentNumber();

        // 重置表單（但保留自定義產品列表）
        resetForm();

        alert('二維碼PDF已下載！');
      }
    } catch (error) {
      console.error('生成二維碼失敗:', error);
      alert('生成二維碼失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsGenerating(false);
    }
  };

  // 獲取校區標題
  const getCampusTitle = (code: string) => {
    const campusTitles: Record<string, string> = {
      'WC': '灣仔校舍',
      'WTS': '黃大仙校舍',
      'SM': '石門校舍'
    };
    return campusTitles[code] || '校區';
  };

  // 下載PDF
  const downloadPDF = async (qrCodeImage: string, record?: QRCodeRecord) => {
    // 獲取當前的地區編號和產品描述
    const currentRegionCode = record ? record.regionCode : regionCode;
    const currentProductDesc = record ? record.productDescription : (productDescription === '其他' ? customProductDescription : productDescription);
    const currentPrice = record ? record.price : (price === '' ? 0 : Number(price));
    const title = getCampusTitle(currentRegionCode);

    // 獲取 PDF 配置
    const config = getPDFConfig('default');

    // 創建臨時的 HTML 容器
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = config.page.width;
    container.style.height = config.page.height;
    container.style.backgroundColor = config.page.backgroundColor;
    container.style.padding = config.page.padding;
    container.style.fontFamily = config.fonts.family;

    // 生成副標題 HTML
    const subtitlesHTML = config.content.subtitles
      .map(text => `<p style="font-size: ${config.fonts.subtitle.size}; font-weight: ${config.fonts.subtitle.weight}; color: ${config.fonts.subtitle.color}; margin: 0; text-align: center; line-height: ${config.fonts.subtitle.lineHeight};">${text}</p>`)
      .join('');

    container.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center;">
        <h1 style="font-size: ${config.fonts.title.size}; font-weight: ${config.fonts.title.weight}; margin: 0 0 ${config.fonts.title.marginBottom}; text-align: center; color: ${config.fonts.title.color};">${title}</h1>
        <div style="margin-bottom: ${config.fonts.subtitle.marginBottom};">
          ${subtitlesHTML}
        </div>
        <div style="width: ${config.qrCode.width}; height: ${config.qrCode.height}; margin: 0 0 ${config.qrCode.marginBottom} 0;">
          <img src="${qrCodeImage}" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <p style="font-size: ${config.fonts.product.size}; font-weight: ${config.fonts.product.weight}; margin: 0; text-align: center; color: ${config.fonts.product.color};">${config.content.productPrefix}${currentProductDesc}</p>
        <p style="font-size: ${config.fonts.product.size}; font-weight: ${config.fonts.product.weight}; margin: 0; text-align: center; color: ${config.fonts.product.color};">價格：$${currentPrice.toFixed(2)}</p>
      </div>
    `;

    document.body.appendChild(container);

    try {
      // 使用 html2canvas 渲染容器
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // 創建 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 將 canvas 轉換為圖片並添加到 PDF
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // 下載PDF
      const filename = record
        ? `QRCode_${record.qrCodeNumber}.pdf`
        : `QRCode_${currentNumber}.pdf`;
      pdf.save(filename);
    } finally {
      // 清理臨時容器
      document.body.removeChild(container);
    }
  };


  // 打印歷史記錄中的二維碼
  const printHistoryQRCode = async (record: QRCodeRecord) => {
    try {
      // 重新生成二維碼圖片
      const qrCodeDataURL = await QRCode.toDataURL(record.qrCodeData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      downloadPDF(qrCodeDataURL, record);
    } catch (error) {
      console.error('生成歷史二維碼失敗:', error);
      alert('生成二維碼失敗');
    }
  };

  // 獲取地區中文名
  const getRegionName = (code: string) => {
    const regionNames: Record<string, string> = {
      'WC': '灣仔',
      'WTS': '黃大仙',
      'SM': '石門'
    };
    return regionNames[code] || code;
  };

  // 顯示歷史記錄詳情
  const showRecordDetail = async (record: QRCodeRecord) => {
    console.log('點擊記錄:', record.qrCodeNumber);
    setSelectedRecord(record);
  };

  // 認證檢查 - 讓 AuthContext 處理重定向
  if (!user) {
    return null; // AuthContext 會自動重定向到登錄頁面
  }

  // 權限檢查
  if (!['admin'].includes(user.role)) {
    return null; // AuthContext 會自動重定向到 unauthorized 頁面
  }

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        {/* 頁面標題和搜尋按鈕 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">二維碼生成</h1>
          </div>

          <button
            onClick={() => {
              setShowHistory(true);
              fetchHistory();
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            搜尋歷史
          </button>
        </div>

        {/* 生成表單 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">二維碼資訊</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 編號 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                編號
              </label>
              <input
                type="text"
                value={currentNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            {/* 地區編號 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地區編號 <span className="text-red-500">*</span>
              </label>
              <select
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">請選擇地區</option>
                <option value="WC">WC-灣仔</option>
                <option value="WTS">WTS-黃大仙</option>
                <option value="SM">SM-石門</option>
              </select>
            </div>

            {/* 產品描述 */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                產品描述 <span className="text-red-500">*</span>
              </label>
              <div className="relative product-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white flex items-center justify-between"
                >
                  <span className={productDescription ? 'text-gray-900' : 'text-gray-500'}>
                    {productDescription || '請選擇產品'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showProductDropdown ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showProductDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-500"
                      onClick={() => {
                        setProductDescription('');
                        setCustomProductDescription('');
                        setShowProductDropdown(false);
                      }}
                    >
                      請選擇產品
                    </div>
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setProductDescription('奶昔');
                        setCustomProductDescription('');
                        setShowProductDropdown(false);
                      }}
                    >
                      奶昔
                    </div>
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setProductDescription('跳舞');
                        setCustomProductDescription('');
                        setShowProductDropdown(false);
                      }}
                    >
                      跳舞
                    </div>
                    {customProducts.map((product) => (
                      <div
                        key={product}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
                      >
                        <span
                          onClick={() => {
                            setProductDescription(product);
                            setCustomProductDescription('');
                            setShowProductDropdown(false);
                          }}
                          className="flex-1"
                        >
                          {product}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomProduct(product);
                          }}
                          className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-100 transition-colors ml-2"
                          title="刪除此選項"
                        >
                          <svg
                            className="w-3.5 h-3.5 text-gray-400 hover:text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                      onClick={() => {
                        setProductDescription('其他');
                        setShowProductDropdown(false);
                      }}
                    >
                      其他
                    </div>
                  </div>
                )}
              </div>
              {productDescription === '其他' && (
                <input
                  type="text"
                  value={customProductDescription}
                  onChange={(e) => setCustomProductDescription(e.target.value)}
                  placeholder="請輸入產品描述"
                  className="w-full px-3 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* 價格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                價格 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                step="0.01"
                placeholder="請輸入價格"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* 生成按鈕 */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={resetForm}
              className="px-6 py-2 rounded-lg font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
            >
              重置
            </button>
            <button
              onClick={generateQRCode}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isGenerating
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isGenerating ? '生成中...' : '生成二維碼'}
            </button>
          </div>
        </div>
      </div>


      {/* 歷史記錄模態框 */}
      {showHistory && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-40 flex items-start justify-center pt-16 bg-white"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">二維碼歷史記錄</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">加載中...</p>
                </div>
              ) : qrCodeHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">暫無歷史記錄</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {qrCodeHistory.map((record) => (
                    <div
                      key={record._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showRecordDetail(record);
                      }}
                    >
                      <div className="flex justify-between items-center text-sm text-gray-700">
                        <div className="flex-1 text-left">
                          <span className="font-medium">編號：</span>{record.qrCodeNumber}
                        </div>
                        <div className="flex-1 text-center">
                          <span className="font-medium">地區：</span>{getRegionName(record.regionCode)}
                        </div>
                        <div className="flex-1 text-right">
                          <span className="font-medium">產品：</span>{record.productDescription}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 記錄詳情模態框 */}
      {selectedRecord && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[45] flex items-center justify-center bg-white"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">二維碼詳情</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* 顯示二維碼預覽 */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 border border-gray-300 rounded-lg mb-4 flex items-center justify-center bg-gray-50">
                  <img
                    src={`data:image/svg+xml;base64,${btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="white"/>
                        <text x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="8">
                          QR Code Preview
                        </text>
                      </svg>
                    `)}`}
                    alt="QR Code Preview"
                    className="w-full h-full object-contain"
                    onLoad={async () => {
                      try {
                        const qrCodeDataURL = await QRCode.toDataURL(selectedRecord.qrCodeData, {
                          width: 192,
                          margin: 2,
                          color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                          }
                        });
                        const imgElement = document.querySelector(`img[alt="QR Code Preview"]`) as HTMLImageElement;
                        if (imgElement) {
                          imgElement.src = qrCodeDataURL;
                        }
                      } catch (error) {
                        console.error('生成預覽二維碼失敗:', error);
                      }
                    }}
                  />
                </div>

                <div className="text-left mb-4 space-y-1 px-4">
                  <p className="text-sm text-gray-700 font-medium">編號：{selectedRecord.qrCodeNumber}</p>
                  <p className="text-sm text-gray-700 font-medium">地區：{getRegionName(selectedRecord.regionCode)}</p>
                  <p className="text-sm text-gray-700 font-medium">產品：{selectedRecord.productDescription}</p>
                </div>

                <button
                  onClick={() => printHistoryQRCode(selectedRecord)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  打印此二維碼
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}