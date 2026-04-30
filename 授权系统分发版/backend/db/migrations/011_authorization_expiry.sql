ALTER TABLE plugin_authorizations 
  ADD COLUMN expires_at TIMESTAMP NULL DEFAULT NULL 
  COMMENT '授权过期时间，NULL 表示永久有效';
