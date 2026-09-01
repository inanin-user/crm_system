CREATE TABLE IF NOT EXISTS account_management (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user', 'member') NOT NULL DEFAULT 'user',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        locations JSON NOT NULL DEFAULT ('[]'),
        lastLogin DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        memberName VARCHAR(100) NULL,
        phone VARCHAR(20) NULL,
        herbalifePCNumber VARCHAR(50) NULL,
        joinDate DATE NULL,
        trainerIntroducer VARCHAR(100) NULL,
        referrer VARCHAR(100) NULL,
        quota INT NOT NULL DEFAULT 0,
        renewalCount INT NOT NULL DEFAULT 0,
        initialTickets INT NOT NULL DEFAULT 0,
        addedTickets INT NOT NULL DEFAULT 0,
        usedTickets INT NOT NULL DEFAULT 0
      );

-- Main settlement record: composite primary key (username, submitted_at)
CREATE TABLE IF NOT EXISTS settlements (
  username      VARCHAR(50)   NOT NULL,
  submitted_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  center        VARCHAR(10)   NOT NULL,
  doc_date      DATE          NOT NULL,
  doc_time      TIME          NOT NULL,
  grand_total   DECIMAL(10,2) NOT NULL DEFAULT 0,
  remarks       TEXT,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (username, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Staff-count line items: waterbar / class / introductionFee
CREATE TABLE IF NOT EXISTS settlement_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  submitted_at  DATETIME(3)  NOT NULL,
  section_type  ENUM('waterbar','class','introductionFee') NOT NULL,
  staff_name    VARCHAR(100) NOT NULL,
  quantity      INT NOT NULL DEFAULT 0,
  FOREIGN KEY (username, submitted_at)
    REFERENCES settlements(username, submitted_at) ON DELETE CASCADE,
  INDEX idx_settlement (username, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Income line items (試/單/卡)
CREATE TABLE IF NOT EXISTS settlement_income (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL,
  submitted_at  DATETIME(3)  NOT NULL,
  income_type   VARCHAR(10)  NOT NULL,
  quantity      INT NOT NULL DEFAULT 0,
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (username, submitted_at)
    REFERENCES settlements(username, submitted_at) ON DELETE CASCADE,
  INDEX idx_settlement (username, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- create_staff.sql
CREATE TABLE IF NOT EXISTS staff (
  username    VARCHAR(50) PRIMARY KEY,
  center      VARCHAR(10) NOT NULL,
  role        ENUM('admin', 'user', 'member') NOT NULL DEFAULT 'user',
  FOREIGN KEY (username)
    REFERENCES account_management(username)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- sql/migrations/004_create_modify_history.sql
CREATE TABLE IF NOT EXISTS modify_history (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  settlement_username      VARCHAR(50)  NOT NULL,
  settlement_submitted_at  DATETIME(3)  NOT NULL,
  modified_by              VARCHAR(50)  NOT NULL,
  modified_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  field_name                VARCHAR(50)  NOT NULL,
  previous_value  TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  updated_value   TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  FOREIGN KEY (settlement_username, settlement_submitted_at)
    REFERENCES settlements(username, submitted_at) ON DELETE CASCADE,
  INDEX idx_settlement (settlement_username, settlement_submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE financial_records (
  id CHAR(36) NOT NULL PRIMARY KEY,               -- unique string ID (UUID)
  recordType ENUM('income', 'expense') NOT NULL DEFAULT 'income', -- 記錄類型
  memberName VARCHAR(100) NOT NULL,               -- 成員姓名
  item VARCHAR(200) NOT NULL,                     -- 項目名稱
  details VARCHAR(1000),                          -- 詳細描述
  location ENUM('灣仔', '黃大仙', '石門') NOT NULL, -- 地點
  unitPrice DECIMAL(10,2) NOT NULL CHECK (unitPrice >= 0), -- 單價
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),   -- 數量
  totalAmount DECIMAL(12,2) NOT NULL CHECK (totalAmount >= 0), -- 總額
  recordDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 記錄日期
  createdBy CHAR(36) NOT NULL,                    -- 創建者ID (UUID from accounts table)
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 創建時間
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新時間

  -- Indexes for query optimization
  INDEX idx_recordType (recordType),
  INDEX idx_memberName (memberName),
  INDEX idx_recordDate (recordDate),
  INDEX idx_location (location),
  INDEX idx_createdBy (createdBy)
);



CREATE TABLE trainer_profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,          -- unique string ID (UUID)
  trainerId CHAR(36) NOT NULL UNIQUE,        -- 教练ID (references accounts table)
  trainerUsername VARCHAR(100) NOT NULL,     -- 教练用户名
  otherWorkHours INT NOT NULL DEFAULT 0 CHECK (otherWorkHours >= 0), -- 其他工作时间（小时）
  notes VARCHAR(500),                        -- 备注
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间

  -- Foreign key constraint to enforce trainerId reference
  CONSTRAINT fk_trainer_profiles_account FOREIGN KEY (trainerId)
    REFERENCES account_management(id),

  -- Indexes for query optimization
  INDEX idx_trainerId (trainerId),
  INDEX idx_trainerUsername (trainerUsername)
);


CREATE TABLE transactions (
  id CHAR(36) NOT NULL PRIMARY KEY,             -- UUID PK
  memberId CHAR(36) NOT NULL,                   -- FK to account_management.id
  memberName VARCHAR(100) NOT NULL,             -- 會員姓名
  qrCodeNumber VARCHAR(100) NOT NULL,           -- 二維碼編號
  productDescription VARCHAR(255) NOT NULL,     -- 項目/產品描述
  region VARCHAR(100) NOT NULL,                 -- 地區
  quotaUsed INT NOT NULL CHECK (quotaUsed >= 0),-- 使用的quota數量
  previousQuota INT NOT NULL,                   -- 交易前的quota
  newQuota INT NOT NULL,                        -- 交易後的quota
  transactionDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 交易日期
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key
  CONSTRAINT fk_transactions_member FOREIGN KEY (memberId)
    REFERENCES account_management(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes
  INDEX idx_memberId_transactionDate (memberId, transactionDate),
  INDEX idx_memberName (memberName),
  INDEX idx_qrCodeNumber (qrCodeNumber),
  INDEX idx_region (region),
  INDEX idx_productDescription (productDescription)
);
