ALTER TABLE qq_bindings 
  ADD COLUMN qq_message_delivery VARCHAR(16) DEFAULT 'group' 
  COMMENT 'QQ消息投递方式: group=群聊接收, private=私聊接收';
