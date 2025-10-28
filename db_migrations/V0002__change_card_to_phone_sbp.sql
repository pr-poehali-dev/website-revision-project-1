ALTER TABLE withdrawals RENAME COLUMN card_number TO phone_number;
ALTER TABLE withdrawals ALTER COLUMN phone_number TYPE VARCHAR(20);