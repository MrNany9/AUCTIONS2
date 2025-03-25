-- Schema for Carpentry Tenders Database
-- SQLite schema definition

-- Tenders table - stores main tender information
CREATE TABLE tenders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT,                 -- Original ID from source
    title TEXT NOT NULL,              -- Tender title
    description TEXT,                 -- Full description
    publisher TEXT NOT NULL,          -- Publishing organization
    publish_date TEXT,                -- Publication date
    submission_date TEXT,             -- Submission deadline
    status TEXT,                      -- Current status (open, closed, etc.)
    url TEXT,                         -- Original URL
    source TEXT NOT NULL,             -- Source website (mr.gov.il, wizbiz, govi)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table - stores category information
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,        -- Category name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tender_Categories table - many-to-many relationship between tenders and categories
CREATE TABLE tender_categories (
    tender_id INTEGER,
    category_id INTEGER,
    PRIMARY KEY (tender_id, category_id),
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Contacts table - stores contact information for tenders
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tender_id INTEGER NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- Documents table - stores document information for tenders
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tender_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- Users table - stores user information
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved_Tenders table - stores user saved tenders
CREATE TABLE saved_tenders (
    user_id INTEGER,
    tender_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tender_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

-- Notifications table - stores user notification preferences
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,              -- NULL means all categories
    keyword TEXT,                     -- Keyword to match in tender title/description
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_tenders_external_id ON tenders(external_id);
CREATE INDEX idx_tenders_publish_date ON tenders(publish_date);
CREATE INDEX idx_tenders_submission_date ON tenders(submission_date);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_source ON tenders(source);
CREATE INDEX idx_contacts_tender_id ON contacts(tender_id);
CREATE INDEX idx_documents_tender_id ON documents(tender_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
