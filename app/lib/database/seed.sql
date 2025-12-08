SET search_path TO public;

-- 插入用户，角色不同
INSERT INTO "user" (
  "id",
  "name",
  "email",
  "emailVerified",
  "image",
  "role",
  "banned",
  "banReason",
  "banExpires",
  "createdAt",
  "updatedAt"
) VALUES
-- 普通用户
(
  'hRoDLF1IPqHEY7IF4ooENPgXdGSyr5Aj',
  'Anon',
  'anon@chilfish.top',
  TRUE,  -- 使用布尔值 TRUE 替换 1
  null,
  'user',
  FALSE, -- 使用布尔值 FALSE 替换 0
  null,
  null,
  to_timestamp(1704067200), -- 将 Unix 时间戳转换为 timestamptz
  to_timestamp(1704067200)
),
-- 管理员用户
(
  'F9CgW4v5USKvUNTIGBiafa6xrgDjaOhS',
  'Jane Smith',
  'admin@example.com',
  TRUE,
  null,
  'admin',
  FALSE,
  null,
  null,
  to_timestamp(1704067200),
  to_timestamp(1704067200)
);

-- 为用户插入账户信息
INSERT INTO "account" (
  "id",
  "accountId",
  "providerId",
  "userId",
  "accessToken",
  "refreshToken",
  "idToken",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "scope",
  "password",
  "createdAt",
  "updatedAt"
) VALUES
-- 普通用户的账户 (邮箱/密码提供商)
(
  'Ostf4Fx16wNiBV7Et6DDJzLWWEAZ0FyJ',
  'john@example.com',
  'credential',
  'nt2AZZSr3ci6OWUpEG38f7GZwUBJ01CZ',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '9eef0c5c41fddc1869f3e27dd52b8aea:5c25fec52b69576c13cbd06e013d2fe5fba3742ef9128cc98fa70e6ba9f8206a564bbdeaee23c8a295f96246d5ca465db86b025185924447eef94b3f6801dcb4', -- 哈希后的密码: 'user@9900'
  to_timestamp(1704067200),
  to_timestamp(1704067200)
),
-- 管理员用户的账户 (邮箱/密码提供商)
(
  'W8Oa8UCI6sKswFaF8uzIKkmRfP3HRIaD',
  'admin@example.com',
  'credential',
  'F9CgW4v5USKvUNTIGBiafa6xrgDjaOhS',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'b47e2466463c1b19d5a58f3e15775889:3f35be608e65080399c90ebe4731176a5c91d976da03ad08b22d065e56f1f1db5eea6e3ef71451f7bc6b58398e3ffa03acc3ca193d5997a4881897503c29a4a5', -- 哈希后的密码: 'admin@8899'
  to_timestamp(1704067200),
  to_timestamp(1704067200)
);
