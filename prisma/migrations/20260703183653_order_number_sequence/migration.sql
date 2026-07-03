-- Sequential human-readable order numbers (MT-000001). A Postgres sequence is
-- race-free without a counter table; gaps from rolled-back transactions are fine.
CREATE SEQUENCE "order_number_seq" START WITH 1 INCREMENT BY 1;
