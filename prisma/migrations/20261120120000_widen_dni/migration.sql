-- DNI goes up to 999.999.999 (9 digits). Widening a VARCHAR keeps every existing value.
ALTER TABLE "users" ALTER COLUMN "dni" SET DATA TYPE VARCHAR(9);
