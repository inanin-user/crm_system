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