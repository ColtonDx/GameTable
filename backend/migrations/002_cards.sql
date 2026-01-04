-- Cards table for Scryfall card metadata
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    collector_number VARCHAR(20) NOT NULL,
    set_code VARCHAR(10) NOT NULL,
    set_name VARCHAR(255) NOT NULL,
    is_two_sided BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, collector_number, set_code)
);

-- Index for faster lookups by set_code and collector_number
CREATE INDEX IF NOT EXISTS idx_cards_set_collector ON cards(set_code, collector_number);

-- Index for faster lookups by set_code
CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
