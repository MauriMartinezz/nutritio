-- Dev only: lets the app user create Prisma's temporary shadow database
-- used by `prisma migrate dev`.
GRANT ALL PRIVILEGES ON *.* TO 'nutritio'@'%';
FLUSH PRIVILEGES;
