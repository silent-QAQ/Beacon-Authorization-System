package com.beaconmc.auth;

import org.bukkit.plugin.java.JavaPlugin;

public class BeaconAuth extends JavaPlugin {
    private AuthManager authManager;

    @Override
    public void onEnable() {
        // 保存默认配置
        saveDefaultConfig();
        
        // 初始化管理器
        authManager = new AuthManager(this);
        
        // 注册API
        AuthAPI.setPlugin(this);
        
        getLogger().info("BeaconAuth 授权系统已启动！");
        getLogger().info("API 地址: " + getConfig().getString("auth.api-url"));
    }

    @Override
    public void onDisable() {
        getLogger().info("BeaconAuth 授权系统已停止！");
    }
    
    public AuthManager getAuthManager() {
        return authManager;
    }
}
