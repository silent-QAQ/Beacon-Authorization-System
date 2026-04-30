ALTER TABLE plugin_authorizations 
  ADD COLUMN auth_code VARCHAR(64) DEFAULT NULL 
  COMMENT '授权码，用户可使用此码在服务器端完成授权验证';
